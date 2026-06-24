"""User-management schemas (candidates + recruiters).

Only fields that exist on the live tables are accepted. Update schemas are fully
optional (PATCH semantics) so the admin can edit any subset of a user's data.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr


# --- Candidates --------------------------------------------------------------

class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None


class CandidateUpdate(BaseModel):
    """Editable candidate_profiles columns (all optional)."""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    title: Optional[str] = None
    phone_number: Optional[str] = None
    linkedin_url: Optional[str] = None
    current_job_title: Optional[str] = None
    current_company: Optional[str] = None
    years_of_experience: Optional[int] = None
    city: Optional[str] = None
    education_level: Optional[str] = None
    university_name: Optional[str] = None
    field_of_study: Optional[str] = None
    languages: Optional[list[str]] = None
    expected_salary_min: Optional[float] = None
    expected_salary_max: Optional[float] = None
    open_to_work: Optional[bool] = None


# --- Recruiters --------------------------------------------------------------

class RecruiterCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    company_name: str
    phone: Optional[str] = None


class RecruiterUpdate(BaseModel):
    """Editable hr_profiles columns (all optional)."""

    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    company_description: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    company_website: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    company_email: Optional[EmailStr] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    company_founded_year: Optional[int] = None
