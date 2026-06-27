"""Auth + health endpoints for the admin area.

Mounted at /api/v1/admin (no sub-prefix), so paths are /login, /me, /register,
/logout, /health, /capabilities -- preserving the legacy contract.
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Header, status

from app.admin.permissions import get_current_admin
from app.admin.schemas.auth_schemas import AdminLogin, AdminOut, AdminRegister, AdminToken
from app.admin.schemas.common import MessageOut
from app.admin.services import AuthService

router = APIRouter(tags=["admin:auth"])


@router.get("/health")
async def health():
    return {"status": "ok", "service": "admin"}


@router.post("/login", response_model=AdminToken)
async def login(payload: AdminLogin):
    return AuthService().login(payload.email, payload.password)


@router.post("/register", response_model=AdminToken, status_code=status.HTTP_201_CREATED)
async def register(payload: AdminRegister, x_admin_setup_token: Optional[str] = Header(None)):
    return AuthService().register(payload.full_name, payload.email, payload.password, x_admin_setup_token)


@router.get("/me", response_model=AdminOut)
async def me(admin: dict = Depends(get_current_admin)):
    return AuthService.me(admin)


@router.post("/logout", response_model=MessageOut)
async def logout(_admin: dict = Depends(get_current_admin)):
    # Supabase JWTs are stateless; the client discards its token. This endpoint
    # exists so the frontend has a single, explicit logout call to make.
    return MessageOut(message="Logged out.")
