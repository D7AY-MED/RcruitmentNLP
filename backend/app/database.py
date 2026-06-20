"""
SQLAlchemy database setup.

Creates the engine + session factory and exposes:
  - Base:    declarative base every model inherits from.
  - get_db:  FastAPI dependency yielding a request-scoped DB session.
  - init_db: creates tables from the models' metadata (used at startup).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool

from app.config import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
        "and fill in your Supabase connection string."
    )

# We use the psycopg3 driver. Normalize a plain "postgresql://" URL (as stored
# in .env) to the SQLAlchemy "postgresql+psycopg://" form so the right driver
# is selected without the user having to edit the connection string.
_db_url = DATABASE_URL
if _db_url.startswith("postgresql://"):
    _db_url = _db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# pool_pre_ping=True transparently recycles connections dropped by the
# Supabase pooler, avoiding stale-connection errors on idle apps.
engine = create_engine(_db_url, pool_pre_ping=True, poolclass=NullPool)

# autoflush/autocommit off -> we control transactions explicitly in routers.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# All ORM models inherit from this Base.
Base = declarative_base()


def get_db():
    """FastAPI dependency: yield a session and always close it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create any missing tables. Imported models register themselves on Base."""
    # Import models so their tables are registered on Base.metadata before create_all.
    from app.models import recruiter  # noqa: F401

    Base.metadata.create_all(bind=engine)
