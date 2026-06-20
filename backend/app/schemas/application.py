from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ApplicationCreate(BaseModel):
    candidate_id: int
    offer_id: int


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    matching_score: Optional[float] = None
    interview_link: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    offer_id: int
    matching_score: float
    status: str
    interview_link: Optional[str]
    application_date: datetime

    class Config:
        from_attributes = True