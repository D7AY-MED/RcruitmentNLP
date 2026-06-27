"""Settings schemas: admin users, own profile, security."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AdminCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)


class AdminProfileUpdate(BaseModel):
    full_name: Optional[str] = None


class PasswordChange(BaseModel):
    new_password: str = Field(min_length=6)
