"""
SQLAlchemy database setup.

Creates the engine + session factory and exposes:
  - Base:    declarative base every model inherits from.
  - get_db:  FastAPI dependency yielding a request-scoped DB session.
  - init_db: creates tables from the models' metadata (used at startup).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy import make_url

from app.config import DATABASE_URL

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. Copy backend/.env.example to backend/.env "
        "and fill in your Supabase connection string."
    )

# Normalize the URL: use the psycopg3 driver, ensure SSL is enabled
# for Supabase connections.
url = make_url(DATABASE_URL)
url = url.set(drivername="postgresql+psycopg")
if "sslmode" not in url.query:
    url = url.update_query_dict({"sslmode": "require"})
_db_url = url.render_as_string(hide_password=False)

# pool_pre_ping=True transparently recycles connections dropped by the
# Supabase pooler, avoiding stale-connection errors on idle apps.
engine = create_engine(_db_url, pool_pre_ping=True)

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
