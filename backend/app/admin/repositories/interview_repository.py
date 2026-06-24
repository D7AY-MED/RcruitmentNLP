"""Repository for the ``interview_sessions`` table (interview/application records).

Columns (live schema): id (int PK), candidate_id (FK candidate_profiles.id),
name, question, answer, sequence, timestamp, session_status, phone,
openai_session_id, session_id (uuid), pool_id (text).

Each row is a single question within an interview. One "application" is the set
of rows sharing the same (candidate_id, session_id). Grouping into applications
is done in the service layer, not here.
"""

from __future__ import annotations

from typing import Optional

from app.admin.repositories.base import BaseRepository


class InterviewRepository(BaseRepository):
    table_name = "interview_sessions"

    def list_all(self) -> list[dict]:
        """All interview rows, newest sequence first within each session."""
        res = (
            self.table.select("*")
            .order("timestamp", desc=True)
            .execute()
        )
        return res.data or []

    def list_for_session(self, session_id: str) -> list[dict]:
        res = (
            self.table.select("*")
            .eq("session_id", session_id)
            .order("sequence", desc=False)
            .execute()
        )
        return res.data or []

    def list_for_candidate(self, candidate_id: str) -> list[dict]:
        res = (
            self.table.select("*")
            .eq("candidate_id", candidate_id)
            .order("sequence", desc=False)
            .execute()
        )
        return res.data or []

    def count(self, status: Optional[str] = None) -> int:
        """Count interview *rows* (not sessions). Used only for coarse stats."""
        query = self.table.select("id", count="exact")
        if status is not None:
            query = query.eq("session_status", status)
        res = query.execute()
        return res.count if res.count is not None else len(res.data or [])

    def delete_session(self, session_id: str) -> None:
        self.table.delete().eq("session_id", session_id).execute()
