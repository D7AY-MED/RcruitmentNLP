from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class JobOffer(Base):
    __tablename__ = "job_offers"

    id = Column(Integer, primary_key=True, index=True)

    recruiter_id = Column(Integer, ForeignKey("users.id"))

    company_name = Column(String(255), nullable=True)

    title = Column(String(255), nullable=False)

    description = Column(Text)

    required_skills = Column(Text)

    location = Column(String(255))

    experience_level = Column(String(100))

    salary = Column(String(100))

    is_published = Column(Boolean, default=False)

    publication_date = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    recruiter = relationship("User", back_populates="job_offers")

    applications = relationship("Application", back_populates="job_offer")