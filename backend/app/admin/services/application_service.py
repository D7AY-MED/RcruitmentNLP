"""Application (interview) business rules.

An "application" is one candidate's interview for one job pool. Physically it is
a group of ``interview_sessions`` rows sharing a ``session_id`` -- one row per
question. This service collapses those rows into application records with
progress and status, and joins candidate + pool + AI-summary context for detail.
No schema changes: it reads the existing tables only.
"""

from __future__ import annotations

from app.admin.cache import ttl_cached
from app.admin.repositories import (
    InterviewRepository,
    CandidateRepository,
    JobPoolRepository,
    SummaryRepository,
)


class ApplicationService:
    def __init__(self) -> None:
        self.interviews = InterviewRepository()
        self.candidates = CandidateRepository()
        self.pools = JobPoolRepository()
        self.summaries = SummaryRepository()

    @ttl_cached(15.0)
    def list_applications(
        self,
        search: str | None = None,
        status_filter: str | None = None,
        pool_id: str | None = None,
    ) -> list[dict]:
        rows = self.interviews.list_all()

        # Lookup tables for human-readable names.
        cand_names = {c["id"]: c.get("full_name") for c in self.candidates.list_all()}
        pool_titles = {str(p["id"]): p.get("title") for p in self.pools.list_all()}

        grouped: dict[tuple, dict] = {}
        for r in rows:
            key = (r.get("candidate_id"), r.get("session_id"))
            app = grouped.get(key)
            if app is None:
                app = {
                    "session_id": r.get("session_id"),
                    "candidate_id": r.get("candidate_id"),
                    "candidate_name": cand_names.get(r.get("candidate_id")) or r.get("name"),
                    "pool_id": r.get("pool_id"),
                    "pool_title": pool_titles.get(str(r.get("pool_id"))) if r.get("pool_id") else None,
                    "phone": r.get("phone"),
                    "status": "active",
                    "total_questions": 0,
                    "answered": 0,
                    "started_at": r.get("timestamp"),
                    "updated_at": r.get("timestamp"),
                }
                grouped[key] = app

            app["total_questions"] += 1
            if r.get("answer"):
                app["answered"] += 1
            if (r.get("session_status") or "").lower() == "completed":
                app["status"] = "completed"
            ts = r.get("timestamp")
            if ts:
                if not app["started_at"] or ts < app["started_at"]:
                    app["started_at"] = ts
                if not app["updated_at"] or ts > app["updated_at"]:
                    app["updated_at"] = ts

        applications = list(grouped.values())

        if status_filter:
            applications = [a for a in applications if a["status"] == status_filter]
        if pool_id:
            applications = [a for a in applications if str(a.get("pool_id")) == str(pool_id)]
        if search:
            needle = search.lower().strip()
            applications = [
                a for a in applications
                if needle in (a.get("candidate_name") or "").lower()
                or needle in (a.get("pool_title") or "").lower()
            ]

        applications.sort(key=lambda a: a.get("updated_at") or "", reverse=True)
        return applications

    def get_application(self, session_id: str) -> dict | None:
        rows = self.interviews.list_for_session(session_id)
        if not rows:
            return None

        first = rows[0]
        candidate = self.candidates.get(first.get("candidate_id")) if first.get("candidate_id") else None
        summary = (
            self.summaries.get_for_candidate(first.get("candidate_id"))
            if first.get("candidate_id") else None
        )
        pool = None
        if first.get("pool_id"):
            pool = self.pools.get(str(first["pool_id"]))

        qa = [
            {
                "sequence": r.get("sequence"),
                "question": r.get("question"),
                "answer": r.get("answer"),
                "timestamp": r.get("timestamp"),
            }
            for r in rows
        ]
        completed = any((r.get("session_status") or "").lower() == "completed" for r in rows)

        return {
            "session_id": session_id,
            "candidate": candidate,
            "candidate_name": (candidate or {}).get("full_name") or first.get("name"),
            "pool": pool,
            "pool_title": (pool or {}).get("title"),
            "status": "completed" if completed else "active",
            "answered": sum(1 for r in rows if r.get("answer")),
            "total_questions": len(rows),
            "summary": summary,
            "questions": qa,
        }
