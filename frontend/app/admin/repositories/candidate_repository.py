"""Repository for the ``candidate_profiles`` table.

Columns (live schema): id, full_name, email, phone, created_at, title,
phone_number, linkedin_url, current_job_title, current_company,
years_of_experience, city, education_level, university_name, field_of_study,
languages (text[]), expected_salary_min, expected_salary_max,
profile_picture_url, open_to_work.
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class CandidateRepository(BaseRepository):
    table_name = "candidate_profiles"

    #: Lightweight column set for list views (avoids over-fetching big text columns).
    LIST_COLUMNS = "id, full_name, email, phone, created_at"

    def list_all(self) -> list[dict]:
        res = self.table.select("*").order("created_at", desc=True).execute()
        return res.data or []

    def list_basic(self) -> list[dict]:
        """Only the columns the Users table needs (smaller payload, faster parse)."""
        res = self.table.select(self.LIST_COLUMNS).order("created_at", desc=True).execute()
        return res.data or []

    def get(self, candidate_id: str) -> Optional[dict]:
        res = self.table.select("*").eq("id", candidate_id).limit(1).execute()
        return res.data[0] if res.data else None

    def count(self) -> int:
        res = self.table.select("id", count="exact").execute()
        return res.count if res.count is not None else len(res.data or [])

    def upsert(self, data: dict) -> dict:
        res = self.table.upsert(data).execute()
        return res.data[0] if res.data else data

    def update(self, candidate_id: str, data: dict) -> Optional[dict]:
        res = self.table.update(data).eq("id", candidate_id).execute()
        return res.data[0] if res.data else None

    def delete(self, candidate_id: str) -> None:
        self.table.delete().eq("id", candidate_id).execute()
