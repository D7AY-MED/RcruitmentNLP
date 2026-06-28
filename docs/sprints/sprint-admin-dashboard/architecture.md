# Architecture

The Admin Dashboard is two cooperating MVC modules — one in the FastAPI backend,
one in the React frontend — talking over a JSON HTTP API under `/api/v1/admin`.

```
┌──────────────────────────── Browser ────────────────────────────┐
│  React + Vite SPA  (frontend/src/admin)                          │
│                                                                  │
│   Pages (View)  ──uses──▶  Hooks/Context  ──calls──▶ Services    │
│       │                                                  │       │
│       └──────────────── render UI ◀──────────────────────┘       │
│                                                          │       │
└──────────────────────────────────────────────────────── │ ──────┘
                                                           │ fetch  (Bearer JWT)
                                                           ▼
┌──────────────────────────── FastAPI ────────────────────────────┐
│  Admin module  (backend/app/admin)                               │
│                                                                  │
│   Routers (View) ─▶ Services (Controller) ─▶ Repositories (Model)│
│       │                    │                       │             │
│   permissions.py      validators.py            Supabase client   │
│   (admin gate)        (input rules)                 │            │
└───────────────────────────────────────────────────── │ ─────────┘
                                                        ▼
                                          ┌──────── Supabase ───────┐
                                          │  Postgres (6 tables)    │
                                          │  + GoTrue Auth          │
                                          └─────────────────────────┘
```

## Layers (backend)

| Layer | Folder | Responsibility | May import |
|-------|--------|----------------|------------|
| **View** | `routers/` | Parse the HTTP request, enforce the admin dependency, call one service method, serialise the response. **No business logic.** | services, schemas, permissions |
| **Controller** | `services/` | Business rules: orchestrate repositories, validate, shape data, enforce invariants (e.g. "can't delete the last admin"). Raise `HTTPException` on domain errors. | repositories, schemas, validators |
| **Model** | `repositories/` | The only code that touches the database. One class per table (plus `AuthRepository` for GoTrue). Returns plain dicts/lists. | the Supabase client |
| Cross-cutting | `permissions.py`, `validators.py`, `schemas/` | Auth dependency, reusable validators, request/response contracts. | — |

**The dependency rule points one way:** routers → services → repositories. A
repository never imports a service; a router never imports a repository. This is
what keeps the layers swappable and testable.

## Layers (frontend)

| Layer | Folder | Responsibility |
|-------|--------|----------------|
| **View** | `pages/`, `components/` | Render UI, handle local interaction state. |
| **Controller** | `hooks/`, `context/` | `useAsync` (loading/error/data), `useDebounce`, `useConfirm`, `useToast`; `AdminAuthContext` (session). |
| **Model** | `services/`, `types.ts` | API access via the `http` client; typed contracts. |

The `client.ts` `http` wrapper is the single choke-point for every request: it
injects the bearer token, normalises FastAPI error shapes, and flags auth errors.

## Request lifecycle (example: open the Users page)

1. `UsersPage` mounts and calls `useAsync(() => usersService.listUsers(...))`.
2. `usersService.listUsers` calls `http.get('/api/v1/admin/users?...')`, which
   attaches `Authorization: Bearer <admin_token>`.
3. FastAPI routes to `users_router.list_users`, whose `Depends(get_current_admin)`
   runs **`permissions.get_current_admin`** → `app.auth.verify_token` (validates
   the Supabase JWT) → `AdminRepository.get(user_id)` (is this user an admin?).
4. The router calls `UserService().list_users(...)`.
5. `UserService` merges `CandidateRepository.list_all()` + `HrRepository.list_all()`,
   overlays disabled status from `AuthRepository.disabled_map()`, filters/sorts,
   and returns normalised rows.
6. The router returns the list; `useAsync` flips to `{loading:false, data}`; the
   table renders.

## Authentication & authorization

- **Authentication** is unchanged from the rest of the app: a Supabase-issued JWT
  in `localStorage` under `admin_token`, verified server-side by
  `app.auth.verify_token` (a call to Supabase `/auth/v1/user`).
- **Authorization** is the admin gate: `permissions.get_current_admin` looks the
  authenticated user up in `admin_profiles`; absence ⇒ `403`.
- **Login** (`AuthService.login`) signs in via Supabase, then confirms the user is
  in `admin_profiles` before returning the token.
- This is deliberately *not* an auth rewrite — only the role check is admin-specific.

## "Disable user" without a schema column

The profile tables have no `status`/`disabled` column, and the schema is frozen.
So **disable = ban the user in Supabase Auth** (`AuthRepository.ban_user` sets a
~100-year `ban_duration` via the GoTrue admin API); enable removes the ban. The
Users list reads ban state in one paged sweep (`AuthRepository.disabled_map`) so
the disabled badge is accurate without an auth call per row.

## Data sources per screen

| Screen | Primary table(s) | Notes |
|--------|------------------|-------|
| Dashboard | all six | counts + 6-month growth + status breakdowns + activity |
| Users | `candidate_profiles` + `hr_profiles` | unified; admins excluded |
| Companies | `hr_profiles` | aggregated by `company_name` (no companies table) |
| Jobs | `job_pools` (join `hr_profiles`) | management actions on existing columns |
| Applications | `interview_sessions` (+ `candidate_profiles`, `job_pools`, `Candidate_summaries`) | rows grouped by `session_id` into applications |
| Reports | all six | analytics + CSV/XLSX export built in-memory |
| Settings → Admin Users | `admin_profiles` | the only admin-management surface |

See **[database-mapping.md](./database-mapping.md)** for the column-level detail.
