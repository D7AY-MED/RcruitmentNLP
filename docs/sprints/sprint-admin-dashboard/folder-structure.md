# Folder Structure

## Backend — `backend/app/admin/`

```
admin/
├── __init__.py              # exports `router` (the aggregated APIRouter)
├── router.py                # mounts all sub-routers under /api/v1/admin
├── permissions.py           # get_current_admin dependency (admin gate)
├── validators.py            # reusable input validators
│
├── repositories/            # MODEL — database access only
│   ├── __init__.py
│   ├── base.py              # BaseRepository: shared Supabase client
│   ├── admin_repository.py        # admin_profiles
│   ├── candidate_repository.py    # candidate_profiles
│   ├── hr_repository.py           # hr_profiles
│   ├── job_pool_repository.py     # job_pools
│   ├── interview_repository.py    # interview_sessions
│   ├── summary_repository.py      # Candidate_summaries
│   └── auth_repository.py         # Supabase Auth admin API (create/ban/delete)
│
├── services/                # CONTROLLER — business rules
│   ├── __init__.py
│   ├── auth_service.py
│   ├── dashboard_service.py
│   ├── user_service.py
│   ├── company_service.py
│   ├── job_service.py
│   ├── application_service.py
│   ├── report_service.py
│   └── settings_service.py
│
├── routers/                 # VIEW — thin HTTP endpoints
│   ├── __init__.py
│   ├── auth_router.py        # /login /register /me /logout /health
│   ├── dashboard_router.py   # /dashboard/{stats,charts,activity}
│   ├── users_router.py       # /users ...
│   ├── companies_router.py   # /companies ...
│   ├── jobs_router.py        # /jobs ...
│   ├── applications_router.py# /applications ...
│   ├── reports_router.py     # /reports/{summary,export}
│   └── settings_router.py    # /settings/{admins,profile,security,api-keys}
│
├── schemas/                  # pydantic request/response contracts
│   ├── __init__.py
│   ├── common.py
│   ├── auth_schemas.py
│   ├── dashboard_schemas.py
│   ├── user_schemas.py
│   ├── company_schemas.py
│   ├── job_schemas.py
│   └── settings_schemas.py
│
└── tests/                    # fast unit tests (no live DB)
    ├── __init__.py
    ├── conftest.py           # stubs the Supabase client
    ├── test_validators.py
    ├── test_application_service.py
    ├── test_company_and_report.py
    └── test_routers.py       # TestClient wiring smoke tests
```

## Frontend — `frontend/src/admin/`

```
admin/
├── AdminApp.tsx             # module entry: providers + route table (mounted at /admin/*)
├── types.ts                 # shared TypeScript contracts
│
├── context/
│   └── AdminAuthContext.tsx # current admin + login/logout/refresh
│
├── hooks/
│   ├── useAsync.ts          # generic loading/error/data fetcher
│   ├── useDebounce.ts       # debounce search inputs
│   └── useToast.ts          # toast helper (react-hot-toast)
│
├── services/                # MODEL — typed API access
│   ├── client.ts            # http wrapper (token, errors, download)
│   ├── auth.service.ts
│   ├── dashboard.service.ts
│   ├── users.service.ts
│   ├── companies.service.ts
│   ├── jobs.service.ts
│   ├── applications.service.ts
│   ├── reports.service.ts
│   └── settings.service.ts
│
├── lib/
│   └── format.ts            # date / value formatting helpers
│
├── components/
│   ├── ui/                  # design-system primitives
│   │   ├── Button.tsx  form.tsx  primitives.tsx  SearchInput.tsx
│   │   ├── Drawer.tsx  Modal.tsx  ActionsMenu.tsx  ConfirmDialog.tsx
│   │   ├── KpiCard.tsx  Table.tsx  Tabs.tsx  index.ts (barrel)
│   ├── charts/
│   │   └── Charts.tsx       # recharts wrappers (area, donut, bar)
│   ├── layout/
│   │   ├── AdminLayout.tsx  Sidebar.tsx  Topbar.tsx  RequireAdmin.tsx
│   ├── users/
│   │   ├── CreateUserModal.tsx  UserDetailDrawer.tsx
│   ├── companies/CompanyDetailDrawer.tsx
│   ├── jobs/JobDetailDrawer.tsx
│   └── applications/ApplicationDetailDrawer.tsx
│
└── pages/                   # VIEW — one per route
    ├── LoginPage.tsx
    ├── DashboardPage.tsx
    ├── UsersPage.tsx
    ├── CompaniesPage.tsx
    ├── JobsPage.tsx
    ├── ApplicationsPage.tsx
    ├── ReportsPage.tsx
    └── SettingsPage.tsx
```

## Where it plugs into the host app

- **Backend:** `backend/app/main.py` does `from app.admin import router as admin_module`
  then `app.include_router(admin_module)`. One line; nothing else in the app
  references admin internals.
- **Frontend:** `frontend/src/App.tsx` mounts the module with a single splat route:
  `<Route path="/admin/*" element={<AdminApp />} />`. `AdminApp` owns everything
  below `/admin`.
