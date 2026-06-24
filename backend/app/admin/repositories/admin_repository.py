"""Repository for the ``admin_profiles`` table.

Columns (live schema): id (uuid PK -> auth.users), full_name, email,
created_at, password (legacy/unused for auth).
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class AdminRepository(BaseRepository):
    table_name = "admin_profiles"

    def list_all(self) -> list[dict]:
        res = self.table.select("*").order("created_at", desc=True).execute()
        return res.data or []

    def get(self, admin_id: str) -> Optional[dict]:
        res = self.table.select("*").eq("id", admin_id).limit(1).execute()
        return res.data[0] if res.data else None

    def count(self) -> int:
        res = self.table.select("id", count="exact").execute()
        return res.count if res.count is not None else len(res.data or [])

    def upsert(self, data: dict) -> dict:
        res = self.table.upsert(data).execute()
        return res.data[0] if res.data else data

    def update(self, admin_id: str, data: dict) -> Optional[dict]:
        res = self.table.update(data).eq("id", admin_id).execute()
        return res.data[0] if res.data else None

    def delete(self, admin_id: str) -> None:
        self.table.delete().eq("id", admin_id).execute()
