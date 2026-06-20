# xQuesty "Link" — Project Map

## Project Structure

```
matching project/
├── frontend/                  # Next.js (React) application
│   ├── app/                   # Next.js App Router pages & API routes
│   │   ├── (candidate)/       # Candidate-scoped pages (route group → no URL prefix)
│   │   │   └── apply/
│   │   │       ├── [token]/
│   │   │       │   └── page.tsx # Dynamic /apply/[token] candidate view (Supabase integration)
│   │   │       └── page.tsx   # /apply static/demo layout page
│   │   ├── api/
│   │   │   ├── job-pools/     # Backend-for-frontend API (bypasses RLS with service key)
│   │   │   │   ├── route.ts   # POST (verify recruiter + insert), GET (list)
│   │   │   │   ├── [id]/route.ts  # GET (single), PATCH (status), DELETE
│   │   │   │   └── public/route.ts# GET public pool by token (joins hr_profiles)
│   │   │   └── recruiter/     # Recruiter authentication endpoints
│   │   │       ├── login/route.ts # POST login
│   │   │       ├── register/route.ts # POST register
│   │   │       └── me/route.ts    # GET current session user
│   │   ├── dashboard/         # Recruiter authenticated dashboard
│   │   │   ├── layout.tsx     # RequireRecruiter guard & sidebar wrapper
│   │   │   └── page.tsx       # List created pools, metrics, actions
│   │   ├── recruiter/         # Auth pages
│   │   │   ├── login/page.tsx # Recruiter login view
│   │   │   └── register/page.tsx # Recruiter register view
│   │   ├── job-pools/         # (Legacy/Reference) HR dashboard pages
│   │   ├── pool/              # (Legacy/Reference) Public application pages
│   │   └── page.tsx           # Home page (search & match)
│   ├── components/            # React components (ui, job-pools, candidate, etc.)
│   │   ├── candidate/         # Candidate-facing reusable components
│   │   │   ├── AuthRequiredModal.tsx # Dialog prompted before candidate applies
│   │   │   ├── JobHeroSection.tsx  # Hero with title, company badge, metadata, CTAs
│   │   │   └── JobSidebar.tsx      # Sticky sidebar: company card, CTA, info
│   │   ├── AppSidebar.tsx     # Navigation sidebar for recruiter dashboard
│   │   └── RequireRecruiter.tsx # Auth protection wrapper for pages/layouts
│   ├── lib/                   # Utilities, types, services
│   │   ├── frontendData.ts    # Mock data + helper functions
│   │   ├── jobPoolService.ts  # CRUD / API fetch wrappers with JWT Auth header
│   │   ├── recruiterAuth.ts   # Client-side session and cookie helpers
│   │   ├── supabaseAdmin.ts   # Supabase client using service role key
│   │   ├── types.ts           # Shared TypeScript types
│   │   └── utils.ts           # Helpers (cn, formatDate, initials)
│   ├── .env                   # Frontend env (NEXT_PUBLIC_SUPABASE_*, SUPABASE_SERVICE_ROLE_KEY)
│   ├── next.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
├── backend/                   # Python FastAPI application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI entrypoint (registers routers)
│   │   ├── routers/           # API route modules
│   │   │   └── pools.py       # POST /api/v1/pools/gemini-store
│   │   ├── candidate/         # Candidate-scoped package (mirrors frontend (candidate)/)
│   │   │   ├── router.py      # GET /api/v1/candidate/health, GET /offer/demo
│   │   │   └── test_router.py # Hermetic TestClient tests (no DB/env required)
│   │   ├── models/            # Pydantic / SQLAlchemy models (empty)
│   │   └── services/          # Business logic & AI services
│   │       └── gemini_store_service.py  # Gemini File Search store CRUD
│   ├── temp_gemini_store/     # Gemini file search test script
│   │   └── test_store.py      # Standalone test (uses root .env)
│   ├── .env.example           # Backend env template
│   └── requirements.txt       # Python dependencies
├── PROJECT_MAP.md             # This file
├── README.md
└── .gitignore
```

## Overview

xQuesty "Link" is an AI-powered recruitment platform feature that enables recruiters to generate personalized interview links tied to specific job offers. Candidates upload their CV and take a text-based AI interview; recruiters receive pre-qualified candidates ranked by intelligent matching.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **ReactJS** | Dynamic user interface, reusable components, mature ecosystem |

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
│     └─> POST /api/job-pools (via Next.js BFF)                   │
│         ├─> Supabase PostgreSQL: pool record created            │
│         └─> POST /api/v1/pools/gemini-store (FastAPI backend)   │
│             └─> Gemini File Search store created & linked       │
│                 (naming: pool-{title}-{recruiter_id_prefix})    │
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
│     └─> Resume generated by OpenAI API                          │
│     └─> Embedding object stored in pool's vector store          │
│         └─> Indexed for future matching                         │
│                                                                 │
│  9. CONFIRMATION                                                │
│     └─> Message: "Your profile is now visible to the recruiter" │
│         └─> Transparent, reassuring candidate experience        │
└─────────────────────────────────────────────────────────────────┘
```

> **Status — `/apply/[token]` page (June 2026):** fully dynamic, fetching job pool details directly from Supabase. It uses the Jobzyn-style layout, showing recruiter company name, dynamically rendered job sections (missions, required profile, benefits), and handles candidate CV upload and authentication using Supabase. The shareable tokenized URL allows public candidate access.

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

## Database Schema (Simplified)

| Entity | Key Fields | Description |
|---|---|---|
| **Recruiter (hr_profiles)** | id, full_name, email, company_name, phone | Recruiter profiles mapping to Auth users |
| **Pool / Offer (job_pools)** | id, hr_id (FK), title, description, must_have_skills, nice_to_have_skills, soft_skills, deal_breakers, responsibilities, notes, public_token, status, years_experience, seniority_level, languages, created_at | Job pools/offers with unique tokenized links |
| **Candidate / Application** | id, candidate_id, pool_id, matching_score, status, created_at | Candidate application records mapping candidates to pools |
| **Embedding** | id, candidate_id, pool_id, embedding_vector, ai_summary | Vector storage for intelligent CV matching |
| **Q&A** | id, application_id, question, answer, created_at | Chat transcript per candidate application |

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
