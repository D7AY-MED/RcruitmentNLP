# Implementation Plan (as executed)

The rebuild was executed in seven phases. Each phase was verified before moving on.

## Phase 0 — Discovery (before writing any code)

- Mapped the legacy backend admin router, the legacy frontend admin pages, the
  auth flow, and the available UI primitives.
- **Introspected the live database** via the Supabase PostgREST OpenAPI spec
  (migration files were stale and missing columns). Confirmed all six tables and
  their real columns, including `Candidate_summaries` (which was absent from code).
- Confirmed four product decisions with the stakeholder: charts via **recharts**,
  full **Playwright** screenshots + PDF, **delete** the legacy implementation, and
  **disable = Supabase Auth ban** (no schema column exists).

## Phase 1 — Dependencies

- Frontend: `recharts`.
- Backend: `openpyxl` (Excel export), `playwright` (+ `chromium`) for docs.
- Added `pytest` for the module's tests. Recorded all in `requirements.txt`.

## Phase 2 — Backend MVC module

Built bottom-up so each layer could be verified against the one below:

1. **Repositories** (Model) — one per table + `AuthRepository` for GoTrue.
2. **Schemas** — pydantic request/response contracts.
3. **Permissions & validators** — admin gate + reusable input checks.
4. **Services** (Controller) — auth, dashboard, users, companies, jobs,
   applications, reports, settings.
5. **Routers** (View) — thin endpoints, aggregated by `router.py`.
6. **Tests** — validators, service logic, router wiring (23 tests).

Verified: module imports (34 routes), unit tests pass, and a **live read-only
smoke test** of every service against real Supabase data.

## Phase 3 — Frontend module

1. **Foundation** — `types.ts`, `client.ts`, `AdminAuthContext`, hooks.
2. **Services** — one per backend area.
3. **UI primitives** — Button, form controls, Card/Badge/StatusBadge, SearchInput,
   Drawer, Modal, ActionsMenu, ConfirmDialog, KpiCard, DataTable, Tabs.
4. **Charts** — recharts wrappers (area/donut/bar).
5. **Layout** — RequireAdmin, Sidebar, Topbar (profile dropdown), AdminLayout.
6. **Pages** — Login, Dashboard, Users, Companies, Jobs, Applications, Reports,
   Settings (+ detail drawers and create modals).
7. **AdminApp** — providers + route table.

## Phase 4 — Wire & delete legacy

- `App.tsx`: replaced four admin routes with `<Route path="/admin/*">`.
- Deleted `src/app/admin/`, `src/components/admin/`, `src/lib/adminAuth.ts`.
- Backend `main.py`: include the new aggregated router. The legacy monolithic
  router was replaced in place. See **[cleanup-report.md](./cleanup-report.md)**.

## Phase 5 — Run & verify

- Ran both servers (`runall.bat` pattern).
- Verified every page with Playwright: login, dashboard, users, companies, jobs,
  applications, reports, settings, logout. **No React duplicate-key warnings.**
- Verified responsive (390px mobile viewport).

## Phase 6 — Screenshots

- Drove the live app with Playwright against real data, capturing each page,
  both detail drawers, the mobile dashboard and the mobile nav.

## Phase 7 — Documentation & PDF

- Wrote architecture, MVC mapping, folder structure, database mapping, FILES.md,
  cleanup report and testing docs.
- Generated `admin-dashboard.pdf` from a self-contained HTML build (Playwright
  print-to-PDF) that embeds the docs and screenshots.

## Non-negotiables held throughout

- No DDL of any kind. Only the six existing tables, only existing columns.
- Token verification reused from `app.auth` (no auth rewrite).
- Everything under `backend/app/admin/` and `frontend/src/admin/`.
