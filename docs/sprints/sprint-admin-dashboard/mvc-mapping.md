# MVC Mapping

A precise map of which file plays which role, so a junior developer always knows
where a given kind of change belongs.

## The rule of thumb

> **Where do I put this code?**
> - Reads/writes the database → a **repository** (Model).
> - A business decision, a rule, combining data → a **service** (Controller).
> - Wiring an HTTP request to a service call → a **router** (View, backend).
> - Rendering pixels / handling clicks → a **page or component** (View, frontend).
> - Fetching from the API → a **service** (frontend Model).
> - Shared async/UI behaviour → a **hook** or **context** (frontend Controller).

## Backend

| MVC role | Files | What lives here | What must NOT live here |
|----------|-------|-----------------|--------------------------|
| **Model** | `repositories/*.py` | `.table(...).select/insert/update/delete`, GoTrue admin calls | business rules, HTTP, validation |
| **Controller** | `services/*.py` | grouping rows into applications, computing KPIs, "can't delete last admin", disable-via-ban, building CSV/XLSX | raw SQL/PostgREST (delegate to repos), HTTP routing |
| **View** | `routers/*.py` | `APIRouter`, path/query parsing, `Depends(get_current_admin)`, one service call, response model | loops over data, conditionals on domain state, DB access |
| **Auth (cross-cut)** | `permissions.py` | the admin dependency | token verification (reused from `app.auth`) |
| **Validation (cross-cut)** | `validators.py` | `validate_user_type`, `validate_dataset`, `validate_format` | DB access |
| **Contracts** | `schemas/*.py` | pydantic in/out models | logic |

### Concrete example — "disable a user"

```
POST /api/v1/admin/users/candidate/{id}/disable
   │
routers/users_router.py  disable_user()        ← VIEW: parse path, check admin, call service
   │
services/user_service.py  set_disabled(...)    ← CONTROLLER: verify the user exists, decide ban vs unban
   │
repositories/auth_repository.py  ban_user(id)  ← MODEL: PUT ban_duration to GoTrue
```

## Frontend

| MVC role | Files | What lives here |
|----------|-------|-----------------|
| **Model** | `services/*.ts`, `types.ts`, `services/client.ts` | API calls, token handling, typed shapes |
| **Controller** | `hooks/*.ts`, `context/AdminAuthContext.tsx` | `useAsync`, `useDebounce`, `useConfirm`, `useToast`, session state |
| **View** | `pages/*.tsx`, `components/**` | layout, tables, drawers, forms, charts |

### Concrete example — "the Users page"

```
pages/UsersPage.tsx                       ← VIEW: renders table, search, filter, actions
   │ uses
hooks/useAsync.ts + hooks/useDebounce.ts  ← CONTROLLER: fetch lifecycle + debounced search
   │ calls
services/users.service.ts                 ← MODEL: GET /api/v1/admin/users
   │ via
services/client.ts (http.get)             ← MODEL: token + error handling
```

The detail drawer (`components/users/UserDetailDrawer.tsx`) is also a View; it
calls `users.service.ts` directly for the single-record fetch and the update.

## Performance layer (where caching lives in the MVC picture)

The optimization pass added a thin **cross-cutting performance layer** that does
not change the MVC roles — it sits beside them:

| Concern | File | Layer it serves |
|---------|------|-----------------|
| Local JWT verification + cached admin lookup | `security.py` | in front of the **auth dependency** (Model access avoided) |
| TTL cache primitive + memoize decorator | `cache.py` | used by **Controllers** (services) and the **Model** (auth_repository) |
| Shared DB client | `repositories/base.py` | **Model** |
| Aggregate memoization | `dashboard/application/report` services | **Controller** |
| Request cache + de-dupe | `services/cache.ts`, `hooks/useQuery.ts` | frontend **Model**/**Controller** |

Rule of thumb unchanged: caching is an implementation detail *inside* a layer
(e.g. a service memoizes its own aggregate), never a new place for business
rules. Mutations invalidate the caches they affect (e.g. ban/unban clears the
disabled-map cache; user writes invalidate the frontend `users:`/`dashboard:`
cache keys).

## Why this matters

- **Testability.** Services are tested by injecting fake repositories
  (`tests/test_application_service.py`, `test_company_and_report.py`) — no DB.
  Routers are tested with `TestClient` and an overridden admin dependency.
- **Swappability.** If the project ever moves off Supabase, only the
  repositories change. If the dashboard KPIs change, only `dashboard_service`
  changes. Routers and the frontend stay put.
- **Findability.** A bug in a number on the dashboard → `dashboard_service`. A
  404 on an endpoint → the matching `routers/*.py`. A wrong column →
  the matching `repositories/*.py`.
