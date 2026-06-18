# xQuesty "Link" — Project Map

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

### Cloud & DevOps
| Technology | Purpose |
|---|---|
| **Azure App Service** | PaaS hosting for FastAPI backend with auto-scaling |
| **Docker** | Containerized deployment, consistent dev/prod environments |
| **Azure CI/CD** | Continuous integration and deployment pipeline |

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
│     └─> POST /api/pools                                         │
│         └─> Supabase PostgreSQL: pool record created            │
│                                                                 │
│  4. FILL JOB DESCRIPTION                                        │
│     └─> Form: title, seniority, languages, skills, etc.         │
│         └─> Saved to DB for audit trail                         │
│                                                                 │
│  5. GENERATE EMBEDDING STORE                                    │
│     └─> New vector space created for this pool                  │
│         └─> Isolates candidate data per job offer              │
│                                                                 │
│  6. GENERATE UNIQUE LINK                                        │
│     └─> GET /api/pools/{id}/link                                │
│         └─> Returns shareable URL (social, email, job boards)   │
│                                                                 │
│  7. RECEIVE CANDIDATES                                          │
│     └─> Dashboard shows finished candidates                     │
│         └─> Contacts, CV, AI summary, matching score            │
│                                                                 │
│  8. VIEW RANKED CANDIDATES                                      │
│     └─> Auto-ranked by relevance score (embedding-based)        │
│                                                                 │
│  9. INTELLIGENT SEARCH (2 layers)                               │
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
│         └─> Secure URL generated                                  │
│                                                                 │
│  4. CV ANALYSIS                                                 │
│     └─> CV sent to OpenAI API with job_description              │
│         └─> Skills, experience, education extracted             │
│                                                                 │
│  5. FIRST AI QUESTION                                           │
│     └─> Generated dynamically based on CV + job offer           │
│         └─> Fully personalized interview start                  │
│                                                                 │
│  6. FULL INTERVIEW                                                │
│     └─> Technical skills, soft skills, motivation, mobility...  │
│         └─> AI-driven conversational flow                       │
│                                                                 │
│  7. REAL-TIME SAVE                                                │
│     └─> Each Q&A saved to Supabase PostgreSQL                   │
│         └─> Full audit trail                                    │
│                                                                 │
│  8. AI SUMMARY & EMBEDDING                                      │
│     └─> Resume generated by OpenAI API                          │
│     └─> Embedding object stored in pool's vector store          │
│         └─> Indexed for future matching                           │
│                                                                 │
│  9. CONFIRMATION                                                  │
│     └─> Message: "Your profile is now visible to the recruiter"   │
│         └─> Transparent, reassuring candidate experience        │
└─────────────────────────────────────────────────────────────────┘
```

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
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
            ┌──────────────┐              ┌──────────────┐              ┌──────────────┐
            │ Gemini File  │              │  OpenAI API  │              │  Azure App   │
            │   Search     │              │  (Questions, │              │   Service    │
            │ (Embedding   │              │  Analysis,   │              │  (Dockerized) │
            │   Layer 1)   │              │  Summaries)  │              │              │
            └──────────────┘              └──────────────┘              └──────────────┘
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
| **User** | id, name, email, role, created_at | Candidates, recruiters, admins |
| **Pool / Offer** | id, recruiter_id, title, description, seniority, languages, skills, unique_link, created_at | Job offers with shareable link |
| **Application** | id, candidate_id, pool_id, matching_score, status, created_at | Candidate-to-pool link with score |
| **Embedding** | id, candidate_id, pool_id, embedding_vector, ai_summary | Vector storage for intelligent matching |
| **Q&A** | id, application_id, question, answer, created_at | Interview transcript per candidate |

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
