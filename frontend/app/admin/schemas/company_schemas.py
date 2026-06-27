"""Company schemas.

Companies are derived from hr_profiles (no companies table). Editing a company
updates the company_* columns on every recruiter sharing that company name.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr


class CompanyUpdate(BaseModel):
    company_description: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    company_website: Optional[str] = None
    company_linkedin_url: Optional[str] = None
    company_email: Optional[EmailStr] = None
    company_phone: Optional[str] = None
    company_address: Optional[str] = None
    company_founded_year: Optional[int] = None
