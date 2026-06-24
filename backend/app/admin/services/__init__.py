"""Services (the *Controller* in MVC).

Each service owns the business rules for one area of the admin product. Services
orchestrate one or more repositories, enforce validation/permissions invariants,
shape data for the API, and never speak HTTP beyond raising ``HTTPException``.
Routers instantiate a service per request and delegate to it.
"""

from app.admin.services.auth_service import AuthService
from app.admin.services.dashboard_service import DashboardService
from app.admin.services.user_service import UserService
from app.admin.services.company_service import CompanyService
from app.admin.services.job_service import JobService
from app.admin.services.application_service import ApplicationService
from app.admin.services.report_service import ReportService
from app.admin.services.settings_service import SettingsService

__all__ = [
    "AuthService",
    "DashboardService",
    "UserService",
    "CompanyService",
    "JobService",
    "ApplicationService",
    "ReportService",
    "SettingsService",
]
