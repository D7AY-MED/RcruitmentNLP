"""Pydantic request/response schemas for the admin module.

These define the HTTP contract between the React admin frontend and the FastAPI
backend. They are intentionally permissive on output (most list endpoints return
raw rows) and strict on input (create/update payloads), mirroring how the rest
of the project is written.
"""

from app.admin.schemas.auth_schemas import (
    AdminLogin,
    AdminRegister,
    AdminOut,
    AdminToken,
)
from app.admin.schemas.common import MessageOut
from app.admin.schemas.dashboard_schemas import AdminStats, ActivityItem
from app.admin.schemas.user_schemas import (
    CandidateCreate,
    CandidateUpdate,
    RecruiterCreate,
    RecruiterUpdate,
)
from app.admin.schemas.company_schemas import CompanyUpdate
from app.admin.schemas.job_schemas import JobUpdate
from app.admin.schemas.settings_schemas import (
    AdminCreate,
    AdminProfileUpdate,
    PasswordChange,
)

__all__ = [
    "AdminLogin",
    "AdminRegister",
    "AdminOut",
    "AdminToken",
    "MessageOut",
    "AdminStats",
    "ActivityItem",
    "CandidateCreate",
    "CandidateUpdate",
    "RecruiterCreate",
    "RecruiterUpdate",
    "CompanyUpdate",
    "JobUpdate",
    "AdminCreate",
    "AdminProfileUpdate",
    "PasswordChange",
]
