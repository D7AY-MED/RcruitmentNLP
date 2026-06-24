"""Authentication schemas for the admin area.

Kept compatible with the legacy ``app.schemas`` admin models so existing tokens
and the login contract continue to work (this is not an auth rewrite).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class AdminRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    id: UUID
    full_name: str
    email: EmailStr
    created_at: datetime


class AdminToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminOut
