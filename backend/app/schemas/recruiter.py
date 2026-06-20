"""
Pydantic request/response schemas for recruiter auth.

These define the JSON shape the API accepts and returns (validation +
serialization). They are separate from the SQLAlchemy ORM model.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RecruiterRegister(BaseModel):
    """Body for POST /api/recruiter/register."""

    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)  # raw password, hashed before storage
    company_name: str = Field(..., min_length=1)
    phone: str | None = None


class RecruiterLogin(BaseModel):
    """Body for POST /api/recruiter/login."""

    email: EmailStr
    password: str


class RecruiterOut(BaseModel):
    """Public recruiter representation (never includes password_hash)."""

    id: UUID
    full_name: str
    email: EmailStr
    company_name: str
    phone: str | None = None
    created_at: datetime

    # Allow building this schema directly from the ORM object.
    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT returned on register/login."""

    access_token: str
    token_type: str = "bearer"
    recruiter: RecruiterOut
