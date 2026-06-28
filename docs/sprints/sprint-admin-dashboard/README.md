# Sprint: Admin Dashboard Rebuild

A complete, ground-up rebuild of the xQuesty Admin Dashboard as an isolated,
MVC-structured module on both the backend (FastAPI) and frontend (React + Vite),
adapted strictly to the **existing** database — no schema changes.

## What shipped

| Area | Before (legacy) | After (this sprint) |
|------|-----------------|---------------------|
| Backend | One 375-line `admin/router.py` with all logic inline | MVC module: `repositories → services → routers`, `schemas`, `permissions`, `validators`, `tests` |
| Frontend | 4 basic pages (`src/app/admin/*`) + ad-hoc components | Isolated module `src/admin/*`: pages, layout, components, services, hooks, context |
| Dashboard | 4 stat cards | KPI cards, charts, activity feed, quick actions, status indicators |
| Users | Separate Candidates + Recruiters tables, delete-only | One unified Users table (search, filter, view, edit, disable, delete) with a large detail drawer + 3-dot actions |
| Companies | — (did not exist) | Company management derived from `hr_profiles` |
| Jobs | — | Full `job_pools` management (search, filter, edit, activate/archive, delete) |
| Applications | — | `interview_sessions` as applications: progress, status, transcript, AI summary |
| Reports | — | Analytics + CSV/Excel export |
| Settings | Sidebar links | Profile-dropdown → Settings (My Profile, Admin Users, Security, API Keys placeholder) |

## Read these in order

1. **[architecture.md](./architecture.md)** — the big picture: layers, request flow, auth, data sources.
2. **[mvc-mapping.md](./mvc-mapping.md)** — exactly which file is Model, View or Controller, and why.
3. **[folder-structure.md](./folder-structure.md)** — the directory tree, annotated.
4. **[database-mapping.md](./database-mapping.md)** — the 6 existing tables and how each screen maps to them.
5. **[implementation-plan.md](./implementation-plan.md)** — the plan that was executed, phase by phase.
6. **[FILES.md](./FILES.md)** — every file: path, purpose, MVC role, imports/exports, responsibilities, interactions, testing.
7. **[cleanup-report.md](./cleanup-report.md)** — what legacy code was deleted and what replaced it.
8. **[testing.md](./testing.md)** — how the module is tested and verified.
9. **[PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md)** — performance pass: measurements, slow endpoints, root causes.
10. **[SPRINT_REPORT.md](./SPRINT_REPORT.md)** — performance pass: fixes + before/after benchmarks (27.5 s → 26 ms dashboard).
11. **[admin-dashboard.pdf](./admin-dashboard.pdf)** — the educational, self-contained PDF (all of the above + screenshots).

## Screenshots

See [`screenshots/`](./screenshots/). Captured from the live app with Playwright
(`capture_screens.py`), driving real data from the production Supabase instance.

## Reproducing the verification

```bash
# 1. Run the app (root of repo)
runall.bat
# 2. From backend/ (venv active), run the unit tests
python -m pytest app/admin/tests -q
# 3. Drive the live UI: verify pages + capture screenshots
python ../docs/sprints/sprint-admin-dashboard/verify_and_screenshot.py
python ../docs/sprints/sprint-admin-dashboard/capture_screens.py
# 4. Regenerate the PDF
python ../docs/sprints/sprint-admin-dashboard/build_pdf.py
```

## Hard rules honoured

- **No database changes.** No tables created/dropped, no columns added, no migrations.
- **Existing tables only:** `admin_profiles`, `candidate_profiles`, `hr_profiles`,
  `job_pools`, `interview_sessions`, `Candidate_summaries`.
- **Not an auth rewrite.** Token verification reuses `app.auth.verify_token`
  (Supabase JWT). The module only adds the admin-role gate on top.
- **Isolated.** All new code lives under `backend/app/admin/` and `frontend/src/admin/`.
