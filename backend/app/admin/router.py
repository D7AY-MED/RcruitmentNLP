import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from supabase import create_client

from app.config import (
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_JWT_SECRET,
    JWT_ALGORITHM,
    ADMIN_SETUP_TOKEN,
)
from app.security import hash_password
from app.schemas import (
    AdminLogin,
    AdminRegister,
    AdminOut,
    AdminToken,
    AdminStats,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

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

admin_bearer = HTTPBearer()

def _parse_datetime(val) -> datetime:
    if val is None:
        return datetime.now(timezone.utc)
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00"))
        except ValueError:
            pass
    return datetime.now(timezone.utc)

async def get_current_admin(credentials=Depends(admin_bearer)) -> dict:
    import httpx
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY
            },
            timeout=10
        )
        if resp.status_code != 200:
            raise credentials_error
        user_data = resp.json()
        admin_id = user_data.get("id")
        if admin_id is None:
            raise credentials_error
    except Exception as e:
        logger.warning("JWT verification failed: %s", e)
        raise credentials_error
        
    client = _get_supabase_client()
    
    # Query admin_profiles table to verify admin membership
    result = client.table("admin_profiles").select("*").eq("id", admin_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an administrator.",
        )
        
    return result.data[0]


@router.get("/health")
async def health():
    """Liveness check for the administrator service area."""
    logger.info("admin health ok")
    return {"status": "ok", "service": "admin"}


@router.get("/capabilities")
async def capabilities():
    """Describe the admin features and where each one is served."""
    logger.info("serving admin capabilities")
    return {
        "service": "admin",
        "user_management": {
            "served_by": "fastapi",
            "actions": [
                "list_recruiters",
                "create_recruiter",
                "delete_recruiter",
                "list_candidates",
                "create_candidate",
                "delete_candidate",
                "dashboard_stats",
            ],
        },
        "backend_features": {
            "served_by": "fastapi",
            "actions": [],
        },
    }


# --- Admin Auth Endpoints ---

@router.post("/login", response_model=AdminToken)
async def login(payload: AdminLogin):
    client = _get_supabase_client()
    
    # 1. Sign in via Supabase Auth
    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
        
    user_id = session.user.id
    
    # 2. Gate on admin_profiles table membership
    result = client.table("admin_profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not an administrator.",
        )
        
    admin_profile = result.data[0]
    
    return AdminToken(
        access_token=session.session.access_token,
        token_type="bearer",
        admin=AdminOut(
            id=UUID(admin_profile["id"]) if isinstance(admin_profile["id"], str) else admin_profile["id"],
            full_name=admin_profile["full_name"],
            email=admin_profile["email"],
            created_at=_parse_datetime(admin_profile.get("created_at"))
        )
    )


@router.get("/me", response_model=AdminOut)
async def me(current=Depends(get_current_admin)):
    return AdminOut(
        id=UUID(current["id"]) if isinstance(current["id"], str) else current["id"],
        full_name=current["full_name"],
        email=current["email"],
        created_at=_parse_datetime(current.get("created_at"))
    )


@router.post("/register", response_model=AdminToken, status_code=status.HTTP_201_CREATED)
async def register(payload: AdminRegister, x_admin_setup_token: Optional[str] = Header(None)):
    if not ADMIN_SETUP_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin bootstrap is disabled. Set ADMIN_SETUP_TOKEN to enable it.",
        )
        
    if x_admin_setup_token != ADMIN_SETUP_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid setup token.",
        )
        
    client = _get_supabase_client()
    
    # 1. Create auth user (email_confirm true)
    try:
        created = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "role": "admin"
            }
        })
    except Exception as e:
        msg = str(e)
        is_duplicate = "already" in msg or "exist" in msg
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if is_duplicate else status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists." if is_duplicate else msg,
        )
        
    user_id = created.user.id
    
    # 2. Insert admin profile
    try:
        password_hash = hash_password(payload.password)
        profile_data = {
            "id": user_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "password": password_hash
        }
        client.table("admin_profiles").upsert(profile_data).execute()
    except Exception as e:
        # rollback
        try:
            client.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin profile creation failed: {e}",
        )
        
    # 3. Log in
    try:
        session = client.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })
    except Exception as e:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Admin created, but login failed. Details: {e}",
        )
         
    return AdminToken(
        access_token=session.session.access_token,
        token_type="bearer",
        admin=AdminOut(
            id=user_id,
            full_name=payload.full_name,
            email=payload.email,
            created_at=_parse_datetime(getattr(created.user, "created_at", None))
        )
    )


# --- Platform stats ---

def _count_table(client, table: str, status_filter: Optional[bool] = None) -> int:
    query = client.table(table).select("*", count="exact")
    if status_filter is not None:
        query = query.eq("status", status_filter)
    res = query.execute()
    return res.count if res.count is not None else len(res.data)


@router.get("/stats", response_model=AdminStats)
async def get_stats(_current=Depends(get_current_admin)):
    client = _get_supabase_client()
    try:
        recruiters = _count_table(client, "hr_profiles")
        candidates = _count_table(client, "candidate_profiles")
        pools = _count_table(client, "job_pools")
        active_pools = _count_table(client, "job_pools", status_filter=True)
        return AdminStats(
            recruiters=recruiters,
            candidates=candidates,
            pools=pools,
            activePools=active_pools
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stats error - {e}",
        )


# --- Candidate Management ---

@router.get("/candidates")
async def list_candidates(_current=Depends(get_current_admin)):
    client = _get_supabase_client()
    res = client.table("candidate_profiles").select("*").order("created_at", desc=True).execute()
    return res.data


@router.post("/candidates", status_code=status.HTTP_201_CREATED)
async def create_candidate(payload: AdminRegister, phone: Optional[str] = None, _current=Depends(get_current_admin)):
    client = _get_supabase_client()
    
    # 1. Create auth user
    try:
        created = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "phone": phone
            }
        })
    except Exception as e:
        msg = str(e)
        is_duplicate = "already" in msg or "exist" in msg
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if is_duplicate else status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists." if is_duplicate else msg,
        )
        
    user_id = created.user.id
    
    # 2. Insert profile
    try:
        profile_data = {
            "id": user_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "phone": phone
        }
        res = client.table("candidate_profiles").upsert(profile_data).execute()
        return res.data[0]
    except Exception as e:
        try:
            client.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {e}",
        )


@router.delete("/candidates/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_candidate(id: UUID, _current=Depends(get_current_admin)):
    client = _get_supabase_client()
    user_id = str(id)
    
    # Delete profile first (safe cascade)
    client.table("candidate_profiles").delete().eq("id", user_id).execute()
    
    # Delete auth user (idempotent check)
    try:
        client.auth.admin.delete_user(user_id)
    except Exception as e:
        if "not found" not in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete candidate: {e}",
            )
            
    # return custom 204 response
    from fastapi.responses import Response
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Recruiter Management ---

@router.get("/recruiters")
async def list_recruiters(_current=Depends(get_current_admin)):
    client = _get_supabase_client()
    res = client.table("hr_profiles").select("*").order("created_at", desc=True).execute()
    return res.data


@router.post("/recruiters", status_code=status.HTTP_201_CREATED)
async def create_recruiter(payload: AdminRegister, company_name: str, phone: Optional[str] = None, _current=Depends(get_current_admin)):
    client = _get_supabase_client()
    
    # 1. Create auth user
    try:
        created = client.auth.admin.create_user({
            "email": payload.email,
            "password": payload.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": payload.full_name,
                "company_name": company_name,
                "phone": phone
            }
        })
    except Exception as e:
        msg = str(e)
        is_duplicate = "already" in msg or "exist" in msg
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT if is_duplicate else status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists." if is_duplicate else msg,
        )
        
    user_id = created.user.id
    
    # 2. Insert profile
    try:
        profile_data = {
            "id": user_id,
            "full_name": payload.full_name,
            "email": payload.email,
            "company_name": company_name,
            "phone": phone
        }
        res = client.table("hr_profiles").upsert(profile_data).execute()
        return res.data[0]
    except Exception as e:
        try:
            client.auth.admin.delete_user(user_id)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {e}",
        )


@router.delete("/recruiters/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recruiter(id: UUID, _current=Depends(get_current_admin)):
    client = _get_supabase_client()
    user_id = str(id)
    
    # Delete profile first
    client.table("hr_profiles").delete().eq("id", user_id).execute()
    
    # Delete auth user
    try:
        client.auth.admin.delete_user(user_id)
    except Exception as e:
        if "not found" not in str(e).lower():
             raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete recruiter: {e}",
            )
             
    from fastapi.responses import Response
    return Response(status_code=status.HTTP_204_NO_CONTENT)

