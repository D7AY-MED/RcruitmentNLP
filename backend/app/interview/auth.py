import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import SUPABASE_JWT_SECRET

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class CandidateAuth:
    def __init__(self, candidate_id: str, name: str, email: str):
        self.candidate_id = candidate_id
        self.name = name
        self.email = email


DEFAULT_RECRUITER_ID = None


async def get_current_candidate(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> CandidateAuth | None:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    if not SUPABASE_JWT_SECRET:
        logger.warning("SUPABASE_JWT_SECRET is not set; skipping JWT verification.")
        return CandidateAuth(
            candidate_id="dev-candidate-id",
            name="Dev Candidate",
            email="dev@example.com",
        )

    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    candidate_id = payload.get("sub")
    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {}) or {}
    name = user_metadata.get("full_name", email.split("@")[0] if email else "Candidate")

    if not candidate_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload.",
        )

    return CandidateAuth(
        candidate_id=candidate_id,
        name=name,
        email=email,
    )
