from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class JobOfferCreate(BaseModel):
    recruiter_id: int
    company_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    required_skills: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    salary: Optional[str] = None


class JobOfferUpdate(BaseModel):
    company_name: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[str] = None
    location: Optional[str] = None
    experience_level: Optional[str] = None
    salary: Optional[str] = None
    is_published: Optional[bool] = None


class JobOfferResponse(BaseModel):
    id: int
    recruiter_id: int
    company_name: Optional[str]
    title: str
    description: Optional[str]
    required_skills: Optional[str]
    location: Optional[str]
    experience_level: Optional[str]
    salary: Optional[str]
    is_published: bool
    publication_date: datetime

    class Config:
        from_attributes = True