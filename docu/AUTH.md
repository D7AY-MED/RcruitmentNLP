# Authentication — PooLink

## Overview

All three roles (recruiter, candidate, admin) use the same auth pattern:

```
Frontend ──POST──> FastAPI ──Supabase Auth──> Supabase
     <──JWT────      │
                     └── Verify: GET /auth/v1/user (delegated)
```

No self-signed JWTs, no bcrypt, no SQLAlchemy. Supabase Auth is the single source of truth.

---

## Backend (`backend/app/auth.py`)

Shared module providing:

| Export | Purpose |
|--------|---------|
| `get_supabase()` | Returns initialized Supabase admin client (service role key) |
| `verify_token()` | FastAPI dep — calls `GET /auth/v1/user` on Supabase to validate JWT, returns user UUID |
| `get_current_recruiter()` | FastAPI dep — verifies token, checks `hr_profiles` table |
| `get_current_candidate()` | FastAPI dep — verifies token, checks `candidate_profiles` table |
| `get_current_admin()` | FastAPI dep — verifies token, checks `admin_profiles` table |
| `parse_datetime()` | Safely converts string/datetime/None → datetime |

### RLS gotcha: profile query after sign-in

After `sign_in_with_password()`, the client's auth state switches from the service role key to the user's JWT. If the profile table has **Row Level Security (RLS)** enabled, the user-session client may be blocked from reading the profile row.

This affects **admin login** (`admin_profiles` has RLS) — the fix is to use a **fresh** `get_supabase()` call for the profile query after sign-in:

```python
session = client.auth.sign_in_with_password({...})
user_id = session.user.id

# Fresh client with service role key bypasses RLS
admin_client = get_supabase()
result = admin_client.table("admin_profiles").select("*").eq("id", user_id).limit(1).execute()
```

`candidate_profiles` also has RLS, but candidate/login is safe because `_fetch_profile()` internally calls `get_supabase()` which returns a fresh service-role client.  
`hr_profiles` (recruiter) has no RLS, so it works accidentally with the mutated client.

### Critical: `get_supabase()` must return a fresh client — no singleton

**The bug:** Previously `_supabase` was created once at module import time:

```python
_supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

The `register` endpoint then called `sign_in_with_password()` on this **shared singleton**. This **mutated** the client's internal auth state from the service role key to the user's session token. The next `admin.create_user()` call on the same client used the user's JWT instead of the service role key, causing Supabase to return `"User not allowed"` (403).

This explain why recruiter registration could work first, but candidate registration immediately after would fail — the recruiter's `sign_in_with_password()` corrupted the shared client.

**The fix:** `get_supabase()` now creates a **fresh client** each time:

```python
def get_supabase():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(...)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
```

Each request gets a clean client initialized with the service role key. The local `client` variable goes out of scope after the request, so auth state can never leak between requests.

### Why delegated verification?

Supabase signs tokens with ES256 (asymmetric). The backend uses `httpx` to call Supabase's `/auth/v1/user` endpoint with the Bearer token. If Supabase returns 200, the token is valid. This avoids key management and algorithm mismatch issues.

---

## Per-Role Flow

All roles follow the same 3-step pattern:

### Register
1. `POST /api/{role}/register` — creates user in Supabase Auth via `client.auth.admin.create_user()`
2. Inserts profile row in the role's table (`hr_profiles` / `candidate_profiles` / `admin_profiles`)
3. Calls `client.auth.sign_in_with_password()` to get a real Supabase session token
4. Returns `{ access_token, token_type, {role_profile} }`

### Login
1. `POST /api/{role}/login` — calls `client.auth.sign_in_with_password()`
2. Fetches profile from the role's table (auto-creates if missing as fallback)
3. Returns `{ access_token, token_type, {role_profile} }`

### Me
1. `GET /api/{role}/me` — `verify_token` dependency validates the Bearer token via Supabase
2. Fetches profile from the role's table
3. Returns profile object

### Endpoints

| Role | Register | Login | Me | Router file |
|------|----------|-------|----|-------------|
| Recruiter | `POST /api/v1/recruiter/register` | `POST /api/v1/recruiter/login` | `GET /api/v1/recruiter/me` | `backend/app/routers/recruiter_supabase.py` |
| Candidate | `POST /api/candidate/register` | `POST /api/candidate/login` | `GET /api/candidate/me` | `backend/app/candidate/router.py` |
| Admin | `POST /api/v1/admin/register` | `POST /api/v1/admin/login` | `GET /api/v1/admin/me` | `backend/app/admin/router.py` |

Admin registration additionally requires an `x-admin-setup-token` header matching `ADMIN_SETUP_TOKEN` env var.

---

## Frontend (`frontend/src/lib/auth.ts`)

Shared module providing:

| Export | Purpose |
|--------|---------|
| `getToken(key)` | Read token from localStorage |
| `setToken(key, token)` | Write token to localStorage |
| `removeToken(key)` | Delete token from localStorage |
| `authHeader(key)` | Returns `{ Authorization: 'Bearer <token>' }` or throws |
| `apiRequest(path, options)` | Thin `fetch` wrapper with error handling |

Each role file (`recruiterAuth.ts`, `candidateAuth.ts`, `adminAuth.ts`) re-exports role-specific functions using these shared helpers.

### Token storage

| Role | localStorage key |
|------|-----------------|
| Recruiter | `recruiter_token` |
| Candidate | `candidate_token` |
| Admin | `admin_token` |

---

## Interview Auth

The interview engine (`backend/app/interview/auth.py`) uses the same `verify_token()` dependency, then fetches user metadata (name, email) from Supabase Auth via `client.auth.admin.get_user_by_id()`.

---

## What was removed

- `backend/app/security.py` — legacy SQLAlchemy + bcrypt auth
- `backend/app/security_candidate.py` — self-signed JWT creation
- `backend/app/supabase_auth.py` — raw httpx calls to Supabase Auth REST API
- `backend/app/database.py` — SQLAlchemy engine and session factory
- `backend/app/models/` — SQLAlchemy ORM models
- `admin_profiles.password` column writes — bcrypt hash no longer stored
- `SUPABASE_JWT_SECRET` config — no longer needed (delegated verification)
- `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `JWT_EXPIRE_MINUTES` config — unused
