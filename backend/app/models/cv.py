from sqlalchemy import Column, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    file_path = Column(Text)

    extracted_text = Column(Text)

    skills = Column(Text)

    experiences = Column(Text)

    diplomas = Column(Text)

    languages = Column(Text)

    is_processed = Column(Boolean, default=False)

    upload_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="cvs")