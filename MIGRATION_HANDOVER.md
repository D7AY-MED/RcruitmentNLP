# PooLink — Next.js to FastAPI + Vite Migration Handover Document

This document serves as a developer guide for understanding, modifying, and troubleshooting the newly migrated decoupled architecture of the **PooLink** recruitment platform.

---

## 1. Architectural Overview

The application has been migrated from a single-repo Next.js App Router setup with backend route handlers (BFF) to a **decoupled client-server architecture**:

*   **Frontend**: Client-side React SPA built with **Vite** (`frontend/`).
*   **Backend**: Async Python API built with **FastAPI** (`backend/`).
*   **Database & Auth Provider**: Managed **Supabase** (PostgreSQL database & Supabase Auth).

### Before vs. After Flow

```
[Old Next.js BFF Flow]
Browser (Frontend) ──> Next.js BFF (Node API Routes) ──> Supabase/Gemini/OpenAI
                          └─ (Exposed Service Role Key)

[New Decoupled Flow]
Browser (Frontend) ──> FastAPI Backend (Python API) ──> Supabase/Gemini/OpenAI
                          ├─ (Secure Server-Only Keys)
                          └─ (Delegated Auth Validation)
```

---

## 2. Core Directory Map

### Frontend (`frontend/`)
*   `src/App.tsx`: Central `<BrowserRouter>` containing client-side routes (migrated from Next.js folder-based routing).
*   `src/lib/`:
    *   [recruiterAuth.ts](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/frontend/src/lib/recruiterAuth.ts): Handles recruiter logins/registrations via FastAPI backend. Stores JWTs in localStorage.
    *   [candidateAuth.ts](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/frontend/src/lib/candidateAuth.ts): Handles candidate auth via FastAPI backend.
    *   [adminAuth.ts](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/frontend/src/lib/adminAuth.ts): Handles admin auth via FastAPI backend.
    *   [jobPoolService.ts](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/frontend/src/lib/jobPoolService.ts): Connects to FastAPI endpoint `/api/v1/job-pools` for recruiter dashboard CRUD actions.
*   `vite.config.ts`: Vite build configuration. Loads environment variables from the project root directory (`envDir: '../'`).

### Backend (`backend/`)
*   `app/main.py`: Registers routers and configures CORS middleware.
*   `app/routers/`:
    *   [recruiter_supabase.py](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/backend/app/routers/recruiter_supabase.py): Recruiter registration, login, and `/me` validation.
    *   [pools.py](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/backend/app/routers/pools.py): Handles job pool CRUD endpoints (`/api/v1/job-pools`) and Gemini vector stores.
*   `app/admin/router.py`: Handles administrator capabilities, provisioning candidate/recruiter profiles, and dashboard statistics.
*   `app/candidate/router.py`: Health checks and candidate demo offer views.
*   `app/interview/router.py`: Adapts candidate technical interviews and stream sequences over SSE.
*   `app/schemas.py`: Unified Pydantic model schemas for validation.

---

## 3. Environment Variables Configuration

Both frontend and backend load configurations from the single, shared [.env](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/.env) file located in the repository root directory.

| Variable Name | Loader | Purpose / Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Frontend (Vite) | Backend base URL (default: `http://localhost:8000`) |
| `VITE_SUPABASE_URL` | Frontend (Vite) | Supabase project API endpoint |
| `VITE_TOTAL_QUESTIONS` | Frontend (Vite) | Limits adaptive text questions length in dev/prod |
| `DATABASE_URL` | Backend (FastAPI) | Direct PostgreSQL connection string |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (FastAPI) | Private service key to bypass database Row Level Security |
| `SUPABASE_JWT_SECRET` | Backend (FastAPI) | Signing secret of the Supabase project |
| `GOOGLE_API_KEY` | Backend (FastAPI) | API key for Gemini File Search embedding |
| `OPENAI_API_KEY` | Backend (FastAPI) | API key for GPT question extraction/evaluations |

---

## 4. Key Fixes Made During Validation

If a developer runs into issues, they should check these design decisions made during the validation phase:

### A. Asymmetric JWT Token Verification (`ES256`)
*   **Problem**: Supabase signs recruiter access tokens using asymmetric cryptography (`ES256`). Passing these tokens to Python's local signature decoder with `HS256` and a symmetric key resulted in signature errors (`JWSError: The specified alg value is not allowed`).
*   **Fix**: Modified the auth middlewares (`get_current_recruiter` and `get_current_admin`) to delegate JWT verification to the Supabase Auth server (`/auth/v1/user`) using `httpx`. If Supabase returns 200, the token is verified.

### B. Robust Datetime String Parser
*   **Problem**: Depending on the client library version, `user.created_at` can be returned as either a string or a Python `datetime` object. Hardcoded string string replacements (`created_at.replace("Z", "+00:00")`) threw `TypeError: 'str' object cannot be interpreted as an integer`.
*   **Fix**: Implemented a helper function `_parse_datetime(val)` inside the routers that safely type-checks and handles strings, datetimes, and null fallbacks.

### C. Backend vs. Database Property Mismatch
*   **Problem**: Database columns use `must_have_skills` and `languages` (plural), but the backend schemas were defined with `required_skills` and `language` (singular). This resulted in SQL database insertions violating `NOT NULL` constraints.
*   **Fix**: Updated the `JobPoolCreate`, `JobPoolUpdate`, and `JobPoolOut` schemas in [schemas.py](file:///c:/Users/GG/Desktop/link%20project/pooLink/matching%20project/backend/app/schemas.py) to match DB column names exactly.

---

## 5. Development & Troubleshooting Guide

### Running Locally

1.  **Backend Dev Server**:
    ```powershell
    cd backend
    .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
    ```
2.  **Frontend Dev Server**:
    ```powershell
    cd frontend
    npm run dev
    ```

### Common Issues & Troubleshooting

*   **Error: `winerror 10048 (Only one usage of each socket address is normally permitted)`**
    *   *Cause*: Port 8000 is occupied by a background uvicorn server that was not terminated properly.
    *   *Solution*: Run `Stop-Process -Name python -Force` in PowerShell (or kill python.exe in Task Manager), then run the startup command again.

*   **Failed to Fetch / CORS Errors**
    *   *Cause*: The frontend is requesting the wrong backend URL or uvicorn is down.
    *   *Solution*: Confirm that `VITE_API_URL=http://localhost:8000` is active in the root `.env` and that Vite is restarted after any `.env` edits. Check backend logs to confirm FastAPI is receiving requests.

*   **Tests Execution**
    *   Run hermetic backend tests (requires virtual env python):
        ```bash
        cd backend
        .venv\Scripts\python.exe -m app.candidate.test_router
        .venv\Scripts\python.exe -m app.admin.test_router
        ```
