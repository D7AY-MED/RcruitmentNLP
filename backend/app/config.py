"""
Central application configuration.

Loads values from the .env file (via python-dotenv) once at import time so the
rest of the app can simply read these module-level constants.
"""

import os

from dotenv import load_dotenv

# Load variables from backend/.env into the process environment.
load_dotenv()

# --- Database ---
# Full SQLAlchemy connection string (Supabase PostgreSQL). Required.
DATABASE_URL = os.getenv("DATABASE_URL")

# --- JWT ---
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "insecure-dev-secret-change-me")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

# --- CORS ---
# Comma-separated origins, e.g. "http://localhost:3000,https://app.example.com"
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]
