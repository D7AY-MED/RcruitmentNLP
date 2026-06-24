"""
Repositories (the *Model* in MVC).

Every class here is the ONLY place allowed to touch the database. Services call
repositories; routers never do. Each repository wraps exactly one existing table
(or, for ``AuthRepository``, the Supabase Auth admin API) and exposes small,
intention-revealing methods that return plain ``dict``/``list`` data.

No SQL DDL is ever issued here -- reads, inserts, updates and deletes only,
against tables that already exist.
"""

from app.admin.repositories.admin_repository import AdminRepository
from app.admin.repositories.candidate_repository import CandidateRepository
from app.admin.repositories.hr_repository import HrRepository
from app.admin.repositories.job_pool_repository import JobPoolRepository
from app.admin.repositories.interview_repository import InterviewRepository
from app.admin.repositories.summary_repository import SummaryRepository
from app.admin.repositories.auth_repository import AuthRepository

__all__ = [
    "AdminRepository",
    "CandidateRepository",
    "HrRepository",
    "JobPoolRepository",
    "InterviewRepository",
    "SummaryRepository",
    "AuthRepository",
]
