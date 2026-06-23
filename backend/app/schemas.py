"""
Pydantic request/response schemas.

These define the JSON shape the API accepts and returns (validation +
serialization). They are separate from the SQLAlchemy ORM model.
"""

from datetime import datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# --- Recruiter Auth (Legacy / Local) ---

class RecruiterRegister(BaseModel):
    """Body for POST /api/recruiter/register."""

    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)  # raw password, hashed before storage
    company_name: str = Field(..., min_length=1)
    phone: Optional[str] = None


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
    phone: Optional[str] = None
    created_at: datetime

    # Allow building this schema directly from the ORM object.
    model_config = {"from_attributes": True}


class Token(BaseModel):
    """JWT returned on register/login."""

    access_token: str
    token_type: str = "bearer"
    recruiter: RecruiterOut


# --- Admin Auth ---

class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminRegister(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class AdminOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminOut


class AdminStats(BaseModel):
    recruiters: int
    candidates: int
    pools: int
    activePools: int


# --- Recruiter Supabase Auth ---

class RecruiterSupabaseRegister(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)
    company_name: str = Field(..., min_length=1)
    phone: Optional[str] = None


class RecruiterSupabaseLogin(BaseModel):
    email: EmailStr
    password: str


class RecruiterSupabaseOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    company_name: str
    phone: Optional[str] = None
    created_at: datetime


class RecruiterSupabaseToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    recruiter: RecruiterSupabaseOut


# --- Job Pools ---

class JobPoolCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: Optional[str] = None
    status: Optional[bool] = True
    main_mission: Optional[str] = None
    location: Optional[str] = None
    contract_type: Optional[str] = None
    experience_level: Optional[str] = None
    seniority_level: Optional[str] = None
    years_experience: Optional[int] = None
    experience_range: Optional[str] = None
    education_level: Optional[str] = None
    languages: Optional[List[str]] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    must_have_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    deal_breakers: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    notes: Optional[str] = None


class JobPoolUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    main_mission: Optional[str] = None
    location: Optional[str] = None
    contract_type: Optional[str] = None
    experience_level: Optional[str] = None
    seniority_level: Optional[str] = None
    years_experience: Optional[int] = None
    experience_range: Optional[str] = None
    education_level: Optional[str] = None
    languages: Optional[List[str]] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    must_have_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    deal_breakers: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    notes: Optional[str] = None


class JobPoolOut(BaseModel):
    id: UUID
    hr_id: UUID
    public_token: str
    title: str
    company_name: Optional[str] = None
    status: bool
    main_mission: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    contract_type: Optional[str] = None
    experience_level: Optional[str] = None
    seniority_level: Optional[str] = None
    years_experience: Optional[int] = None
    experience_range: Optional[str] = None
    education_level: Optional[str] = None
    languages: Optional[List[str]] = None
    salary_range: Optional[str] = None
    deadline: Optional[datetime] = None
    must_have_skills: Optional[List[str]] = None
    nice_to_have_skills: Optional[List[str]] = None
    soft_skills: Optional[List[str]] = None
    deal_breakers: Optional[List[str]] = None
    responsibilities: Optional[List[str]] = None
    notes: Optional[str] = None
    created_at: datetime

