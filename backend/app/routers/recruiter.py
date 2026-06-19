"""
Recruiter authentication endpoints.

Routes (mounted under the /api/recruiter prefix in main.py):
  POST /api/recruiter/register  -> create account, return JWT
  POST /api/recruiter/login     -> verify credentials, return JWT
  GET  /api/recruiter/me        -> return the authenticated recruiter
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.recruiter import Recruiter
from app.schemas import RecruiterLogin, RecruiterOut, RecruiterRegister, Token
from app.security import (
    create_access_token,
    get_current_recruiter,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/recruiter", tags=["recruiter-auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: RecruiterRegister, db: Session = Depends(get_db)):
    """Register a new recruiter and return a JWT for immediate login."""
    # Reject duplicate emails (the column is also UNIQUE at the DB level).
    existing = db.query(Recruiter).filter(Recruiter.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    recruiter = Recruiter(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),  # store hash, not raw password
        company_name=payload.company_name,
        phone=payload.phone,
    )
    db.add(recruiter)
    db.commit()
    db.refresh(recruiter)

    token = create_access_token(recruiter.id)
    return Token(access_token=token, recruiter=RecruiterOut.model_validate(recruiter))


@router.post("/login", response_model=Token)
def login(payload: RecruiterLogin, db: Session = Depends(get_db)):
    """Verify email + password and return a JWT."""
    recruiter = db.query(Recruiter).filter(Recruiter.email == payload.email).first()

    # Same error for unknown email or wrong password (avoid leaking which is wrong).
    if not recruiter or not verify_password(payload.password, recruiter.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(recruiter.id)
    return Token(access_token=token, recruiter=RecruiterOut.model_validate(recruiter))


@router.get("/me", response_model=RecruiterOut)
def me(current: Recruiter = Depends(get_current_recruiter)):
    """Return the recruiter identified by the Authorization bearer token."""
    return current
