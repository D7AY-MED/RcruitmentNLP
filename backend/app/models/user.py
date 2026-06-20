from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(255), nullable=False)

    email = Column(String(255), unique=True, nullable=False, index=True)

    password_hash = Column(String(255), nullable=False)

    role = Column(String(50), nullable=False)  # ADMIN / RECRUITER / CANDIDATE

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    cvs = relationship("CV", back_populates="user")

    job_offers = relationship("JobOffer", back_populates="recruiter")

    applications = relationship("Application", back_populates="candidate")