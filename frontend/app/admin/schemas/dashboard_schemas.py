"""Dashboard / analytics response schemas."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AdminStats(BaseModel):
    """Top-line KPI counts for the dashboard cards.

    ``recruiters``/``candidates``/``pools``/``activePools`` keep the exact names
    the legacy dashboard used so nothing downstream breaks; the rest are new.
    """

    recruiters: int
    candidates: int
    pools: int
    activePools: int
    companies: int
    applications: int
    completedApplications: int
    summaries: int


class ActivityItem(BaseModel):
    """A single entry in the recent-activity feed."""

    type: str            # candidate | recruiter | job | application
    title: str
    subtitle: Optional[str] = None
    timestamp: Optional[str] = None
