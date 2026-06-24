"""Job (job_pools) schemas.

Only management-relevant, existing columns are editable from the admin area.
Arrays map to Postgres text[] columns.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class JobUpdate(BaseModel):
    """Editable job_pools columns (all optional, PATCH semantics)."""

    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[bool] = None
    archived: Optional[bool] = None
    location: Optional[str] = None
    contract_type: Optional[str] = None
    seniority_level: Optional[str] = None
    experience_range: Optional[str] = None
    education_level: Optional[str] = None
    years_experience: Optional[int] = None
    main_mission: Optional[str] = None
    notes: Optional[str] = None
    languages: Optional[list[str]] = None
    responsibilities: Optional[list[str]] = None
    must_have_skills: Optional[list[str]] = None
    nice_to_have_skills: Optional[list[str]] = None
    soft_skills: Optional[list[str]] = None
    deal_breakers: Optional[list[str]] = None
