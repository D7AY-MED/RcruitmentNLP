import logging
from datetime import datetime, timezone
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from supabase import create_client

from app.config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer()


def get_supabase():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client not initialized.",
        )
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def parse_datetime(val) -> datetime:
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


async def verify_token(credentials=Depends(bearer_scheme)) -> str:
    import httpx
    token = credentials.credentials
    err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        resp = httpx.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "Authorization": f"Bearer {token}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
            },
            timeout=10,
        )
        if resp.status_code != 200:
            raise err
        user_id = resp.json().get("id")
        if not user_id:
            raise err
        return user_id
    except httpx.RequestError as e:
        logger.warning("Token verification request failed: %s", e)
        raise err


async def get_current_recruiter(user_id: str = Depends(verify_token)) -> dict:
    client = get_supabase()
    result = client.table("hr_profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a registered recruiter.",
        )
    return result.data[0]


async def get_current_candidate(user_id: str = Depends(verify_token)) -> dict:
    client = get_supabase()
    result = client.table("candidate_profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a registered candidate.",
        )
    return result.data[0]


async def get_current_admin(user_id: str = Depends(verify_token)) -> dict:
    client = get_supabase()
    result = client.table("admin_profiles").select("*").eq("id", user_id).limit(1).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not an administrator.",
        )
    return result.data[0]
