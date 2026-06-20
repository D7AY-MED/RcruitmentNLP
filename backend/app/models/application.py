from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(Integer, ForeignKey("users.id"))

    offer_id = Column(Integer, ForeignKey("job_offers.id"))

    matching_score = Column(Float, default=0)

    status = Column(String(50), default="PENDING")

    interview_link = Column(Text, nullable=True)

    application_date = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("User", back_populates="applications")

    job_offer = relationship("JobOffer", back_populates="applications")