# FILES.md — File-by-file reference

Every file in the Admin module, with: **path · purpose · MVC role · imports ·
exports · responsibilities · interactions · testing**. Written so a junior
developer can open any file and know what it does and why.

---

# Backend — `backend/app/admin/`

## `__init__.py`
- **Role:** package entry.
- **Imports:** `from app.admin.router import router`.
- **Exports:** `router` (the aggregated `APIRouter`).
- **Responsibilities:** document the MVC module; expose the single public symbol.
- **Interactions:** imported by `app/main.py`.
- **Testing:** covered indirectly by `test_routers.py` (importing `router`).

## `router.py`
- **Role:** View (aggregator).
- **Imports:** the eight sub-routers from `app.admin.routers`.
- **Exports:** `router = APIRouter(prefix="/api/v1/admin")` with all sub-routers included.
- **Responsibilities:** mount auth/dashboard/users/companies/jobs/applications/reports/settings under one prefix.
- **Interactions:** included by `main.py`; replaces the legacy monolith.
- **Testing:** `test_routers.py` mounts it in a `TestClient`.

## `permissions.py`
- **Role:** cross-cutting auth dependency.
- **Imports:** `AdminRepository`, `app.auth.verify_token`.
- **Exports:** `async def get_current_admin(...) -> dict`.
- **Responsibilities:** verify the Supabase JWT (reused) then confirm the user is in `admin_profiles`; else 403.
- **Interactions:** `Depends(get_current_admin)` guards every protected router.
- **Testing:** overridden in `test_routers.py`; the live path is exercised by the smoke test.

## `validators.py`
- **Role:** cross-cutting validation.
- **Imports:** `fastapi.HTTPException`.
- **Exports:** `validate_user_type`, `validate_dataset`, `validate_format`, `require_non_empty`, and the `USER_TYPES`/`REPORT_DATASETS`/`EXPORT_FORMATS` sets.
- **Responsibilities:** fail fast (400) on bad path/query input before it reaches a service/DB.
- **Interactions:** used by `UserService`, `ReportService`, the reports router.
- **Testing:** `test_validators.py` (6 tests).

## repositories/ (MODEL)

### `repositories/base.py`
- **Role:** Model base.
- **Imports:** `app.auth.get_supabase`.
- **Exports:** `BaseRepository` (`.client`, `.table`, `table_name`).
- **Responsibilities:** give every repository one Supabase service-role client and a `.table` query builder.
- **Interactions:** parent of all table repositories.
- **Testing:** `conftest.py` stubs `get_supabase` so subclasses construct without network.

### `repositories/admin_repository.py`
- **Role:** Model — `admin_profiles`.
- **Exports:** `AdminRepository` — `list_all`, `get`, `count`, `upsert`, `update`, `delete`.
- **Responsibilities:** CRUD on admin rows.
- **Interactions:** `permissions`, `AuthService`, `SettingsService`.
- **Testing:** via service/router tests (stubbed).

### `repositories/candidate_repository.py`
- **Role:** Model — `candidate_profiles`.
- **Exports:** `CandidateRepository` — `list_all`, `get`, `count`, `upsert`, `update`, `delete`.
- **Interactions:** `UserService`, `DashboardService`, `ApplicationService`, `ReportService`.

### `repositories/hr_repository.py`
- **Role:** Model — `hr_profiles`.
- **Exports:** `HrRepository` — the standard set plus `list_by_company`, `update_company_fields` (fan-out company_* edits).
- **Interactions:** `UserService`, `CompanyService`, `DashboardService`, `ReportService`.

### `repositories/job_pool_repository.py`
- **Role:** Model — `job_pools`.
- **Exports:** `JobPoolRepository` — `list_all`, `list_with_recruiter` (joins `hr_profiles`), `get`, `list_by_hr`, `count(active_only)`, `update`, `delete`.
- **Interactions:** `JobService`, `CompanyService`, `DashboardService`, `ApplicationService`, `ReportService`.

### `repositories/interview_repository.py`
- **Role:** Model — `interview_sessions`.
- **Exports:** `InterviewRepository` — `list_all`, `list_for_session`, `list_for_candidate`, `count(status)`, `delete_session`.
- **Interactions:** `ApplicationService`, `DashboardService`.

### `repositories/summary_repository.py`
- **Role:** Model — `Candidate_summaries` (mixed-case, quoted exactly).
- **Exports:** `SummaryRepository` — `list_all`, `get_for_candidate`, `count`.
- **Interactions:** `ApplicationService` (AI summary), `DashboardService` (count).

### `repositories/auth_repository.py`
- **Role:** Model — Supabase Auth (GoTrue) admin API (no DB table).
- **Imports:** `httpx`, `app.auth.get_supabase`, config.
- **Exports:** `AuthRepository` — `create_user`, `delete_user`, `set_password`, `sign_in`, `ban_user`, `unban_user`, `get_auth_user`, `is_disabled`, `disabled_map`.
- **Responsibilities:** account lifecycle + **disable-via-ban** + reading `banned_until`.
- **Interactions:** `UserService`, `AuthService`, `SettingsService`.
- **Testing:** exercised live (create/ban happen against GoTrue); not stubbed in unit tests.

## schemas/ (CONTRACTS)

- `schemas/common.py` — `MessageOut` (generic `{message, ok}`).
- `schemas/auth_schemas.py` — `AdminLogin`, `AdminRegister`, `AdminOut`, `AdminToken`.
- `schemas/dashboard_schemas.py` — `AdminStats` (KPI counts), `ActivityItem`.
- `schemas/user_schemas.py` — `CandidateCreate/Update`, `RecruiterCreate/Update` (only real columns; updates all-optional/PATCH).
- `schemas/company_schemas.py` — `CompanyUpdate` (company_* fields).
- `schemas/job_schemas.py` — `JobUpdate` (editable job_pools columns, arrays → text[]).
- `schemas/settings_schemas.py` — `AdminCreate`, `AdminProfileUpdate`, `PasswordChange`.
- **Role:** request/response contracts. **Exports:** the pydantic models (re-exported from `schemas/__init__.py`). **Interactions:** routers (request bodies + `response_model`). **Testing:** validated implicitly by router tests.

## services/ (CONTROLLER)

### `services/auth_service.py`
- **Exports:** `AuthService` — `login`, `register`, `me`.
- **Responsibilities:** sign in via Supabase then gate on `admin_profiles`; bootstrap first admin (guarded by `ADMIN_SETUP_TOKEN`); roll back the auth user if the profile insert fails.
- **Interactions:** `AdminRepository`, `AuthRepository`; used by `auth_router`.

### `services/dashboard_service.py`
- **Exports:** `DashboardService` — `stats`, `charts`, `activity`.
- **Responsibilities:** KPI counts; 6-month signup growth; application-status donut; pools-by-state bar; top companies; merged recent-activity feed.
- **Interactions:** candidate/hr/job/interview/summary repos + `ApplicationService`.

### `services/user_service.py`
- **Exports:** `UserService` — `list_users`, `get_user`, `create_candidate`, `create_recruiter`, `update_user`, `set_disabled`, `delete_user`.
- **Responsibilities:** unify candidates + recruiters; overlay disabled status; normalise rows; enforce `validate_user_type`; disable-via-ban; rollback on failed create.
- **Interactions:** candidate/hr repos + `AuthRepository`. **Excludes admins by construction.**

### `services/company_service.py`
- **Exports:** `CompanyService` — `list_companies`, `get_company`, `update_company`.
- **Responsibilities:** aggregate `hr_profiles` by `company_name`; count recruiters/jobs; first-non-null company fields; attach pools on detail; fan-out company_* edits.
- **Interactions:** `HrRepository`, `JobPoolRepository`.
- **Testing:** `test_company_and_report.py`.

### `services/job_service.py`
- **Exports:** `JobService` — `list_jobs`, `get_job`, `update_job`, `delete_job` + `_flatten` helper.
- **Responsibilities:** flatten the joined recruiter/company; status filter (active/inactive/archived); search; PATCH changed fields.
- **Interactions:** `JobPoolRepository`.

### `services/application_service.py`
- **Exports:** `ApplicationService` — `list_applications`, `get_application`.
- **Responsibilities:** group `interview_sessions` rows by `session_id` into applications; compute progress/status; join candidate/pool/AI summary; build transcript.
- **Interactions:** interview/candidate/job/summary repos.
- **Testing:** `test_application_service.py`.

### `services/report_service.py`
- **Exports:** `ReportService` — `summary`, `build_rows`, `to_csv`, `to_xlsx`; helpers `_cell`, `JobServiceRows`.
- **Responsibilities:** analytics totals/rates; per-dataset column sets; CSV (UTF-8 BOM) and styled XLSX, both in-memory.
- **Interactions:** candidate/hr/job repos + Application/Company services.
- **Testing:** `test_company_and_report.py` (CSV/XLSX/cell).

### `services/settings_service.py`
- **Exports:** `SettingsService` — `list_admins`, `create_admin`, `delete_admin`, `update_profile`, `change_password`, `api_keys`.
- **Responsibilities:** admin-user management with guards (no self-delete, no last-admin delete); strip `password` from output; password change via GoTrue; api-keys placeholder.
- **Interactions:** `AdminRepository`, `AuthRepository`.

## routers/ (VIEW)

Each is a thin `APIRouter`; every protected endpoint uses `Depends(get_current_admin)`.

- `routers/auth_router.py` — `/login`, `/register`, `/me`, `/logout`, `/health` → `AuthService`.
- `routers/dashboard_router.py` — `/dashboard/stats|charts|activity` → `DashboardService`.
- `routers/users_router.py` — `GET/POST/PUT/DELETE /users...`, `.../disable`, `.../enable` → `UserService`.
- `routers/companies_router.py` — `GET /companies`, `GET/PUT /companies/{key}` → `CompanyService`.
- `routers/jobs_router.py` — `GET /jobs`, `GET/PATCH/DELETE /jobs/{id}` → `JobService`.
- `routers/applications_router.py` — `GET /applications`, `GET /applications/{session_id}` → `ApplicationService`.
- `routers/reports_router.py` — `GET /reports/summary`, `GET /reports/export` (CSV/XLSX `Response`) → `ReportService` + validators.
- `routers/settings_router.py` — `/settings/admins`, `/settings/profile`, `/settings/security/password`, `/settings/api-keys` → `SettingsService`.
- **Testing:** wiring smoke-tested in `test_routers.py`; full surface exercised live.

## tests/

- `conftest.py` — autouse fixture stubbing `get_supabase` (3 import sites) so repos build offline.
- `test_validators.py`, `test_application_service.py`, `test_company_and_report.py`, `test_routers.py` — see [testing.md](./testing.md). **23 tests, all passing.**

---

# Frontend — `frontend/src/admin/`

## `AdminApp.tsx`
- **Role:** View (module entry).
- **Imports:** providers, `RequireAdmin`, `AdminLayout`, all pages, `Toaster`.
- **Exports:** default `AdminApp`.
- **Responsibilities:** wrap the module in `AdminAuthProvider` + `ConfirmProvider` + toaster; declare the route table (login public; rest guarded inside the layout).
- **Interactions:** mounted by `App.tsx` at `/admin/*`.

## `types.ts`
- **Role:** Model (contracts). **Exports:** `Admin`, `UserRow`, `AdminStats`, `DashboardCharts`, `ActivityItem`, `Company`, `Job`, `ApplicationRow`, `ApplicationDetail`, `ReportSummary`, `UserType`.
- **Responsibilities:** one source of truth for API shapes. **Interactions:** services + pages.

## context/`AdminAuthContext.tsx`
- **Role:** Controller. **Exports:** `AdminAuthProvider`, `useAdminAuth`.
- **Responsibilities:** hold current admin; `login/logout/refresh/setAdmin`; validate token on mount; keep session on transient errors, drop only on real auth failure.
- **Interactions:** `auth.service`, `client.isAuthError`; consumed by RequireAdmin/Topbar/LoginPage/Settings.

## hooks/
- `useAsync.ts` — Controller. `useAsync(fn, deps)` → `{data, loading, error, reload}`; maps auth errors to a friendly message. Used by every list/detail page.
- `useDebounce.ts` — Controller. Debounce a value (search boxes).
- `useToast.ts` — Controller. `toast.success/error/...` over react-hot-toast.

## lib/`format.ts`
- **Role:** helper. **Exports:** `formatDate`, `formatDateTime`, `timeAgo`, `titleCase`, `displayValue`. Used across pages/drawers for consistent rendering.

## services/ (MODEL)
- `client.ts` — the `http` wrapper (`get/post/put/patch/del/download`), token storage (`getAdminToken`/`setAdminToken`/`clearAdminToken`), `AdminApiError`, `isAuthError`. **Every** request goes through here.
- `auth.service.ts` — `login`, `getCurrentAdmin`, `logout`, `hasToken`.
- `dashboard.service.ts` — `getStats`, `getCharts`, `getActivity`.
- `users.service.ts` — `listUsers`, `getUser`, `createCandidate`, `createRecruiter`, `updateUser`, `disableUser`, `enableUser`, `deleteUser`.
- `companies.service.ts` — `listCompanies`, `getCompany`, `updateCompany`.
- `jobs.service.ts` — `listJobs`, `getJob`, `updateJob`, `deleteJob`.
- `applications.service.ts` — `listApplications`, `getApplication`.
- `reports.service.ts` — `getSummary`, `exportDataset` (CSV/XLSX download).
- `settings.service.ts` — `listAdmins`, `createAdmin`, `deleteAdmin`, `updateProfile`, `changePassword`, `getApiKeys`.

## components/ui/ (design system)
- `Button.tsx` — variants (primary/secondary/outline/ghost/destructive) + sizes + `loading` spinner.
- `form.tsx` — `Label`, `Input`, `Textarea`, `Select`, `Field` (label+control+hint/error).
- `primitives.tsx` — `Card`, `Badge`, `StatusBadge`, `Spinner`, `Skeleton`, `LoadingState`, `EmptyState`, `ErrorState`, `PageHeader`, `Avatar`.
- `SearchInput.tsx` — icon + clear-button search box.
- `Drawer.tsx` — right-hand slide-over (Escape/backdrop close, scroll-lock) for detail/edit.
- `Modal.tsx` — centered dialog (create forms).
- `ActionsMenu.tsx` — three-dot dropdown (portal-positioned; danger/disabled items).
- `ConfirmDialog.tsx` — `ConfirmProvider` + `useConfirm()` imperative confirm for destructive actions.
- `KpiCard.tsx` — dashboard stat card (icon, value, hint, loading skeleton).
- `Table.tsx` — generic `DataTable<T>` (columns, `rowKey`, loading/empty/error built in) — the reason there are **no duplicate-key warnings**.
- `Tabs.tsx` — underline tabs (Settings sections).
- `index.ts` — barrel re-exporting all of the above.

## components/charts/`Charts.tsx`
- **Role:** View. **Exports:** `GrowthAreaChart`, `StatusDonut`, `SimpleBarChart` (recharts, xQuesty palette, responsive). Used by Dashboard + Reports.

## components/layout/
- `RequireAdmin.tsx` — guard: no token → redirect; validating → loader; validated → children.
- `Sidebar.tsx` — xQuesty-branded nav (Dashboard/Users/Companies/Jobs/Applications/Reports). **No Settings link** (spec).
- `Topbar.tsx` — mobile menu button + **profile dropdown** (My Profile, Settings, Sign out).
- `AdminLayout.tsx` — responsive shell: sidebar + topbar + `<Outlet/>`; off-canvas sidebar on mobile.

## components/users/
- `CreateUserModal.tsx` — role-switching create form (candidate/recruiter) → `users.service`.
- `UserDetailDrawer.tsx` — large view+edit drawer; fetches full profile; field groups per type; PATCHes only changed fields.

## components/companies/`CompanyDetailDrawer.tsx`
- Company overview + editable company_* fields + member recruiters + pools.

## components/jobs/`JobDetailDrawer.tsx`
- Job overview/requirements + management actions (activate/deactivate, archive/unarchive, edit, delete-handled-on-page).

## components/applications/`ApplicationDetailDrawer.tsx`
- Candidate/job context, progress, AI summary (Candidate_summaries), full Q&A transcript (read-only).

## pages/ (VIEW)
- `LoginPage.tsx` — branded login; redirects authenticated admins to the dashboard.
- `DashboardPage.tsx` — KPI cards, growth/donut/bar charts, activity feed, quick actions.
- `UsersPage.tsx` — unified table; search/type filter; 3-dot actions (view/edit/disable/enable/delete); create modal; detail drawer.
- `CompaniesPage.tsx` — searchable company card grid → detail drawer.
- `JobsPage.tsx` — table; search/status filter; actions; detail drawer.
- `ApplicationsPage.tsx` — table with progress bars; search/status filter; transcript drawer.
- `ReportsPage.tsx` — analytics totals, completion gauge, top-companies chart, CSV/Excel export grid.
- `SettingsPage.tsx` — tabbed (My Profile, Admin Users, Security, API Keys placeholder); URL-encoded section; create/delete admins with guards.

---

# Performance layer (added in the optimization pass)

These files were introduced/changed to make the dashboard feel instant. See
[PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) and [SPRINT_REPORT.md](./SPRINT_REPORT.md).

## Backend

### `app/admin/cache.py`  *(new)*
- **Role:** cross-cutting (performance). **Exports:** `TTLCache`, `ttl_cached`.
- **Responsibilities:** dependency-free, thread-safe time-to-live cache and a
  memoize decorator for read-only service aggregates.
- **Interactions:** used by `security.py`, `auth_repository.py`, and the dashboard/
  application/report services.
- **Testing:** exercised indirectly; `tests/conftest.py` clears these caches
  between tests so memoized results don't leak across cases.

### `app/admin/security.py`  *(new)*
- **Role:** cross-cutting (auth performance). **Exports:** `verify_admin_token`,
  `get_admin_profile`, `invalidate_admin`.
- **Responsibilities:** verify the JWT **locally** via Supabase JWKS (ES256), with
  a cached result and a network fallback; cache the `admin_profiles` lookup. This
  removes the ~376 ms-per-request GoTrue round trip that was the root cause.
- **Interactions:** used by `permissions.get_current_admin`.

### Changed backend files
- `permissions.py` — uses `security.verify_admin_token` + `get_admin_profile`.
- `repositories/base.py` — single shared service-role client (`get_shared_supabase`).
- `repositories/auth_repository.py` — `disabled_map` cached (30 s) + invalidated on ban/unban.
- `repositories/candidate_repository.py`, `hr_repository.py` — `list_basic` projection.
- `services/dashboard_service.py` — `stats`/`charts`/`activity` `@ttl_cached(15)`.
- `services/application_service.py` — `list_applications` `@ttl_cached(15)`.
- `services/report_service.py` — `summary` `@ttl_cached(20)`.
- `services/user_service.py` + `routers/users_router.py` — server-side pagination.

## Frontend

### `src/admin/services/cache.ts`  *(new)*
- **Role:** Model (performance). **Exports:** `getCached`, `isFresh`, `setCached`,
  `invalidate`, `dedupe`, `clearCache`, `FRESH_MS`.
- **Responsibilities:** in-memory stale-while-revalidate store + in-flight request
  de-dupe; `invalidate(prefix)` clears affected lists after mutations.

### `src/admin/hooks/useQuery.ts`  *(new)*
- **Role:** Controller. **Exports:** `useQuery(key, fetcher)`.
- **Responsibilities:** cached fetching — instant render of cached data, background
  revalidation, `loading` only on first fetch (drives skeletons), `reload()` to force.
- **Interactions:** used by Dashboard, Users, Companies, Jobs, Applications, Reports.

### `src/admin/components/ui/Pagination.tsx`  *(new)*
- **Role:** View. **Exports:** `Pagination`. "Showing X–Y of N" + prev/next.
  Used by the Users page (server-side) and the `DataTable` client-side mode.

### Changed frontend files
- `components/ui/Table.tsx` — skeleton rows on first load; optional `pageSize`
  client-side pagination.
- `components/ui/primitives.tsx` — `ChartSkeleton`; `Skeleton` accepts `style`.
- `services/users.service.ts` — paginated `listUsers` + `invalidateUsers`.
- `types.ts` — `Paginated<T>` envelope.
- `pages/*` — migrated `useAsync` → `useQuery`; memoized columns; pagination;
  cache invalidation on mutation.
- `AdminApp.tsx` — routes lazy-loaded (`React.lazy` + `Suspense`).

---

# Host-app touch points (edited, not part of the module)
- `frontend/src/App.tsx` — mounts `<Route path="/admin/*" element={<AdminApp/>} />`.
- `backend/app/main.py` — `include_router(admin_module)`.
- `backend/requirements.txt` — added `openpyxl`, `playwright`, `pytest`.
