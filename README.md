# xQuesty "Link" — Recruitment Platform

AI-powered recruitment platform with candidate matching, AI interviews, and smart ranking.

## Structure

```
matching project/
  frontend/       — Next.js 15 (React) application
  backend/        — Python FastAPI server
  PROJECT_MAP.md  — Full system documentation
```

## Getting Started (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Getting Started (Backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

See `PROJECT_MAP.md` for the full system architecture, data flow, and database schema.

---

## Administrator Dashboard

A self-contained **administrator** area lets a platform admin manage every
account on the platform. It mirrors the recruiter/candidate design system
(Tailwind, white cards with `rounded-xl border`, indigo accents, collapsible
sidebar) and reuses the same Supabase service-role + JWT-in-localStorage auth
pattern.

### What it does

| Capability | Where |
|---|---|
| **Admin login** (gated by `admin_profiles` membership) | `/admin/login` |
| **Dashboard** — platform stat cards (recruiters, candidates, pools, active pools) | `/admin` |
| **Manage recruiters** — list, create, delete | `/admin/recruiters` |
| **Manage candidates** — list, create, delete | `/admin/candidates` |

A valid Supabase login is **not** sufficient to enter the admin area — the user
id must also exist in the `admin_profiles` table, or every `/api/admin/*` call
returns `403`.

### File layout (the "administrator" folders)

```
frontend/
  app/admin/                         # Admin pages (route prefix /admin)
    layout.tsx                       # Guards /admin/* (login bypasses), mounts sidebar
    page.tsx                         # Dashboard with stat cards
    login/page.tsx                   # Standalone admin login
    recruiters/page.tsx              # Manage recruiters (table + create modal)
    candidates/page.tsx              # Manage candidates (table + create modal)
  app/api/admin/                     # Admin BFF API routes (service-role key)
    login/route.ts                   # POST — verify creds + admin membership
    me/route.ts                      # GET  — current admin (requireAdmin)
    register/route.ts                # POST — guarded bootstrap (x-admin-setup-token)
    stats/route.ts                   # GET  — platform counts
    recruiters/route.ts              # GET list / POST create
    recruiters/[id]/route.ts         # DELETE
    candidates/route.ts              # GET list / POST create
    candidates/[id]/route.ts         # DELETE
  components/admin/                  # Admin React components
    RequireAdmin.tsx                 # Client route guard
    AdminSidebar.tsx                 # Navigation sidebar (Dashboard/Recruiters/Candidates)
    UserTable.tsx                    # Reusable user listing table
    CreateUserModal.tsx              # Create recruiter/candidate modal
  lib/
    adminAuth.ts                     # Client: loginAdmin, getCurrentAdmin, token, authHeader
    adminGuard.ts                    # Server: requireAdmin(req) — token + admin_profiles check
  supabase/migrations/
    00002_create_admin_profiles.sql  # admin_profiles table + bootstrap notes

backend/
  app/admin/                         # Administrator backend package (mirrors app/candidate)
    __init__.py
    router.py                        # GET /api/v1/admin/health, /capabilities
    test_router.py                   # Hermetic TestClient tests (no DB/env)
```

### API reference (`/api/admin/*`, Next.js BFF)

All routes except `login` and `register` require an
`Authorization: Bearer <admin_token>` header and pass through `requireAdmin`.

| Method | Path | Body / Notes | Returns |
|---|---|---|---|
| POST | `/api/admin/login` | `{ email, password }` | `{ access_token, token_type, admin }` (403 if not an admin) |
| GET | `/api/admin/me` | — | the admin profile |
| POST | `/api/admin/register` | header `x-admin-setup-token`, body `{ full_name, email, password }` | bootstraps an admin (403 if `ADMIN_SETUP_TOKEN` unset) |
| GET | `/api/admin/stats` | — | `{ recruiters, candidates, pools, activePools }` |
| GET | `/api/admin/recruiters` | — | `hr_profiles[]` (newest first) |
| POST | `/api/admin/recruiters` | `{ full_name, email, password, company_name, phone? }` | created recruiter |
| DELETE | `/api/admin/recruiters/[id]` | — | `{ ok, id }` |
| GET | `/api/admin/candidates` | — | `candidate_profiles[]` (newest first) |
| POST | `/api/admin/candidates` | `{ full_name, email, password, phone }` | created candidate |
| DELETE | `/api/admin/candidates/[id]` | — | `{ ok, id }` |

### Setup

1. **Apply the migration** — run `frontend/supabase/migrations/00002_create_admin_profiles.sql`
   against your Supabase project (creates the `admin_profiles` table).

2. **Create the first admin** (either option):
   - **Guarded bootstrap (recommended for dev):** set `ADMIN_SETUP_TOKEN=<a-secret>`
     in `frontend/.env`, then:
     ```bash
     curl -X POST http://localhost:3000/api/admin/register \
       -H "Content-Type: application/json" \
       -H "x-admin-setup-token: <a-secret>" \
       -d '{"full_name":"Platform Admin","email":"admin@example.com","password":"changeme123"}'
     ```
     The endpoint is disabled (403) whenever `ADMIN_SETUP_TOKEN` is unset.
   - **By hand (SQL):** create the user in Supabase Auth, then
     `insert into public.admin_profiles (id, full_name, email) values ('<auth-uuid>', 'Platform Admin', 'admin@example.com');`

3. **Log in** at [http://localhost:3000/admin/login](http://localhost:3000/admin/login).

### Backend admin tests

```bash
cd backend
.venv\Scripts\python -m app.admin.test_router    # hermetic, no DB/server needed
# or: pytest app/admin/test_router.py
```

> Environment variables used: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
> (already required by the app), plus the optional `ADMIN_SETUP_TOKEN` for the
> bootstrap endpoint.
