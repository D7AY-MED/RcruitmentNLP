"""Dashboard endpoints: KPI stats, chart datasets, activity feed."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.admin.permissions import get_current_admin
from app.admin.schemas.dashboard_schemas import AdminStats
from app.admin.services import DashboardService

router = APIRouter(prefix="/dashboard", tags=["admin:dashboard"])


@router.get("/stats", response_model=AdminStats)
async def stats(_admin: dict = Depends(get_current_admin)):
    return DashboardService().stats()


@router.get("/charts")
async def charts(_admin: dict = Depends(get_current_admin)):
    return DashboardService().charts()


@router.get("/activity")
async def activity(limit: int = 12, _admin: dict = Depends(get_current_admin)):
    return DashboardService().activity(limit=limit)
