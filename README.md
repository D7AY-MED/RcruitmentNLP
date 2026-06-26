# xQuesty "Link" — Recruitment Platform

AI-powered recruitment platform with candidate matching, AI interviews, smart
ranking, and a full administration console.

## Structure

```
RcruitmentNLP/
  frontend/        — Vite + React 19 (TypeScript, Tailwind, react-router) SPA
  backend/         — Python FastAPI server (Supabase data + auth)
  .env             — single root env file, shared by both apps (gitignored)
  PROJECT_MAP.md   — full system architecture, flows, and database schema
```

> The frontend is a **Vite SPA** (not Next.js). `vite.config.ts` points `envDir`
> at the project root, so a single root `.env` serves both apps.

## Environment

Create a `.env` in the project root. The backend reads the unprefixed and
`NEXT_PUBLIC_*` keys; the Vite frontend only sees `VITE_*` keys.

```bash
# Backend / Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>     # server-side only
SUPABASE_JWT_SECRET=<legacy-jwt-secret>
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=<hex>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=43200
ADMIN_SETUP_TOKEN=<token-for-first-admin-bootstrap>   # optional
TOTAL_QUESTIONS=15

# Frontend (Vite) — only VITE_* vars are exposed to the browser
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>          # NOT the service-role key
VITE_API_URL=http://localhost:8000
VITE_TOTAL_QUESTIONS=15
```

## Getting Started (Backend)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (use source .venv/bin/activate on Unix)
pip install -r requirements.txt
uvicorn app.main:app --reload     # http://localhost:8000  (docs at /docs)
```

## Getting Started (Frontend)

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

## Admin Dashboard

A self-contained administration console lives at **`/admin`**
(`http://localhost:5173/admin/login`). It is built as an isolated **MVC module**:

- **Backend:** `backend/app/admin/` — `repositories` (Model) → `services`
  (Controller) → `routers` (View), mounted at `/api/v1/admin`.
- **Frontend:** `frontend/src/admin/` — pages, layout, components, services,
  hooks, context.

Features: a premium dashboard (KPIs, charts, activity), unified **Users**
(candidates + recruiters) with a detail drawer, **Companies**, **Jobs**,
**Applications** (interview transcript + AI summary), **Reports** (CSV/Excel
export), and **Settings** (admin users, profile, security). It adapts strictly to
the existing database (no schema changes) and is tuned for speed — see
"Admin Dashboard" in `PROJECT_MAP.md`.

```bash
# run the admin module's backend unit tests
cd backend && python -m pytest app/admin/tests -q
```

See `PROJECT_MAP.md` for the full system architecture, data flow, and database
schema.

## Vercel Deployment

Both the Vite frontend and Python backend are deployed within a single Vercel project.
- **Root Directory in Vercel settings:** `frontend`
- **Include files outside root directory in the Build Step:** Enabled (ON)
- **Dependencies:** The Python serverless dependencies for Vercel are referenced in [requirements.txt](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/frontend/requirements.txt) inside the `frontend` directory (which maps back to the core `backend/requirements.txt`).

