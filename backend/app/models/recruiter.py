"""
Recruiter ORM model.

Maps to the `recruiters` table in Supabase PostgreSQL.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class Recruiter(Base):
    __tablename__ = "recruiters"

    # UUID primary key generated app-side so we don't depend on a DB extension.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)  # bcrypt hash, never the raw password
    company_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)  # optional

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
