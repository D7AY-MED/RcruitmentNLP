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
        summaries = {s["candidate_id"]: s for s in self.summaries.list_all() if s.get("candidate_id")}

        grouped: dict[tuple, dict] = {}
        for r in rows:
            key = (r.get("candidate_id"), r.get("session_id"))
            app = grouped.get(key)
            if app is None:
                cand_id = r.get("candidate_id")
                app = {
                    "session_id": r.get("session_id"),
                    "candidate_id": cand_id,
                    "candidate_name": cand_names.get(cand_id) or r.get("name"),
                    "pool_id": r.get("pool_id"),
                    "pool_title": pool_titles.get(str(r.get("pool_id"))) if r.get("pool_id") else None,
                    "phone": r.get("phone"),
                    "status": "active",
                    "total_questions": 0,
                    "answered": 0,
                    "started_at": r.get("timestamp"),
                    "updated_at": r.get("timestamp"),
                    "score": summaries[cand_id].get("score") if (cand_id and cand_id in summaries) else None,
                }
                grouped[key] = app

            else:
                if not app.get("pool_id") and r.get("pool_id"):
                    app["pool_id"] = r.get("pool_id")
                    app["pool_title"] = pool_titles.get(str(r.get("pool_id")))
                if not app.get("phone") and r.get("phone"):
                    app["phone"] = r.get("phone")

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

        def safe_score(score_val) -> float:
            if not score_val:
                return 0.0
            try:
                val_str = str(score_val).split("/")[0].strip()
                return float(val_str)
            except ValueError:
                return 0.0

        if pool_id:
            applications.sort(key=lambda a: (safe_score(a.get("score")), a.get("updated_at") or ""), reverse=True)
        else:
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
        pool_id_val = None
        for r in rows:
            if r.get("pool_id"):
                pool_id_val = r.get("pool_id")
                break

        pool = None
        if pool_id_val:
            pool = self.pools.get(str(pool_id_val))

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
            "pool_id": str(pool_id_val) if pool_id_val else None,
            "pool_title": (pool or {}).get("title"),
            "status": "completed" if completed else "active",
            "answered": sum(1 for r in rows if r.get("answer")),
            "total_questions": len(rows),
            "summary": summary,
            "questions": qa,
        }
