"""
Administrator endpoints.

Mounted under the /api/v1/admin prefix. Mirrors the structure of the candidate
package. The admin dashboard's CRUD (create recruiter/candidate, list users,
delete users) is served by the Next.js BFF routes under /api/admin/* with the
Supabase service-role key; this router exposes backend-side admin utilities
(service liveness + an overview placeholder) and is the home for future
admin-only backend features (audit trails, exports, analytics).
"""

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


@router.get("/health")
async def health():
    """Liveness check for the administrator service area."""
    logger.info("admin health ok")
    return {"status": "ok", "service": "admin"}


@router.get("/capabilities")
async def capabilities():
    """Describe the admin features and where each one is served.

    Lets the frontend (or an ops dashboard) discover what the administrator
    area can do without hardcoding the list. The user-management actions are
    served by the Next.js BFF; backend-only features are flagged here as they
    come online.
    """
    logger.info("serving admin capabilities")
    return {
        "service": "admin",
        "user_management": {
            "served_by": "next-bff",
            "actions": [
                "list_recruiters",
                "create_recruiter",
                "delete_recruiter",
                "list_candidates",
                "create_candidate",
                "delete_candidate",
                "dashboard_stats",
            ],
        },
        "backend_features": {
            "served_by": "fastapi",
            "actions": [],  # audit trails, exports, analytics — coming soon
        },
    }
