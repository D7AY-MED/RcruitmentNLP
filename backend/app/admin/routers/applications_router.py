"""Application (interview_sessions) endpoints. Paths under /api/v1/admin/applications."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.admin.permissions import get_current_admin
from app.admin.services import ApplicationService

router = APIRouter(prefix="/applications", tags=["admin:applications"])


@router.get("")
async def list_applications(search: str | None = None, status: str | None = None,
                            pool_id: str | None = None, _admin: dict = Depends(get_current_admin)):
    return ApplicationService().list_applications(
        search=search, status_filter=status, pool_id=pool_id
    )


@router.get("/{session_id}")
async def get_application(session_id: str, _admin: dict = Depends(get_current_admin)):
    app = ApplicationService().get_application(session_id)
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found.")
    return app
