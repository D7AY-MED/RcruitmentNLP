import logging
import re

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.gemini_store_service import GeminiStoreService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/pools", tags=["pools"])
gemini_service = GeminiStoreService()


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
