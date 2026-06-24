"""Company business rules.

There is no companies table. A company is an aggregation of hr_profiles rows that
share a ``company_name``. This service derives company records (with their
recruiters and job-pool counts), exposes a detail view, and lets an admin edit
the shared company_* fields across all members of a company.
"""

from __future__ import annotations

from collections import defaultdict

from fastapi import HTTPException, status

from app.admin.repositories import HrRepository, JobPoolRepository

# Company_* columns that describe the organisation (shared across recruiters).
_COMPANY_FIELDS = [
    "company_description", "company_industry", "company_size", "company_website",
    "company_linkedin_url", "company_email", "company_phone", "company_address",
    "company_founded_year",
]


def _slug(name: str) -> str:
    return name.strip().lower()


class CompanyService:
    def __init__(self) -> None:
        self.recruiters = HrRepository()
        self.pools = JobPoolRepository()

    def list_companies(self, search: str | None = None) -> list[dict]:
        recruiters = self.recruiters.list_all()
        pools = self.pools.list_all()
        pools_by_hr: dict[str, int] = defaultdict(int)
        for p in pools:
            pools_by_hr[p.get("hr_id")] += 1

        grouped: dict[str, dict] = {}
        for r in recruiters:
            name = (r.get("company_name") or "").strip()
            if not name:
                continue
            key = _slug(name)
            company = grouped.get(key)
            if company is None:
                company = {
                    "key": key,
                    "company_name": name,
                    "recruiters": 0,
                    "jobs": 0,
                    "members": [],
                    **{f: None for f in _COMPANY_FIELDS},
                    "created_at": r.get("created_at"),
                }
                grouped[key] = company
            company["recruiters"] += 1
            company["jobs"] += pools_by_hr.get(r.get("id"), 0)
            company["members"].append({
                "id": r.get("id"), "full_name": r.get("full_name"), "email": r.get("email"),
            })
            # Take the first non-null value for each shared company field.
            for f in _COMPANY_FIELDS:
                if company[f] is None and r.get(f) is not None:
                    company[f] = r.get(f)

        companies = list(grouped.values())
        if search:
            needle = search.lower().strip()
            companies = [c for c in companies if needle in c["company_name"].lower()]
        companies.sort(key=lambda c: c["company_name"].lower())
        return companies

    def get_company(self, key: str) -> dict:
        for company in self.list_companies():
            if company["key"] == _slug(key):
                # Attach the company's job pools for the detail view.
                member_ids = {m["id"] for m in company["members"]}
                company["pools"] = [
                    p for p in self.pools.list_all() if p.get("hr_id") in member_ids
                ]
                return company
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")

    def update_company(self, key: str, data: dict) -> dict:
        company = self.get_company(key)
        clean = {k: v for k, v in data.items() if v is not None and k in _COMPANY_FIELDS}
        if clean:
            self.recruiters.update_company_fields(company["company_name"], clean)
        return self.get_company(key)
