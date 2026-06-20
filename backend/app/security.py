"""
Security helpers: password hashing (passlib/bcrypt) and JWT handling (python-jose).

Also exposes `get_current_recruiter`, a FastAPI dependency that authenticates a
request from its `Authorization: Bearer <token>` header.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import JWT_ALGORITHM, JWT_EXPIRE_MINUTES, JWT_SECRET_KEY
from app.database import get_db
from app.models.recruiter import Recruiter
from app.models.user import User

# Tells FastAPI/Swagger where the login endpoint is and how to read the token.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/recruiter/login")


# --- Passwords ---------------------------------------------------------------
# We use the `bcrypt` library directly. (passlib is unmaintained and crashes
# with bcrypt 5.x, which is the only bcrypt build available for Python 3.14.)

# bcrypt only hashes the first 72 bytes; encode + truncate to stay within that
# limit so long passwords don't raise and verification stays consistent.
def _to_bcrypt_bytes(plain_password: str) -> bytes:
    return plain_password.encode("utf-8")[:72]


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash for the given raw password."""
    return bcrypt.hashpw(_to_bcrypt_bytes(plain_password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a raw password against a stored bcrypt hash."""
    return bcrypt.checkpw(_to_bcrypt_bytes(plain_password), password_hash.encode("utf-8"))


# --- JWT ---------------------------------------------------------------------

def create_access_token(recruiter_id: str) -> str:
    """Create a signed JWT whose `sub` claim is the recruiter id."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    payload = {"sub": str(recruiter_id), "exp": expire}
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_recruiter(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Recruiter:
    """Decode the bearer token and return the matching recruiter, or 401."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        recruiter_id = payload.get("sub")
        if recruiter_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    recruiter = db.query(Recruiter).filter(Recruiter.id == recruiter_id).first()
    if recruiter is None:
        raise credentials_error
    return recruiter

def require_admin(user: User):
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

def require_role(user: User, roles: list[str]):
    if user.role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )