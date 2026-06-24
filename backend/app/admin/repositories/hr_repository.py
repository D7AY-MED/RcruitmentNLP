"""Repository for the ``hr_profiles`` table (recruiters + company data).

Columns (live schema): id, full_name, company_name, email, phone, created_at,
company_description, company_industry, company_size, company_website,
company_linkedin_url, company_email, company_phone, company_address,
company_founded_year.

A "company" in this platform is not its own table -- it is derived from the
company_* fields on hr_profiles (see CompanyService).
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class HrRepository(BaseRepository):
    table_name = "hr_profiles"

    #: Lightweight column set for list views.
    LIST_COLUMNS = "id, full_name, email, phone, company_name, created_at"

    def list_all(self) -> list[dict]:
        res = self.table.select("*").order("created_at", desc=True).execute()
        return res.data or []

    def list_basic(self) -> list[dict]:
        """Only the columns the Users table needs."""
        res = self.table.select(self.LIST_COLUMNS).order("created_at", desc=True).execute()
        return res.data or []

    def get(self, hr_id: str) -> Optional[dict]:
        res = self.table.select("*").eq("id", hr_id).limit(1).execute()
        return res.data[0] if res.data else None

    def count(self) -> int:
        res = self.table.select("id", count="exact").execute()
        return res.count if res.count is not None else len(res.data or [])

    def list_by_company(self, company_name: str) -> list[dict]:
        res = self.table.select("*").eq("company_name", company_name).execute()
        return res.data or []

    def upsert(self, data: dict) -> dict:
        res = self.table.upsert(data).execute()
        return res.data[0] if res.data else data

    def update(self, hr_id: str, data: dict) -> Optional[dict]:
        res = self.table.update(data).eq("id", hr_id).execute()
        return res.data[0] if res.data else None

    def update_company_fields(self, company_name: str, data: dict) -> list[dict]:
        """Apply company_* edits to every recruiter sharing a company name."""
        res = self.table.update(data).eq("company_name", company_name).execute()
        return res.data or []

    def delete(self, hr_id: str) -> None:
        self.table.delete().eq("id", hr_id).execute()
