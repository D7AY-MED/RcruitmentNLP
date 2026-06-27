"""
Admin module (MVC).

This package implements the entire Admin Dashboard backend following a strict
Model-View-Controller separation:

    repositories/  -> Model       (database access only, via Supabase)
    services/      -> Controller   (business rules, orchestration, validation)
    routers/       -> View         (thin HTTP layer, request/response wiring)
    schemas/                       (pydantic request/response contracts)
    permissions.py                 (admin authentication dependency)
    validators.py                  (reusable input validation helpers)

The single public export is ``router`` -- a FastAPI ``APIRouter`` mounted at
``/api/v1/admin`` and registered in ``app.main``. Everything admin-related lives
inside this package so the rest of the codebase is untouched.

No database schema is created or modified by this module. It adapts strictly to
the existing tables: admin_profiles, candidate_profiles, hr_profiles, job_pools,
interview_sessions and Candidate_summaries.
"""

from app.admin.router import router

__all__ = ["router"]
