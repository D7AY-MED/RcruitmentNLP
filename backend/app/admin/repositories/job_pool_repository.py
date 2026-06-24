"""Repository for the ``job_pools`` table.

Columns (live schema): id, hr_id (FK hr_profiles.id), title, description,
public_token, status (bool), created_at, seniority_level, main_mission,
responsibilities (text[]), must_have_skills (text[]), nice_to_have_skills
(text[]), soft_skills (text[]), deal_breakers (text[]), generated_jd,
languages (text[]), years_experience (smallint), notes, education_level,
contract_type, location, experience_range, archived (bool), gemini_store_name.
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class JobPoolRepository(BaseRepository):
    table_name = "job_pools"

    def list_all(self) -> list[dict]:
        res = self.table.select("*").order("created_at", desc=True).execute()
        return res.data or []

    def list_with_recruiter(self) -> list[dict]:
        """List pools joined with their owning recruiter/company (hr_profiles)."""
        res = (
            self.table.select("*, hr_profiles(id, full_name, email, company_name)")
            .order("created_at", desc=True)
            .execute()
        )
        return res.data or []

    def get(self, pool_id: str) -> Optional[dict]:
        res = (
            self.table.select("*, hr_profiles(id, full_name, email, company_name)")
            .eq("id", pool_id)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def list_by_hr(self, hr_id: str) -> list[dict]:
        res = self.table.select("*").eq("hr_id", hr_id).execute()
        return res.data or []

    def count(self, active_only: bool = False) -> int:
        query = self.table.select("id", count="exact")
        if active_only:
            query = query.eq("status", True)
        res = query.execute()
        return res.count if res.count is not None else len(res.data or [])

    def update(self, pool_id: str, data: dict) -> Optional[dict]:
        res = self.table.update(data).eq("id", pool_id).execute()
        return res.data[0] if res.data else None

    def delete(self, pool_id: str) -> None:
        self.table.delete().eq("id", pool_id).execute()
