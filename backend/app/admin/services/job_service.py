"""Job (job_pools) business rules.

Provides listing/search/filter/detail plus management actions (activate /
deactivate, archive / unarchive, edit, delete) over the existing job_pools
columns. Each pool is enriched with its owning recruiter/company via the join in
the repository.
"""

from __future__ import annotations

from fastapi import HTTPException, status

from app.admin.repositories import JobPoolRepository


def _flatten(pool: dict) -> dict:
    """Lift the joined hr_profiles object into flat recruiter/company fields."""
    hr = pool.pop("hr_profiles", None) or {}
    pool["recruiter_name"] = hr.get("full_name")
    pool["recruiter_email"] = hr.get("email")
    pool["company_name"] = pool.get("company_name") or hr.get("company_name")
    return pool


class JobService:
    def __init__(self) -> None:
        self.pools = JobPoolRepository()

    def list_jobs(
        self,
        search: str | None = None,
        status_filter: str | None = None,
    ) -> list[dict]:
        jobs = [_flatten(p) for p in self.pools.list_with_recruiter()]

        if status_filter == "active":
            jobs = [j for j in jobs if j.get("status") and not j.get("archived")]
        elif status_filter == "inactive":
            jobs = [j for j in jobs if not j.get("status") and not j.get("archived")]
        elif status_filter == "archived":
            jobs = [j for j in jobs if j.get("archived")]

        if search:
            needle = search.lower().strip()
            jobs = [
                j for j in jobs
                if needle in (j.get("title") or "").lower()
                or needle in (j.get("company_name") or "").lower()
                or needle in (j.get("location") or "").lower()
            ]
        return jobs

    def get_job(self, pool_id: str) -> dict:
        pool = self.pools.get(pool_id)
        if not pool:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job pool not found.")
        return _flatten(pool)

    def update_job(self, pool_id: str, data: dict) -> dict:
        clean = {k: v for k, v in data.items() if v is not None}
        if not clean:
            return self.get_job(pool_id)
        updated = self.pools.update(pool_id, clean)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job pool not found.")
        return self.get_job(pool_id)

    def delete_job(self, pool_id: str) -> None:
        if not self.pools.get(pool_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job pool not found.")
        self.pools.delete(pool_id)
