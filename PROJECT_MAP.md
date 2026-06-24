# xQuesty "Link" — Project Map

## Project Structure

```
RcruitmentNLP/
├── frontend/                  # Vite + React 19 SPA (TypeScript, Tailwind, react-router v6)
│   ├── index.html             # Vite entry HTML
│   ├── vite.config.ts         # envDir → project root (single shared .env); dev port 5173
│   ├── package.json           # react, react-router-dom, @supabase/supabase-js, recharts, tailwind
│   ├── tsconfig.json          # path alias "@" → ./src
│   ├── tailwind.config.ts
│   ├── supabase/migrations/   # SQL migrations (candidate_profiles, admin_profiles, job_pools)
│   └── src/
│       ├── App.tsx            # react-router route table (mounts /admin/* → AdminApp)
│       ├── main.tsx           # React entry
│       ├── admin/             # ★ Admin Dashboard — isolated MVC module (see "Admin Dashboard")
│       │   ├── AdminApp.tsx       # providers + lazy-loaded route table
│       │   ├── pages/             # Login, Dashboard, Users, Companies, Jobs, Applications, Reports, Settings
│       │   ├── components/        # layout/ ui/ charts/ + per-feature detail drawers
│       │   ├── services/          # typed API access + SWR request cache (client.ts, cache.ts)
│       │   ├── hooks/             # useQuery (cached fetch), useDebounce, useToast
│       │   ├── context/           # AdminAuthContext
│       │   └── types.ts
│       ├── app/               # Candidate + recruiter pages (folder-per-route)
│       │   ├── (candidate)/apply/…   # Tokenized public application + interview
│       │   ├── dashboard/         # Recruiter dashboard (RequireRecruiter)
│       │   ├── job-pools/         # Pool list + detail
│       │   ├── recruiter/         # Recruiter login / register
│       │   └── page.tsx           # Landing page
│       ├── components/        # Shared UI (ui/, candidate/, job-pools/, AppSidebar, …)
│       ├── interview/         # Candidate interview UI + lib
│       ├── lib/               # auth.ts, candidateAuth.ts, recruiterAuth.ts, jobPoolService.ts,
│       │                      #   supabase.ts (anon client), utils.ts, types.ts
│       └── styles/globals.css
├── backend/                   # Python FastAPI application (Supabase service-role data + auth)
│   ├── app/
│   │   ├── main.py            # FastAPI entrypoint (registers all routers)
│   │   ├── config.py          # loads root .env then backend/.env
│   │   ├── auth.py            # Supabase JWT verification + role dependencies (recruiter/candidate/admin)
│   │   ├── schemas.py, schemas_candidate.py
│   │   ├── admin/             # ★ Admin module — strict MVC (mounted at /api/v1/admin)
│   │   │   ├── router.py          # aggregates sub-routers
│   │   │   ├── repositories/      # Model — one class per table + AuthRepository (GoTrue)
│   │   │   ├── services/          # Controller — dashboard, user, company, job, application, report, settings, auth
│   │   │   ├── routers/           # View — thin HTTP endpoints
│   │   │   ├── schemas/           # pydantic request/response contracts
│   │   │   ├── permissions.py     # admin auth dependency (local JWKS verify + cached lookup)
│   │   │   ├── security.py        # local ES256/JWKS token verification (perf)
│   │   │   ├── cache.py           # tiny TTL cache + memoize decorator (perf)
│   │   │   ├── validators.py
│   │   │   └── tests/             # unit tests (pytest, no live DB)
│   │   ├── candidate/router.py    # Candidate API (/api/candidate)
│   │   ├── interview/             # Interview engine (router, OpenAI client, session_store, prompts)
│   │   ├── routers/               # pools.py (job-pools), recruiter_supabase.py (recruiter auth)
│   │   └── services/              # gemini_store_service.py (Gemini File Search)
│   └── requirements.txt
├── .env                       # Single root env, shared by both apps (gitignored)
├── PROJECT_MAP.md             # This file
├── README.md
└── .gitignore
```

## Overview

xQuesty "Link" is an AI-powered recruitment platform feature that enables recruiters to generate personalized interview links tied to specific job offers. Candidates upload their CV and take a text-based AI interview; recruiters receive pre-qualified candidates ranked by intelligent matching.

---

## Admin Dashboard

A self-contained administration console at **`/admin`** (login at
`/admin/login`). It is built as a strict **MVC module** on both sides and adapts
to the **existing database only** — it creates no tables and changes no schema.

```
Browser (React)                         FastAPI (/api/v1/admin)
  pages / components  ─uses─▶ hooks/context ─▶ services ──fetch──▶ routers (View)
        (View)               (Controller)     (Model: API)            │
                                                                      ▼
                                                            services (Controller)
                                                                      │
                                                                      ▼
                                                          repositories (Model) ─▶ Supabase
```

| Layer | Backend (`backend/app/admin/`) | Frontend (`frontend/src/admin/`) |
|-------|--------------------------------|----------------------------------|
| **Model** | `repositories/` (one per table) | `services/` + `types.ts` (typed API access) |
| **Controller** | `services/` (business rules) | `hooks/` + `context/` (`useQuery`, auth) |
| **View** | `routers/` (thin endpoints) | `pages/` + `components/` |

**Features**

| Area | Source table(s) | Capabilities |
|------|-----------------|--------------|
| Dashboard | all six | KPI cards, growth/status/pool charts, recent activity, quick actions |
| Users | `candidate_profiles` + `hr_profiles` | unified list, search, filter, view/edit drawer, disable (Supabase ban), delete, server-side pagination. Admins excluded |
| Companies | `hr_profiles` (derived) | aggregated by `company_name`; recruiters, jobs, editable company profile |
| Jobs | `job_pools` | list/search/filter, detail, activate/deactivate, archive, edit, delete |
| Applications | `interview_sessions` (+ `Candidate_summaries`) | sessions as applications: progress, status, transcript, AI summary |
| Reports | all six | analytics summary + CSV/Excel export |
| Settings | `admin_profiles` | admin users (the only admin-management surface), profile, security; reached via the profile dropdown, not the sidebar |

**Auth & performance.** Admin endpoints reuse the platform's Supabase JWT.
Verification is done **locally** against Supabase's JWKS (ES256) and cached,
instead of a network call per request — the key optimization that took the
dashboard load from ~27 s to ~30 ms. Read-only aggregates are TTL-cached, the
Users list is column-projected and paginated, and the frontend uses a
stale-while-revalidate request cache with skeleton loaders. Disable/enable a user
is implemented via a Supabase Auth **ban** (no status column exists in the
schema, and the schema is frozen).

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19 + Vite** | Dynamic SPA, fast dev/build, reusable components |
| **react-router v6** | Client-side routing (candidate, recruiter, admin areas) |
| **Tailwind CSS** | Utility-first styling and the admin design system |
| **Recharts** | Admin dashboard / reports charts |

### Backend
| Technology | Purpose |
|---|---|
| **Python FastAPI** | High-performance async API, excellent for AI integration |

### Authentication & Storage
| Technology | Purpose |
|---|---|
| **Supabase Auth** | Fast, reliable, secure authentication with JWT tokens |
| **Supabase Storage (S3)** | CV file storage with native bucket management |

### Database
| Technology | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Relational storage for users, pools, Q&A, audit trails |

### AI / Machine Learning
| Technology | Purpose |
|---|---|
| **Gemini File Search** | Fast, cost-effective embedding engine — first layer of matching (Top 30) |
| **OpenAI API** | Question generation, response analysis, summaries, final matching (Top 5) |
| **Sentence-BERT / Transformers** | Advanced semantic similarity understanding |

---

## System Flow

### Recruiter Journey

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CREATE ACCOUNT                                              │
│     └─> Supabase Auth (JWT token)                               │
│                                                                 │
│  2. ACCESS DASHBOARD                                            │
│     └─> ReactJS frontend loads recruiter dashboard              │
│                                                                 │
│  3. CREATE POOL                                                 │
│     └─> POST /api/v1/job-pools (FastAPI backend)                │
│         ├─> Supabase PostgreSQL: pool record created            │
│         ├─> Gemini File Search store created & linked           │
│         │   (naming: pool-{title_slug}-{recruiter_tag_8_chars}) │
│         └─> Rollback database insertion & raise HTTP 502        │
│             if store creation fails (propagates to UI error)    │
│                                                                 │
│  4. FILL JOB DESCRIPTION                                        │
│     └─> Form: title, seniority, languages, skills, etc.         │
│         └─> Saved to DB for audit trail                         │
│                                                                 │
│  5. GENERATE UNIQUE LINK                                        │
│     └─> Frontend creates link: /apply/[token]                   │
│         └─> Returns shareable URL (social, email, job boards)   │
│                                                                 │
│  6. RECEIVE CANDIDATES                                          │
│     └─> Dashboard shows finished candidates                     │
│         └─> Contacts, CV, AI summary, matching score            │
│                                                                 │
│  7. VIEW RANKED CANDIDATES                                      │
│     └─> Auto-ranked by relevance score (embedding-based)        │
│                                                                 │
│  8. INTELLIGENT SEARCH (2 layers)                               │
│     └─> Layer 1: Gemini File Search → Top 30 candidates         │
│     └─> Layer 2: OpenAI API → Top 5 + matching justification    │
└─────────────────────────────────────────────────────────────────┘
```

### Candidate Journey

```
┌─────────────────────────────────────────────────────────────────┐
│  1. CLICK LINK                                                  │
│     └─> Link contains pool_id + job_description context         │
│                                                                 │
│  2. LOGIN / SIGNUP                                              │
│     └─> Supabase Auth (fast, reliable JWT)                      │
│                                                                 │
│  3. UPLOAD CV                                                   │
│     └─> File → Supabase Storage S3 bucket                       │
│         └─> Secure URL generated                                │
│                                                                 │
│  4. CV ANALYSIS                                                 │
│     └─> CV sent to OpenAI API with job_description              │
│         └─> Skills, experience, education extracted             │
│                                                                 │
│  5. FIRST AI QUESTION                                           │
│     └─> Generated dynamically based on CV + job offer           │
│         └─> Fully personalized interview start                  │
│                                                                 │
│  6. FULL INTERVIEW                                              │
│     └─> Technical skills, soft skills, motivation, mobility...  │
│         └─> AI-driven conversational flow                       │
│                                                                 │
│  7. REAL-TIME SAVE                                              │
│     └─> Each Q&A saved to Supabase PostgreSQL                   │
│         └─> Full audit trail                                    │
│                                                                 │
│  8. AI SUMMARY & EMBEDDING                                      │
│     ├─> Fact-based answers summary generated via active session │
│     │   └─> Saved in Candidate_summaries table                  │
│     ├─> Resume generated by OpenAI API                          │
│     └─> Embedding object stored in pool's vector store          │
│         └─> Indexed for future matching                         │
│                                                                 │
│  9. CONFIRMATION                                                │
│     └─> Message: "Your profile is now visible to the recruiter" │
│         └─> Transparent, reassuring candidate experience        │
└─────────────────────────────────────────────────────────────────┘
```

> **Status — `/apply/[token]` page (June 2026):** fully dynamic, fetching job pool details directly from Supabase. It uses the Jobzyn-style layout, showing recruiter company name, dynamically rendered job sections (missions, required profile, benefits), and handles candidate CV upload and authentication using Supabase. The shareable tokenized URL allows public candidate access.
>
> **Status — `/job-pools/[id]` page (June 2026):** recruiter-facing pool details view integrated with a secure applicant management table. Displays candidates who applied to the pool (showing Candidate avatar/info, AI Match Score, progress bar, status, and last updated timestamp), sorted by score descending. Clicking a candidate opens a sliding drawer containing contact info, AI-generated summary, and complete interview Q&A transcript.

### Data Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│  Recruiter  │────▶│   ReactJS   │────▶│  FastAPI (Py)   │
│  (Browser)  │◀────│   Frontend  │◀────│    Backend      │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
            ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
            │ Supabase Auth│              │  PostgreSQL  │              │  S3 Storage  │
            │   (JWT)      │              │   (Users,    │              │   (CV Files) │
            │              │              │   Pools, Q&A)│              │              │
            └──────────────┘              └──────────────┘              └──────────────┘
                                                  │
                    ┌─────────────────────────────┼
                    │                             │                            
                    ▼                             ▼                             
            ┌──────────────┐              ┌──────────────┐              
            │ Gemini File  │              │  OpenAI API  │              
            │   Search     │              │  (Questions, │             
            │ (Embedding   │              │  Analysis,   │              
            │   Layer 1)   │              │  Summaries)  │             
            └──────────────┘              └──────────────┘              
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                          ┌──────────────┐
                          │   Candidate  │
                          │   (Browser)  │
                          └──────────────┘
```

---

## Database Schema (existing tables — source of truth)

The platform uses six Supabase (PostgreSQL) tables. The Admin module adapts to
these exactly; **no schema changes** are made by it.

| Table | Key fields | Description |
|---|---|---|
| **admin_profiles** | id (uuid→auth.users), full_name, email, created_at | Administrator accounts (auth via Supabase) |
| **candidate_profiles** | id, full_name, email, phone, title, linkedin_url, current_job_title, current_company, years_of_experience, city, education_level, university_name, field_of_study, languages[], expected_salary_min/max, profile_picture_url, open_to_work, created_at | Candidate profiles mapping to Auth users |
| **hr_profiles** | id, full_name, email, phone, company_name, company_description, company_industry, company_size, company_website, company_linkedin_url, company_email, company_phone, company_address, company_founded_year, created_at | Recruiter profiles + the company data "Companies" is derived from |
| **job_pools** | id, hr_id (FK→hr_profiles), title, description, public_token, status, archived, main_mission, must_have_skills[], nice_to_have_skills[], soft_skills[], deal_breakers[], responsibilities[], languages[], years_experience, experience_range, seniority_level, education_level, contract_type, location, generated_jd, gemini_store_name, notes, created_at | Job pools/offers with unique tokenized links |
| **interview_sessions** | id, candidate_id (FK→candidate_profiles), session_id (uuid), pool_id, name, phone, question, answer, sequence, session_status, openai_session_id, timestamp | Interview Q&A — one row per question; grouped by `session_id` into an "application" |
| **Candidate_summaries** | id, candidate_id (FK→candidate_profiles), Candidate_name, summary, score, phone, gemini_store_name, last_updated | AI-generated interview summary + granular match score (0.00 - 100.00) per candidate |

> The conceptual "Application", "Embedding" and "Q&A" entities map onto
> `interview_sessions` (transcript/status) and `Candidate_summaries` (AI summary
> + score); vector indexing for matching is handled by the Gemini File Search
> store referenced by `job_pools.gemini_store_name`.

---

## Matching Engine (2-Layer Architecture)

```
Recruiter Search Query
        │
        ▼
┌─────────────────────┐
│  LAYER 1: Gemini    │
│  File Search        │
│  ─────────────────  │
│  • Fast (< 1s)      │
│  • Cost-effective   │
│  • Returns Top 30   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  LAYER 2: OpenAI    │
│  API                │
│  ─────────────────  │
│  • Deep reasoning   │
│  • Returns Top 5    │
│  • + Justification  │
│    textuelle        │
└──────────┬──────────┘
           │
           ▼
    Recruiter Dashboard
    (Ranked results + why)
```

---

## Future Features (Out of MVP Scope)

| Feature | Description | Value |
|---|---|---|
| **Personalized Rejection Emails** | AI-generated rejection email per candidate, valuing their profile | Retention & employer branding |
| **Advanced Monetization** | Paid access to intelligent ranking & advanced search tools | Scalable business model |
| **AI HR Assistant** | Chatbot for CV writing, cover letter improvement, interview prep | Candidate support |
| **Deep CV Analysis** | Missing skills detection, strengths, career coherence | Enhanced matching |

---

*Generated for xQuesty Team — June 2026*
