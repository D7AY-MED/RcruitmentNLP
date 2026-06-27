"""Dashboard analytics business rules.

Aggregates across every existing table to power the premium dashboard: KPI
counts, time-series for charts, status breakdowns and a recent-activity feed.
All computation is in-process over rows already fetched -- no schema changes,
no new tables.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone

from app.admin.cache import ttl_cached
from app.admin.repositories import (
    CandidateRepository,
    HrRepository,
    JobPoolRepository,
    InterviewRepository,
    SummaryRepository,
)
from app.admin.schemas.dashboard_schemas import AdminStats
from app.admin.services.application_service import ApplicationService


def _month_key(value) -> str | None:
    """Return 'YYYY-MM' for an ISO timestamp, or None if unparseable."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return f"{dt.year:04d}-{dt.month:02d}"
    except (ValueError, TypeError):
        return None


class DashboardService:
    def __init__(self) -> None:
        self.candidates = CandidateRepository()
        self.recruiters = HrRepository()
        self.pools = JobPoolRepository()
        self.interviews = InterviewRepository()
        self.summaries = SummaryRepository()

    # --- KPI cards -----------------------------------------------------------

    @ttl_cached(15.0)
    def stats(self) -> AdminStats:
        recruiter_rows = self.recruiters.list_all()
        applications = ApplicationService().list_applications()
        companies = {
            (r.get("company_name") or "").strip()
            for r in recruiter_rows
            if (r.get("company_name") or "").strip()
        }
        completed = sum(1 for a in applications if a["status"] == "completed")

        return AdminStats(
            recruiters=len(recruiter_rows),
            candidates=self.candidates.count(),
            pools=self.pools.count(),
            activePools=self.pools.count(active_only=True),
            companies=len(companies),
            applications=len(applications),
            completedApplications=completed,
            summaries=self.summaries.count(),
        )

    # --- charts --------------------------------------------------------------

    @ttl_cached(15.0)
    def charts(self) -> dict:
        """Datasets for the dashboard charts."""
        candidates = self.candidates.list_all()
        recruiters = self.recruiters.list_all()
        pools = self.pools.list_all()
        applications = ApplicationService().list_applications()

        # Signups over the last 6 months (candidates vs recruiters).
        growth = self._growth_series(candidates, recruiters)

        # Application status breakdown for a donut chart.
        status_counts = Counter(a["status"] for a in applications)
        status_breakdown = [
            {"name": "Completed", "value": status_counts.get("completed", 0)},
            {"name": "In progress", "value": status_counts.get("active", 0)},
        ]

        # Pools by activity state for a bar chart.
        active = sum(1 for p in pools if p.get("status"))
        archived = sum(1 for p in pools if p.get("archived"))
        pools_state = [
            {"name": "Active", "value": active},
            {"name": "Inactive", "value": max(len(pools) - active, 0)},
            {"name": "Archived", "value": archived},
        ]

        # Top companies by number of job pools.
        by_company: dict[str, int] = defaultdict(int)
        hr_company = {r["id"]: (r.get("company_name") or "Unknown") for r in recruiters}
        for p in pools:
            by_company[hr_company.get(p.get("hr_id"), "Unknown")] += 1
        top_companies = sorted(
            ({"name": k, "value": v} for k, v in by_company.items()),
            key=lambda x: x["value"],
            reverse=True,
        )[:5]

        return {
            "growth": growth,
            "applicationStatus": status_breakdown,
            "poolsState": pools_state,
            "topCompanies": top_companies,
        }

    def _growth_series(self, candidates: list[dict], recruiters: list[dict]) -> list[dict]:
        now = datetime.now(timezone.utc)
        # Build the trailing 6 month buckets (oldest first).
        months: list[str] = []
        year, month = now.year, now.month
        for _ in range(6):
            months.append(f"{year:04d}-{month:02d}")
            month -= 1
            if month == 0:
                month = 12
                year -= 1
        months.reverse()
        index = {m: i for i, m in enumerate(months)}

        cand = [0] * 6
        recr = [0] * 6
        for c in candidates:
            k = _month_key(c.get("created_at"))
            if k in index:
                cand[index[k]] += 1
        for r in recruiters:
            k = _month_key(r.get("created_at"))
            if k in index:
                recr[index[k]] += 1

        return [
            {"month": m[5:], "candidates": cand[i], "recruiters": recr[i]}
            for i, m in enumerate(months)
        ]

    # --- activity feed -------------------------------------------------------

    @ttl_cached(15.0)
    def activity(self, limit: int = 12) -> list[dict]:
        """Merge the newest rows across tables into one reverse-chronological feed."""
        items: list[dict] = []

        for c in self.candidates.list_all()[:limit]:
            items.append({
                "type": "candidate",
                "title": c.get("full_name") or c.get("email") or "Candidate",
                "subtitle": "joined as a candidate",
                "timestamp": c.get("created_at"),
            })
        for r in self.recruiters.list_all()[:limit]:
            items.append({
                "type": "recruiter",
                "title": r.get("full_name") or r.get("email") or "Recruiter",
                "subtitle": f"recruiter at {r.get('company_name') or 'a company'}",
                "timestamp": r.get("created_at"),
            })
        for p in self.pools.list_all()[:limit]:
            items.append({
                "type": "job",
                "title": p.get("title") or "Job pool",
                "subtitle": "job pool created",
                "timestamp": p.get("created_at"),
            })

        items.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
        return items[:limit]
