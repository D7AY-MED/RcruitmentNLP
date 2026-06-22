# AI Interview Engine — PooLink

## Overview

The AI Interview Engine is an AI-powered asynchronous interview system integrated into PooLink. Candidates who click "Postuler" on a job offer are authenticated, then redirected to `/apply/interview/{public-token}` where they upload their CV and complete a **15-question adaptive AI interview**. Each Q&A pair is saved to Supabase PostgreSQL for recruiter review. Sessions are persisted — candidates can leave mid-interview and resume, or return to see a completion screen if already finished.

---

## User Story (Candidate Flow)

```
1. CLICK "POSTULER" on job offer page
        │
        ▼
2. AUTH REQUIRED MODAL (signup or login)
        │  └─ Supabase Auth via Next.js API routes
        │  └─ JWT stored in localStorage as "candidate_token"
        │
        ▼
3. REDIRECT to /apply/interview/{public-token}
        │
        ▼
4. AUTH GUARD (getCurrentCandidate) + POOL FETCH (getPublicJobPool)
        │  └─ If not authenticated → redirect to "/"
        │  └─ If invalid token → show "Offre introuvable"
        │
        ▼
5. SESSION CHECK (loading → idle/active/completed)
        │  └─ GET /api/v1/interview/session?pool_id=xxx
        │  ├─ None → show CV upload form (idle)
        │  ├─ Active → restore last unanswered question (active)
        │  └─ Completed → show completion screen (completed)
        │
        ▼
6. CV UPLOAD PAGE (idle state, first visit only)
        │  └─ Drag-and-drop file (PDF/TXT) or paste text
        │  └─ "Commencer l'entretien" button
        │
        ▼
7. FIRST AI QUESTION (active state)
        │  └─ FastAPI receives CV + poolId → builds system prompt
        │  └─ OpenAI Responses API → streaming tokens via SSE
        │  └─ Question rendered word-by-word in real time
        │  └─ Question X/15 counter displayed
        │
        ▼
8. ANSWER LOOP (active state, questions 1-15)
        │  └─ Candidate types answer → clicks "Envoyer la réponse"
        │  └─ FastAPI: saves answer → calls OpenAI with previous_response_id
        │  └─ Next question streams via SSE (deltas buffered, no [INTERVIEW_COMPLETE] shown)
        │  └─ Loop continues until question 15
        │
        ▼
9. COMPLETION (completed state)
        │  └─ OpenAI returns "[INTERVIEW_COMPLETE]"
        │  └─ All session rows marked session_status='completed'
        │  └─ "Félicitations — entretien terminé ! Votre profil est entre les mains du recruteur"
        │
        ▼
10. SESSION PERSISTENCE (on revisit)
        │  └─ GET /session → status "completed" → completion screen
        │  └─ GET /session → status "active" → resume from last unanswered question
        │
        ▼
   Recruiter can review answers in dashboard
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          BROWSER (Next.js)                              │
│                                                                          │
│  /apply/[token]              /apply/interview/[token]                    │
│  ┌─────────────────┐        ┌──────────────────────────────┐             │
│  │ JobOfferPage     │        │ InterviewTokenPage           │             │
│  │ ┌─────────────┐  │  auth  │ ┌─────────────────────────┐  │             │
│  │ │AuthRequired │──┼────────┼▶│ InterviewView           │  │             │
│  │ │Modal        │  │        │ │ ┌─────────────────────┐ │  │             │
│  │ └─────────────┘  │        │ │ │ SetupForm (idle)    │ │  │             │
│  └─────────────────┘        │ │ ├─────────────────────┤ │  │             │
│                              │ │ │ QASession (active)  │ │  │             │
│                              │ │ ├─────────────────────┤ │  │             │
│                              │ │ │ CompletedScreen     │ │  │             │
│                              │ │ └─────────────────────┘ │  │             │
│                              │ └─────────────────────────┘  │             │
│                              └──────────────────────────────┘             │
│                                       │                                  │
│                          localStorage: "candidate_token"                  │
│                                       │                                  │
└───────────────────────────────────────┼──────────────────────────────────┘
                                        │ Authorization: Bearer <jwt>
                                        ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND (Python)                            │
│                                                                          │
│  ┌──────────────────────────────────────────────┐                        │
│  │  app/interview/                               │                       │
│  │                                              │                       │
│  │  GET  /api/v1/interview/session (status)     │                       │
│  │  POST /api/v1/interview/start                │                       │
│  │  POST /api/v1/interview/next                 │                       │
│  │                                              │                       │
│  │  ┌──────────┐  ┌────────────┐  ┌──────────┐ │                       │
│  │  │auth.py   │  │cv_parser   │  │prompt.py │ │                       │
│  │  │(JWT      │  │.py         │  │(template │ │                       │
│  │  │ verify)  │  │(pypdf)     │  │ builder) │ │                       │
│  │  └──────────┘  └────────────┘  └──────────┘ │                       │
│  │                                              │                       │
│  │  ┌────────────────┐  ┌────────────────────┐  │                       │
│  │  │openai_client.py│  │session_store.py    │  │                       │
│  │  │(Responses API) │  │(Supabase CRUD)     │  │                       │
│  │  └────────────────┘  └────────────────────┘  │                       │
│  └──────────────────────────────────────────────┘                        │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
  ┌──────────────┐      ┌──────────────┐       ┌──────────────┐
  │   OpenAI     │      │  Supabase    │       │  Supabase    │
  │  Responses   │      │  PostgreSQL  │       │    Auth      │
  │    API       │      │              │       │   (JWT)      │
  │ (gpt-4.1-    │      │ interview_   │       │              │
  │  mini)       │      │ sessions     │       │              │
  └──────────────┘      └──────────────┘       └──────────────┘
```

---

## OpenAI Responses API (Key Design Decision)

Unlike the traditional `/chat/completions` endpoint (which requires sending full conversation history each turn), this system uses the **OpenAI Responses API** with `previous_response_id` chaining.

### How it works

```
TURN 1 (Start):
  POST /v1/responses
  {
    model: "gpt-4.1-mini",
    store: true,                          ← OpenAI persists conversation
    input: [
      { role: "system", content: SYSTEM_PROMPT + CV },
      { role: "user", content: "Start the interview..." }
    ]
  }
  → Returns: { id: "resp_abc123", output_text: "First question?" }

TURN 2 (Continue):
  POST /v1/responses
  {
    model: "gpt-4.1-mini",
    store: true,
    previous_response_id: "resp_abc123",  ← Chains to previous turn
    input: "Candidate's answer here"      ← Only the new answer
  }
  → Returns: { id: "resp_def456", output_text: "Next question?" }

TURN 3 (Continue):
  POST /v1/responses
  {
    model: "gpt-4.1-mini",
    store: true,
    previous_response_id: "resp_def456",
    input: "Another answer"
  }
  → Returns: { id: "resp_ghi789", output_text: "[INTERVIEW_COMPLETE]" }
```

### Benefits

- **~60% fewer tokens** — no need to resend conversation history
- **Faster response times** — less data over the wire
- **No manual state management** — OpenAI stores the conversation
- **`store: true`** enables conversation retrieval via `responses.retrieve()`

---

## API Endpoints

### `GET /api/v1/interview/session?pool_id=xxx`

**Auth:** `Authorization: Bearer <supabase_jwt>`

Checks if a candidate has an existing interview session for a given job pool. Called on page mount to determine whether to show the CV upload form (new session), resume the interview, or display the completion screen.

**Response** (JSON):
```json
// No session found:
{ "status": "none" }

// Active session (resumable):
{ "status": "active", "sessionId": "uuid", "responseId": "resp_xxx", "question": "Last question text", "sequence": 5 }

// Already completed:
{ "status": "completed" }

// Error or missing pool_id:
{ "status": "none" }
```

### `POST /api/v1/interview/start`

**Auth:** `Authorization: Bearer <supabase_jwt>`

**Request** (multipart/form-data):
| Field | Type | Required | Description |
|---|---|---|---|
| `cvText` | string | No* | Paste CV text |
| `cvFile` | file | No* | Upload CV (PDF/TXT, max 5MB) |
| `phone` | string | No | Candidate phone number |
| `poolId` | string | No | Job pool UUID (for session persistence) |

*\*Either cvText or cvFile must be provided.*

**Response** (SSE — `text/event-stream`):

```
event: meta
data: {"sessionId": "uuid", "status": "active"}

event: delta
data: {"delta": "Bonjour, je vois dans votre CV..."}

event: delta
data: {"delta": " que vous avez travaillé sur..."}

event: done
data: {"sessionId": "uuid", "responseId": "resp_xxx", "question": "Full question text", "status": "active"}

event: error (on failure)
data: {"error": "AI service error."}
```

### `POST /api/v1/interview/next`

**Auth:** `Authorization: Bearer <supabase_jwt>`

**Request** (application/json):
```json
{
  "sessionId": "uuid-from-start",
  "previousResponseId": "resp_xxx-from-previous-done",
  "answer": "Candidate's typed answer"
}
```

**Response** (SSE — `text/event-stream`):

For questions 1-14 (next question):
```
event: delta
data: {"delta": "Merci pour votre réponse..."}

event: delta
data: {"delta": " next token..."}

event: done
data: {"completed": false, "responseId": "resp_yyy", "question": "Next question text", "status": "active"}
```

For question 15 completion:
```
event: done
data: {"completed": true, "responseId": "resp_zzz", "sessionId": "uuid", "status": "completed"}
```
*Note: No `delta` events are emitted on completion — the backend buffers the OpenAI response and detects `[INTERVIEW_COMPLETE]` before yielding any SSE, so the candidate never sees the raw completion token.*

---

## Database Schema: `interview_sessions`

```sql
create table public.interview_sessions (
  id serial not null,
  candidate_id character varying not null,      -- from Supabase Auth JWT (sub claim)
  name character varying not null,               -- candidate full name
  question text not null,                        -- the AI-generated question
  answer text null,                              -- candidate's answer (null before answered)
  sequence integer not null,                     -- question number (1-15)
  timestamp timestamp without time zone null default now(),
  session_status character varying null default 'active',  -- 'active' | 'completed'
  phone text null,                               -- candidate phone
  openai_session_id text null,                   -- OpenAI response_id for chaining
  session_id uuid null,                          -- groups all 15 questions of one interview
  pool_id text null,                             -- job_pools.id for session-per-pool lookup

  constraint interview_sessions_pkey primary key (id)
);

create index if not exists idx_interview_sessions_openai_session_id
  on public.interview_sessions using btree (openai_session_id);

create index if not exists idx_user_sequence
  on public.interview_sessions using btree (candidate_id, sequence);

create index if not exists idx_interview_sessions_user_session_seq
  on public.interview_sessions using btree (candidate_id, session_id, sequence desc);

create index if not exists idx_interview_sessions_candidate_pool
  on public.interview_sessions using btree (candidate_id, pool_id);
```

### Row Lifecycle

| Sequence | Event | Row Action |
|---|---|---|
| 1 | First question generated | `INSERT` with question=Q1, answer=null |
| 1→2 | Candidate answers Q1 | `UPDATE` row 1: set answer |
| 2 | Next question generated | `INSERT` with question=Q2, answer=null |
| ... | (repeat) | ... |
| 15 | Last question answered | `UPDATE` row 15: set answer; then `UPDATE` all session rows: session_status='completed' |

---

## System Prompt Structure

The prompt (`backend/app/interview/interview_prompt.txt`) consists of:

1. **Role definition** — "expert interviewer"
2. **CV injection** — `{{CV_CONTENT}}` placeholder replaced at runtime
3. **15-question block structure** — strict order:
   - Q1: Opener (frame current position and goals)
   - Q2–4: Technical Depth (probe 1-2 CV items)
   - Q5: Languages (profile + proficiency)
   - Q6–8: Work Style (behavioral, soft skills)
   - Q9–11: Career Direction (target role, industry, environment)
   - Q12–14: Logistics (availability, location, compensation, contract)
   - Q15: Close ("Is there anything important...?")
4. **Job context** — `{{JOB_CONTENT}}` placeholder
5. **Hard rules** — personalized questions, single question at a time, concise, `[INTERVIEW_COMPLETE]` token

---

## File Structure

### Backend (`backend/app/interview/`)

```
backend/app/interview/
├── __init__.py                    # Package init
├── router.py                      # FastAPI routes: GET /session, POST /start (SSE), POST /next (SSE)
├── openai_client.py               # AsyncOpenAI Responses API (streaming + non-streaming)
├── prompt.py                      # Builds system prompt from template + CV + job
├── cv_parser.py                   # PDF text extraction via pypdf, plain text fallback
├── session_store.py               # Supabase REST API CRUD for interview_sessions (supabase-py/HTTPS fallback)
├── auth.py                        # Supabase JWT verification (python-jose, HS256)
└── interview_prompt.txt           # System prompt template with {{CV_CONTENT}}

backend/migrations/
└── 002_add_pool_id.sql            # ALTER TABLE + index for pool_id column
```

### Frontend (`frontend/interview/`)

```
frontend/interview/
├── components/
│   ├── InterviewView.tsx          # Main orchestrator (loading → idle/active/completed states + session check)
│   ├── SetupForm.tsx              # CV upload (drag-drop file or paste text) + Start button
│   ├── QASession.tsx              # Streaming question, answer input, progress counter
│   └── CompletedScreen.tsx        # "Félicitations — entretien terminé !" screen
└── lib/
    ├── api.ts                     # SSE consumer + getSessionStatus() for start/continue/status APIs
    └── types.ts                   # TypeScript interfaces (includes SessionStatus type)
```

### Page Route

```
frontend/app/(candidate)/apply/interview/[token]/page.tsx
  └─ Auth guard (getCurrentCandidate)
  └─ Pool fetch (getPublicJobPool / mock fallback)
  └─ Renders <InterviewView jobTitle={...} companyName={...} poolId={pool.id} />
```

---

## Candidate Auth Flow

```
Auth Flow:

  Browser                    Next.js API                Supabase Auth
    │                           │                          │
    │  POST /api/candidate/     │                          │
    │  register {email,pass..}  │                          │
    │ ─────────────────────────▶│                          │
    │                           │  admin.createUser()      │
    │                           │ ────────────────────────▶│
    │                           │  signInWithPassword()    │
    │                           │ ────────────────────────▶│
    │                           │  ← access_token (JWT) ──│
    │  ← {access_token,        │                          │
    │     candidate}            │                          │
    │◀──────────────────────────│                          │
    │                           │                          │
    │ localStorage.setItem(     │                          │
    │   "candidate_token", jwt) │                          │
    │                           │                          │
    │ redirect to               │                          │
    │ /apply/interview/{token}  │                          │
```

---

## SSE Protocol Specification

All streaming endpoints use Server-Sent Events (`text/event-stream`).

| Event | Direction | Payload | Description |
|---|---|---|---|
| `meta` | server → client | `{sessionId, status}` | Session created, ID provided |
| `delta` | server → client | `{delta: "partial text..."}` | Word-by-word streaming token |
| `done` | server → client | `{responseId, question?, completed?, sessionId, status}` | Question complete (or interview complete if `completed: true`) |
| `error` | server → client | `{error: "message"}` | Error occurred, abort |

```
Client → Server: GET /session?pool_id=xxx (JSON response)
Server → Client: { status: "none" | "active" | "completed" }

Client → Server: POST /start (FormData)
Server → Client: event: meta  →  event: delta*  →  event: done

Client → Server: POST /next (JSON)
Server → Client: event: delta*  →  event: done (completed: false)
  — or — (on Q15 completion, no deltas emitted)
Server → Client: event: done (completed: true)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET_KEY` | Secret for recruiter JWT signing |
| `SUPABASE_JWT_SECRET` | Supabase project JWT secret (for verifying candidate tokens) |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_INTERVIEW_MODEL` | Model name (default: `gpt-4.1-mini`) |
| `FRONTEND_ORIGINS` | CORS allowed origins (default: `http://localhost:3000`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL (default: `http://localhost:8000`) |

---

## Sequence Diagram: Full Interview

```
Candidate          Browser/Next.js            FastAPI                  OpenAI            Supabase
   │                    │                        │                       │                  │
   │  Click "Postuler"  │                        │                       │                  │
   │───────────────────▶│                        │                       │                  │
   │                    │  AuthRequiredModal      │                       │                  │
   │                    │◀─────────────────────── │                       │                  │
   │  Signup/Login      │                        │                       │                  │
   │───────────────────▶│  POST /api/candidate/*  │                       │                  │
   │                    │──────────────────────────────────────────────────────────────────▶│
   │                    │◀──────────────────────────────────────────────────────────────────│
   │                    │  JWT stored            │                       │                  │
   │                    │  Redirect              │                       │                  │
   │  /apply/interview/ │───────────────────────▶│                       │                  │
   │         {token}    │                        │                       │                  │
   │                    │  Check auth + fetch    │                       │                  │
   │                    │──────────────────────────────────────────────────────────────────▶│
   │                    │◀──────────────────────────────────────────────────────────────────│
   │                    │                        │                       │                  │
   │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
   │  │  SESSION CHECK (on mount)                                                      │  │
   │  └─────────────────────────────────────────────────────────────────────────────────┘  │
   │                    │                        │                       │                  │
   │                    │  GET /interview/session │                       │                  │
   │                    │  ?pool_id=xxx           │                       │                  │
   │                    │───────────────────────▶│                       │                  │
   │                    │                        │  SELECT candidate_id  │                  │
   │                    │                        │  + pool_id            │                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │◀────────────────────────────────────────│
   │                    │  {status: "none"}      │                       │                  │
   │                    │◀───────────────────────│                       │                  │
   │                    │  (or "active"/         │                       │                  │
   │                    │   "completed")         │                       │                  │
   │                    │                        │                       │                  │
   │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
   │  │  INTERVIEW START (first visit only)                                              │  │
   │  └─────────────────────────────────────────────────────────────────────────────────┘  │
   │                    │                        │                       │                  │
   │  Upload CV +      │                        │                       │                  │
   │  click Start      │                        │                       │                  │
   │───────────────────▶│  POST /interview/start │                       │                  │
   │                    │  (FormData: cv+poolId)  │                       │                  │
   │                    │───────────────────────▶│                       │                  │
   │                    │                        │  Extract CV text      │                  │
   │                    │                        │  (pypdf / plain)      │                  │
   │                    │                        │  Build system prompt  │                  │
   │                    │                        │                       │                  │
   │                    │                        │  responses.create(    │                  │
   │                    │                        │    stream=True,       │                  │
   │                    │                        │    store=True,        │                  │
   │                    │                        │    input: prompt      │                  │
   │                    │                        │  )                    │                  │
   │                    │                        │──────────────────────▶│                  │
   │                    │                        │  ◀── streaming ──────│                  │
   │                    │                        │    tokens (delta)     │                  │
   │                    │                        │                       │                  │
   │                    │  SSE: meta + delta* +  │                       │                  │
   │                    │  done {responseId, Q1} │                       │                  │
   │                    │◀───────────────────────│                       │                  │
   │                    │                        │  INSERT Q1 (pool_id)  │                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │                       │                  │
   │  Question 1/15     │                        │                       │                  │
   │◀───────────────────│                        │                       │                  │
   │                    │                        │                       │                  │
   │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
   │  │  INTERVIEW LOOP (× up to 14 more)                                               │  │
   │  └─────────────────────────────────────────────────────────────────────────────────┘  │
   │                    │                        │                       │                  │
   │  Type answer A1    │                        │                       │                  │
   │───────────────────▶│  POST /interview/next   │                       │                  │
   │                    │  {sessionId,            │                       │                  │
   │                    │   previousResponseId,   │                       │                  │
   │                    │   answer: A1}           │                       │                  │
   │                    │───────────────────────▶│                       │                  │
   │                    │                        │  UPDATE Q1: set answer│                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │                       │                  │
   │                    │                        │  responses.create(    │                  │
   │                    │                        │    previous_response_ │                  │
   │                    │                        │    id=resp_Q1,        │                  │
   │                    │                        │    input: A1,         │                  │
   │                    │                        │    stream: true       │                  │
   │                    │                        │  )                    │                  │
   │                    │                        │──────────────────────▶│                  │
   │                    │                        │  ◀── streaming ──────│                  │
   │                    │                        │    tokens             │                  │
   │                    │                        │                       │                  │
   │                    │  SSE: delta* + done    │                       │                  │
   │                    │  {responseId, Q2}     │                       │                  │
   │                    │◀───────────────────────│                       │                  │
   │                    │                        │  INSERT Q2            │                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │                       │                  │
   │  (repeat...)       │                        │                       │                  │
   │                    │                        │                       │                  │
   │  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
   │  │  INTERVIEW COMPLETE                                                             │  │
   │  └─────────────────────────────────────────────────────────────────────────────────┘  │
   │                    │                        │                       │                  │
   │  Type answer A15   │                        │                       │                  │
   │───────────────────▶│  POST /interview/next   │                       │                  │
   │                    │───────────────────────▶│                       │                  │
   │                    │                        │  UPDATE Q15: set ans  │                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │  responses.create(    │                  │
   │                    │                        │    previous_response_ │                  │
   │                    │                        │    id=resp_Q15,       │                  │
   │                    │                        │    input: A15         │                  │
   │                    │                        │  )                    │                  │
   │                    │                        │──────────────────────▶│                  │
   │                    │                        │  ◀── "[INTERVIEW_    ─│                  │
   │                    │                        │        COMPLETE]"     │                  │
   │                    │                        │                       │                  │
   │                    │                        │  UPDATE all rows:     │                  │
   │                    │                        │  session_status=      │                  │
   │                    │                        │  'completed'          │                  │
   │                    │                        │────────────────────────────────────────▶│
   │                    │                        │                       │                  │
   │                    │  SSE: done             │                       │                  │
   │                    │  {completed: true}     │                       │                  │
   │                    │◀───────────────────────│                       │                  │
   │                    │                        │                       │                  │
   │  "Félicitations —  │                        │                       │                  │
   │   entretien terminé│                        │                       │                  │
   │   ! Votre profil   │                        │                       │                  │
   │   est entre les    │                        │                       │                  │
   │   mains du         │                        │                       │                  │
   │   recruteur"        │                        │                       │                  │
   │◀───────────────────│                        │                       │                  │
```

---

## Performance Characteristics

| Metric | Target | Detail |
|---|---|---|
| Time to first token | ~200-300ms | OpenAI streaming + SSE pipelining |
| Per-turn latency | ~1-2s | Full question generation + streaming |
| Token savings | ~60% | Responses API vs chat completions |
| PDF parse time | <100ms | pypdf for typical 1-2 page CVs |
| Max CV size | 5MB | Enforced in cv_parser.py |

---

## Error Handling

| Scenario | HTTP Status | SSE Event | Recovery |
|---|---|---|---|---|
| Missing cvText and cvFile | 400 | — (JSON) | Show error to candidate |
| Invalid/expired JWT | 401 | — (JSON) | Redirect to login |
| OpenAI service error | 200 | `event: error` | Show "AI service error" to candidate |
| Database error | 200 | `event: error` | Logged server-side; candidate sees retry button (question text preserved) |
| Session not found | 404 | — (JSON) | Show error to candidate |
| Interview already completed | 400 | — (JSON) | Show message to candidate |

---

## Future Improvements

- **CV storage in Supabase Storage** (S3) — currently CV text is sent inline, not persisted
- **Job context injection** — pass job description into prompt for more personalized questions
- **Recruiter report generation** — AI summary of candidate performance after completion
- **Application linking** — create a record in the applications table linking candidate to pool
