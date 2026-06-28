# Performance Audit — Admin Dashboard

A dedicated performance pass. No new features, no UI redesign, no schema changes.
This document records the audit (measurements, slow endpoints, root causes,
opportunities). The fixes and before/after results are in
[SPRINT_REPORT.md](./SPRINT_REPORT.md).

## How it was measured

- **Backend endpoint latency**: timed HTTP calls to each admin endpoint
  (`scratchpad/bench.py`, then a clean re-measure via `bench_clean.py`).
- **Removed per-request cost**: a direct timing of one GoTrue
  `GET /auth/v1/user` call — exactly what the old code did on *every* request.
- **Frontend navigation**: Playwright timing of sidebar navigations, first
  visit vs cached revisit (`nav_timing.py`).

> **Measurement note (important for reproducibility).** On Windows, `localhost`
> resolves to IPv6 `::1` first while the dev server binds IPv4, which adds a
> uniform ~2000 ms *connect* penalty to some HTTP clients (Python `urllib`). All
> clean server-latency numbers here use `http://127.0.0.1:8000` to avoid that
> client-side artifact. The original "feels slow" symptom is independent of this
> and is caused by the root cause below.

## Baseline (before) — the symptom

Measured end-to-end while the dashboard was in normal use. Latencies were not
just high but **wildly variable**, the signature of rate-limiting:

| Endpoint | avg ms | peak ms | payload |
|----------|-------:|--------:|--------:|
| `/me` (no data work!) | 3138 | 16432 | 0.1 KB |
| `/dashboard/stats` | 8275 | 12164 | 0.1 KB |
| `/dashboard/charts` | 7635 | 11863 | 0.7 KB |
| `/dashboard/activity` | 5486 | 9224 | 1.5 KB |
| **dashboard page (3 calls)** | **27545** | — | — |
| `/users` | 5134 | 8002 | 11.8 KB |
| `/companies` | 4393 | 5463 | 6.3 KB |
| `/jobs` | 3804 | — | 7.3 KB |
| `/applications` | 14526 | **41724** | 4.5 KB |
| `/reports/summary` | 16950 | 24411 | 3.0 KB |

The tell-tale sign: **`/me` does no data work** — it only verifies the token and
returns the admin's profile — yet it took 3+ seconds. The cost was pure auth
overhead.

## Root causes

### 1. Per-request network token verification (the dominant cause)

`app/auth.py::verify_token` verified the caller's JWT by calling Supabase GoTrue
over the network on **every request**:

```python
resp = httpx.get(f"{SUPABASE_URL}/auth/v1/user", headers={...})  # blocking, per request
```

- Measured cost of that single call: **~376 ms** (min 334 ms) even when healthy.
- It is a **synchronous** call inside an `async` dependency → it also blocks the
  event loop, serialising concurrent requests.
- The admin gate then did a **second** round trip (`admin_profiles` query) per
  request.
- A single dashboard view fires 3 endpoints → 6+ GoTrue/DB round trips in a
  burst; navigation multiplies this. The volume **tripped GoTrue's rate
  limiter**, which is why latencies ballooned to 8–42 s and varied so much.

### 2. Redundant heavy data fetching

- `DashboardService.stats()`, `.charts()` and `.activity()` each independently
  re-fetched overlapping full tables (candidates, recruiters, pools) and each
  called `ApplicationService.list_applications()` — which scans **all**
  `interview_sessions` + candidates + pools — just to compute counts.
- `ReportService.summary()` recomputed the same application + company aggregates
  again.
- Net effect: the same expensive scans ran several times per dashboard load.

### 3. Expensive GoTrue sweep on every Users load

`UserService.list_users` called `AuthRepository.disabled_map()` on every request,
which **pages through every Supabase Auth user** to know who is banned — another
network-heavy operation repeated on each list/search keystroke.

### 4. A new Supabase client per repository

`BaseRepository.__init__` created a fresh client (with its own httpx pool) for
every repository instance. A single service builds several repositories → several
clients per request.

### 5. Over-fetching and no pagination

- List endpoints used `select("*")`, pulling columns the table view never shows
  (e.g. the Users list dragged ~11.8 KB including profile-picture URLs, salary,
  etc.).
- No server-side pagination: the whole result set was always returned.

### 6. Frontend: refetch-on-every-navigation, spinners, no memoization

- Every page used `useAsync`, which refetched on each mount → revisiting a page
  always showed a spinner and hit the network again.
- Loading used a centred "Loading…" spinner rather than skeletons.
- Table columns and action handlers were re-created every render.
- All page components were eagerly imported into the admin bundle.

## Optimization opportunities (→ implemented)

| # | Opportunity | Fix |
|---|-------------|-----|
| 1 | Kill per-request GoTrue call | **Local JWKS (ES256) verification**, cached; network fallback retained |
| 2 | Stop re-verifying the admin row | Cache `admin_profiles` lookup (60 s TTL) |
| 3 | Stop re-scanning tables 3× per dashboard | TTL-cache aggregates (stats/charts/activity 15 s, applications 15 s, reports 20 s) |
| 4 | Stop the GoTrue ban sweep per Users load | Cache `disabled_map` (30 s, invalidated on ban/unban) |
| 5 | Stop creating clients per repo | One shared service-role client |
| 6 | Stop over-fetching | `list_basic` column projection for the Users list |
| 7 | Bound payloads / rendering | Server-side pagination on Users; client-side pagination on other tables |
| 8 | Instant navigation | Frontend SWR cache + request de-dupe |
| 9 | No "Loading…" | Skeleton table + chart skeletons |
| 10 | Fewer re-renders | `useMemo` columns/handlers |
| 11 | Smaller initial bundle | Lazy-loaded routes |

See **[SPRINT_REPORT.md](./SPRINT_REPORT.md)** for the before/after benchmarks
and improvement percentages.
