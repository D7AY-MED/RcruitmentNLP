"""Repository for the ``Candidate_summaries`` table (note the capital C).

Columns (live schema): id (uuid PK), candidate_id (FK candidate_profiles.id),
Candidate_name, summary, last_updated, phone, score (text).

Holds the AI-generated summary and score produced from a candidate's interview.
The mixed-case table and column names are quoted exactly as they exist.
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class SummaryRepository(BaseRepository):
    table_name = "Candidate_summaries"

    def list_all(self) -> list[dict]:
        res = self.table.select("*").order("last_updated", desc=True).execute()
        return res.data or []

    def get_for_candidate(self, candidate_id: str) -> Optional[dict]:
        res = (
            self.table.select("*")
            .eq("candidate_id", candidate_id)
            .order("last_updated", desc=True)
            .limit(1)
            .execute()
        )
        return res.data[0] if res.data else None

    def count(self) -> int:
        res = self.table.select("id", count="exact").execute()
        return res.count if res.count is not None else len(res.data or [])
