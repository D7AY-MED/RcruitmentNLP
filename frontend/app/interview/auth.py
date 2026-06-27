import logging

from fastapi import Depends, HTTPException, status

from app.auth import get_supabase, verify_token

logger = logging.getLogger(__name__)


class CandidateAuth:
    def __init__(self, candidate_id: str, name: str, email: str):
        self.candidate_id = candidate_id
        self.name = name
        self.email = email


DEFAULT_RECRUITER_ID = None


async def get_current_candidate(
    user_id: str = Depends(verify_token),
) -> CandidateAuth:
    client = get_supabase()
    try:
        sb_user = client.auth.admin.get_user_by_id(user_id)
    except Exception as e:
        logger.warning("Failed to fetch candidate user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate candidate.",
        )

    meta = (sb_user.user.user_metadata or {}) if sb_user else {}
    email = sb_user.user.email if sb_user else ""
    name = meta.get("full_name", email.split("@")[0] if email else "Candidate")

    return CandidateAuth(
        candidate_id=user_id,
        name=name,
        email=email,
    )
