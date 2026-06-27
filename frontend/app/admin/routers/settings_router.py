"""Settings endpoints: admin users, own profile, security, api-keys placeholder.

Paths under /api/v1/admin/settings. This is the only surface that manages admin
accounts.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Response, status

from app.admin.permissions import get_current_admin
from app.admin.schemas.common import MessageOut
from app.admin.schemas.settings_schemas import AdminCreate, AdminProfileUpdate, PasswordChange
from app.admin.services import SettingsService

router = APIRouter(prefix="/settings", tags=["admin:settings"])


# --- admin users -------------------------------------------------------------

@router.get("/admins")
async def list_admins(_admin: dict = Depends(get_current_admin)):
    return SettingsService().list_admins()


@router.post("/admins", status_code=status.HTTP_201_CREATED)
async def create_admin(payload: AdminCreate, _admin: dict = Depends(get_current_admin)):
    return SettingsService().create_admin(payload.full_name, payload.email, payload.password)


@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_admin(admin_id: str, admin: dict = Depends(get_current_admin)):
    SettingsService().delete_admin(admin_id, admin["id"])
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- my profile --------------------------------------------------------------

@router.put("/profile")
async def update_profile(payload: AdminProfileUpdate, admin: dict = Depends(get_current_admin)):
    return SettingsService().update_profile(admin["id"], payload.full_name)


# --- security ----------------------------------------------------------------

@router.post("/security/password", response_model=MessageOut)
async def change_password(payload: PasswordChange, admin: dict = Depends(get_current_admin)):
    result = SettingsService().change_password(admin["id"], payload.new_password)
    return MessageOut(**result)


# --- api keys (placeholder) --------------------------------------------------

@router.get("/api-keys")
async def api_keys(_admin: dict = Depends(get_current_admin)):
    return SettingsService.api_keys()
