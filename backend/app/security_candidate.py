from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt

from app.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, SUPABASE_JWT_SECRET

candidate_bearer = HTTPBearer()


def create_candidate_token(candidate_id: str, email: str = "", full_name: str = "") -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {
        "sub": candidate_id,
        "email": email,
        "user_metadata": {"full_name": full_name},
        "exp": expire,
    }
    return jwt.encode(payload, SUPABASE_JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_candidate(credentials=Depends(candidate_bearer)):
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={"verify_aud": False},
        )
        candidate_id = payload.get("sub")
        if candidate_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    email = payload.get("email", "")
    user_metadata = payload.get("user_metadata", {}) or {}
    name = user_metadata.get("full_name", email.split("@")[0] if email else "Candidate")

    return {
        "id": candidate_id,
        "email": email,
        "full_name": name,
    }
