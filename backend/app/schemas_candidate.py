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


class CandidateProfileUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    title: str | None = None
    phone_number: str | None = None
    linkedin_url: str | None = None
    current_job_title: str | None = None
    current_company: str | None = None
    years_of_experience: int | None = None
    city: str | None = None
    education_level: str | None = None
    university_name: str | None = None
    field_of_study: str | None = None
    languages: list[str] | None = None
    expected_salary_min: float | None = None
    expected_salary_max: float | None = None
    profile_picture_url: str | None = None
    open_to_work: bool | None = None


class CandidateOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    phone: str | None = None
    title: str | None = None
    phone_number: str | None = None
    linkedin_url: str | None = None
    current_job_title: str | None = None
    current_company: str | None = None
    years_of_experience: int | None = None
    city: str | None = None
    education_level: str | None = None
    university_name: str | None = None
    field_of_study: str | None = None
    languages: list[str] | None = None
    expected_salary_min: float | None = None
    expected_salary_max: float | None = None
    profile_picture_url: str | None = None
    cv_url: str | None = None
    open_to_work: bool | None = True
    created_at: datetime

    model_config = {"from_attributes": True}


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class CandidateToken(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    candidate: CandidateOut
