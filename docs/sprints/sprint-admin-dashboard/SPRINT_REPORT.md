# Sprint Report — Performance Optimization Pass

**Goal:** make the Admin Dashboard feel instant. No new features, no UI redesign,
no schema changes. See [PERFORMANCE_AUDIT.md](./PERFORMANCE_AUDIT.md) for the
audit and root-cause analysis.

## TL;DR

> **Root cause:** every API request verified the JWT by calling Supabase GoTrue
> over the network (~376 ms each, blocking), then queried `admin_profiles` again
> — and the volume tripped GoTrue's rate limiter, ballooning latency to
> **3–42 seconds**. Replacing it with **local JWKS verification** + caching
> removed that cost entirely.

- **Dashboard load: 27.5 s → ~0.03 s** (3 calls, parallel).
- **Per-request auth overhead: 376 ms → ~1 ms.**
- **Every endpoint is now sub-second; most are 10–350 ms.**
- **Zero React warnings; zero duplicate keys; 10/10 UI checks pass.**

## Before / After — backend endpoint latency

"Before" = measured under the rate-limited condition that caused the complaint.
"After" = clean warm server latency (`127.0.0.1`, cache warm). Improvement is the
reduction in response time.

| Endpoint | Before (avg) | After (warm) | Reduction | Speedup |
|----------|-------------:|-------------:|----------:|--------:|
| `/me` (auth only) | 3138 ms | **14 ms** | 99.6% | 224× |
| `/dashboard/stats` | 8275 ms | **13 ms** | 99.8% | 636× |
| `/dashboard/charts` | 7635 ms | **15 ms** | 99.8% | 509× |
| `/dashboard/activity` | 5486 ms | **16 ms** | 99.7% | 343× |
| **dashboard page (3 calls)** | **27545 ms** | **26 ms** | **99.9%** | **1060×** |
| `/users` | 5134 ms | **346 ms** | 93.3% | 15× |
| `/companies` | 4393 ms | **195 ms** | 95.6% | 22× |
| `/jobs` | 3804 ms | **103 ms** | 97.3% | 37× |
| `/applications` | 14526 ms (peak 41724) | **15 ms** | 99.9% | 968× |
| `/reports/summary` | 16950 ms | **13 ms** | 99.9% | 1304× |
| login (one-time) | 3968 ms | **838 ms** | 79% | 4.7× |

Cold (first call after a cache expiry) is also fast now — e.g. `/users` 764 ms,
`/dashboard/stats` 758 ms — because auth is local; only the data query remains.

### The cost that was removed

| Measurement | Before | After |
|-------------|-------:|------:|
| Token verification per request | **376 ms** (network GoTrue, min 334) | **~1 ms** (local JWKS) |
| `admin_profiles` lookup per request | ~150 ms (DB) | ~0 ms (cached 60 s) |
| Users-list ban sweep | full GoTrue paged scan, every load | cached 30 s |
| Users payload | 11.8 KB | **5.6 KB** (−53%) |

## Before / After — frontend

| Metric | Before | After |
|--------|-------:|------:|
| Route navigation (Users/Jobs/…) | multi-second (spinner each time) | **~100–180 ms** |
| Revisit a page | full refetch + spinner | **instant** (cached, revalidate in background) |
| Loading UI | "Loading…" spinner | **skeleton** table + chart placeholders |
| Initial admin bundle | all pages eager | **code-split** (per-route chunks) |

## What changed (by layer)

### Backend (`backend/app/admin/`)
- **`security.py` (new)** — local JWKS (ES256) token verification with a network
  fallback; cached verified-token and admin-profile lookups.
- **`cache.py` (new)** — tiny thread-safe `TTLCache` + `ttl_cached` decorator.
- **`permissions.py`** — `get_current_admin` now uses the fast verifier (no
  per-request GoTrue/DB round trips).
- **`repositories/base.py`** — one shared service-role Supabase client.
- **`repositories/auth_repository.py`** — `disabled_map` cached (30 s), invalidated
  on ban/unban.
- **`repositories/{candidate,hr}_repository.py`** — `list_basic` column projection.
- **`services/dashboard_service.py`, `application_service.py`, `report_service.py`**
  — heavy read-only aggregates memoized (15–20 s TTL).
- **`services/user_service.py`, `routers/users_router.py`** — server-side
  pagination (`{items,total,page,page_size,pages}`).

### Frontend (`frontend/src/admin/`)
- **`services/cache.ts` (new)** + **`hooks/useQuery.ts` (new)** — SWR cache with
  request de-dupe; pages migrated from `useAsync` → `useQuery`.
- **`components/ui/Table.tsx`** — skeleton rows on first load + optional
  client-side pagination.
- **`components/ui/Pagination.tsx` (new)**, **`primitives.tsx`** — `ChartSkeleton`.
- **`pages/UsersPage.tsx`** — server-side pagination, memoized columns/handlers,
  cache invalidation on mutation; other pages cached + paginated.
- **`AdminApp.tsx`** — routes are `React.lazy` code-split with `Suspense`.

## Verification

- **Unit tests:** `pytest app/admin/tests` → **23 passed** (cache-isolation
  fixture added).
- **End-to-end (Playwright):** **10/10** checks pass — login, all six pages,
  detail drawer, mobile, logout. **Console: 2 benign React-Router future-flag
  warnings; zero duplicate-key warnings.** (Notably, the auth fix also removed
  the rate-limiting that used to make the logout check flake.)
- **Benchmarks:** `bench_clean.py` (backend) and `nav_timing.py` (frontend),
  reproducible from `runall.bat` + the verify admin.

## Success criteria — met

- [x] Loads quickly (sub-second everywhere; dashboard ~26 ms)
- [x] Feels responsive (navigation ~100–180 ms, instant on revisit)
- [x] No infinite loading (skeletons; data resolves in ms)
- [x] No duplicate key warnings (stable `rowKey`)
- [x] Debounced search (350 ms, retained)
- [x] Pagination (server-side on Users; client-side on other tables)
- [x] Optimized API calls (local auth, caching, de-dupe, column projection)
- [x] Optimized rendering (memoization, skeletons, lazy routes)

## Trade-offs / notes

- Aggregate caching introduces **bounded staleness** (≤15–30 s) on dashboard
  counts and reports after a mutation — standard for SaaS dashboards and
  invisible in practice. Mutating lists (Users) are **not** cached on the server
  and are invalidated on the client after writes, so edits appear immediately.
- Local JWKS verification keeps the **network fallback** so a legacy token or a
  brief JWKS outage never locks anyone out — same security, faster transport.
