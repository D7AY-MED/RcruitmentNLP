"""
Central application configuration.

Loads values from the root .env (project root) first, then backend/.env as
fallback, so a single shared root .env serves both frontend and backend.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Try root .env first, then backend/.env as override.
_root_dotenv = Path(__file__).resolve().parent.parent.parent / ".env"
_backend_dotenv = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_root_dotenv)
load_dotenv(_backend_dotenv)

# --- Database ---
# Full SQLAlchemy connection string (Supabase PostgreSQL). Required.
DATABASE_URL = os.getenv("DATABASE_URL")

# --- JWT ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "insecure-dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# --- Supabase ---
# JWT secret for verifying Supabase Auth tokens (candidate auth).
# Found in Supabase Dashboard → Settings → API → JWT Secret.
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# --- CORS ---
# Comma-separated origins, e.g. "http://localhost:3000,https://app.example.com"
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
