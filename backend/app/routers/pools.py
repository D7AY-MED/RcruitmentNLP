import logging
import re
import random
import string
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client

from ..services.gemini_store_service import GeminiStoreService
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from app.routers.recruiter_supabase import get_current_recruiter
from app.schemas import JobPoolCreate, JobPoolUpdate, JobPoolOut

logger = logging.getLogger(__name__)

# Legacy router for /api/v1/pools
router = APIRouter(prefix="/api/v1/pools", tags=["pools"])
gemini_service = GeminiStoreService()

# New router for /api/v1/job-pools
job_pools_router = APIRouter(prefix="/api/v1/job-pools", tags=["job-pools"])

_supabase = (
    create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    else None
)

def _get_supabase_client():
    if _supabase is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized.",
        )
    return _supabase

class CreateGeminiStoreRequest(BaseModel):
    pool_id: str
    pool_title: str
    recruiter_id: str


class CreateGeminiStoreResponse(BaseModel):
    store_name: str
    store_display_name: str


def _sanitise_name(title: str) -> str:
    s = title.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    return s[:60]


@router.post("/gemini-store", response_model=CreateGeminiStoreResponse)
async def create_gemini_store(req: CreateGeminiStoreRequest):
    title_slug = _sanitise_name(req.pool_title)
    recruiter_tag = req.recruiter_id[:8]
    display_name = f"pool-{title_slug}-{recruiter_tag}"

    try:
        store = gemini_service.create_store(display_name)
    except RuntimeError as e:
        logger.error("Gemini client error: %s", e)
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error("Failed to create Gemini store: %s", e)
        raise HTTPException(status_code=500, detail=f"Gemini store creation failed: {e}")

    return CreateGeminiStoreResponse(
        store_name=store.name,
        store_display_name=store.display_name,
    )


# --- Job Pools API Endpoints ---

def _generate_public_token(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{slug}-{suffix}"


@job_pools_router.get("", response_model=List[JobPoolOut])
async def list_job_pools(recruiter=Depends(get_current_recruiter)):
    client = _get_supabase_client()
    hr_id = recruiter["id"]
    
    result = client.table("job_pools").select("*").eq("hr_id", hr_id).order("created_at", desc=True).execute()
    # Map raw rows to output schemas, adding company_name from current recruiter context
    out = []
    for row in result.data:
        row["company_name"] = recruiter.get("company_name")
        out.append(row)
    return out


@job_pools_router.post("", response_model=JobPoolOut, status_code=status.HTTP_201_CREATED)
async def create_job_pool(payload: JobPoolCreate, recruiter=Depends(get_current_recruiter)):
    client = _get_supabase_client()
    hr_id = recruiter["id"]
    
    # 1. Upsert profile in hr_profiles (idempotency check / user metadata sync)
    profile_data = {
        "id": hr_id,
        "full_name": recruiter.get("full_name", "Recruiter"),
        "email": recruiter.get("email"),
        "company_name": recruiter.get("company_name", ""),
        "phone": recruiter.get("phone"),
    }
    client.table("hr_profiles").upsert(profile_data).execute()
    
    # 2. Insert new job pool
    pool_token = _generate_public_token(payload.title)
    pool_data = payload.model_dump(exclude_none=True)
    pool_data["hr_id"] = hr_id
    pool_data["public_token"] = pool_token
    pool_data["status"] = payload.status if payload.status is not None else True
    
    # Format dates
    if payload.deadline:
        pool_data["deadline"] = payload.deadline.isoformat()
        
    res = client.table("job_pools").insert(pool_data).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create job pool record.")
        
    created_pool = res.data[0]
    created_pool["company_name"] = recruiter.get("company_name")
    
    # 3. Trigger Gemini store creation
    try:
        title_slug = _sanitise_name(created_pool["title"])
        recruiter_tag = str(created_pool["hr_id"])[:8]
        display_name = f"pool-{title_slug}-{recruiter_tag}"
        gemini_service.create_store(display_name)
    except Exception as err:
        logger.warning("Gemini store creation skipped in pool creation: %s", err)
        
    return created_pool


@job_pools_router.get("/public", response_model=JobPoolOut)
async def get_public_job_pool(token: str):
    client = _get_supabase_client()
    
    # Join with hr_profiles to fetch the recruiter company_name
    result = client.table("job_pools").select("*, hr_profiles(*)").eq("public_token", token).eq("status", True).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job pool not found or disabled.")
        
    row = result.data[0]
    hr_profile = row.get("hr_profiles") or {}
    row["company_name"] = hr_profile.get("company_name")
    return row


@job_pools_router.get("/{id}", response_model=JobPoolOut)
async def get_job_pool(id: UUID, recruiter=Depends(get_current_recruiter)):
    client = _get_supabase_client()
    hr_id = recruiter["id"]
    
    result = client.table("job_pools").select("*").eq("id", str(id)).eq("hr_id", hr_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Job pool not found.")
        
    row = result.data[0]
    row["company_name"] = recruiter.get("company_name")
    return row


@job_pools_router.patch("/{id}", response_model=JobPoolOut)
async def update_job_pool(id: UUID, payload: JobPoolUpdate, recruiter=Depends(get_current_recruiter)):
    client = _get_supabase_client()
    hr_id = recruiter["id"]
    
    # Check ownership
    existing = client.table("job_pools").select("id").eq("id", str(id)).eq("hr_id", hr_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job pool not found.")
        
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update.")
        
    if payload.deadline:
        update_data["deadline"] = payload.deadline.isoformat()
        
    res = client.table("job_pools").update(update_data).eq("id", str(id)).execute()
    if not res.data:
         raise HTTPException(status_code=500, detail="Failed to update job pool.")
         
    updated_pool = res.data[0]
    updated_pool["company_name"] = recruiter.get("company_name")
    return updated_pool


@job_pools_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job_pool(id: UUID, recruiter=Depends(get_current_recruiter)):
    client = _get_supabase_client()
    hr_id = recruiter["id"]
    
    # Check ownership
    existing = client.table("job_pools").select("id").eq("id", str(id)).eq("hr_id", hr_id).limit(1).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job pool not found.")
        
    client.table("job_pools").delete().eq("id", str(id)).execute()
    return None

