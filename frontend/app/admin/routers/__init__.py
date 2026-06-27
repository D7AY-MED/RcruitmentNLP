"""Routers (the *View* in MVC).

Each module exposes a small ``APIRouter`` that maps HTTP requests to a single
service call and returns the result. Routers contain NO business logic -- they
parse/validate the request shape, enforce the admin dependency, delegate to a
service, and serialise the response.

``app.admin.router`` aggregates all of these under the ``/api/v1/admin`` prefix.
"""

from app.admin.routers.auth_router import router as auth_router
from app.admin.routers.dashboard_router import router as dashboard_router
from app.admin.routers.users_router import router as users_router
from app.admin.routers.companies_router import router as companies_router
from app.admin.routers.jobs_router import router as jobs_router
from app.admin.routers.applications_router import router as applications_router
from app.admin.routers.reports_router import router as reports_router
from app.admin.routers.settings_router import router as settings_router

__all__ = [
    "auth_router",
    "dashboard_router",
    "users_router",
    "companies_router",
    "jobs_router",
    "applications_router",
    "reports_router",
    "settings_router",
]
