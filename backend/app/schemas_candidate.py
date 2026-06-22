from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CandidateRegister(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: str | None = None


class CandidateLogin(BaseModel):
    email: EmailStr
    password: str


class CandidateOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CandidateToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    candidate: CandidateOut
