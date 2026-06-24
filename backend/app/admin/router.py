"""Admin module entrypoint.

Aggregates every sub-router into a single ``APIRouter`` mounted at
``/api/v1/admin`` and re-exported from ``app.admin``. ``app.main`` includes this
one object, so the wiring at the application level stays a single line.

This file replaces the legacy monolithic admin router. All behaviour now lives
behind the MVC layers (routers -> services -> repositories).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.admin.routers import (
    auth_router,
    dashboard_router,
    users_router,
    companies_router,
    jobs_router,
    applications_router,
    reports_router,
    settings_router,
)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

# Auth has no sub-prefix (exposes /login, /me, ...). The rest add their own.
router.include_router(auth_router)
router.include_router(dashboard_router)
router.include_router(users_router)
router.include_router(companies_router)
router.include_router(jobs_router)
router.include_router(applications_router)
router.include_router(reports_router)
router.include_router(settings_router)

__all__ = ["router"]
