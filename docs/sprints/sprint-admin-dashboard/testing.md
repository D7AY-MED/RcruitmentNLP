# Testing & Verification

Three layers of assurance: backend unit tests, a live read-only service smoke
test, and an end-to-end UI verification with Playwright.

## 1. Backend unit tests — `backend/app/admin/tests/`

Fast, no live database (the Supabase client is stubbed in `conftest.py`). Run:

```bash
cd backend
python -m pytest app/admin/tests -q
```

**Result: 23 passed.**

| File | Covers |
|------|--------|
| `test_validators.py` | `validate_user_type` (rejects `admin`), `validate_dataset`, `validate_format`, `require_non_empty` |
| `test_application_service.py` | grouping interview rows into applications, progress counting, completed-status detection, status filtering, detail assembly |
| `test_company_and_report.py` | company aggregation by name, first-non-null company fields, search filter; CSV header/rows, bool/list cell rendering, valid XLSX (PK zip magic) |
| `test_routers.py` | router wiring via `TestClient` with an overridden admin dependency: `/health`, `/dashboard/stats`, `/users`, and a 400 on a bad export dataset |

**How services are tested without a DB:** each test builds the service, then
replaces its repository attributes with `SimpleNamespace` fakes returning canned
rows. This exercises the business rules in isolation — the essence of the MVC
split.

## 2. Live service smoke test (read-only)

Before building the frontend, every service was run against the **real** Supabase
data to validate the schema assumptions (table casing, joins, the
`Candidate_summaries` table, GoTrue ban reads). All passed, e.g.:

```
dashboard.stats = recruiters:19 candidates:34 pools:9 companies:13
                  applications:14 completed:7 summaries:1
users.list = 53   companies.list = 13   jobs.list = 9   applications.list = 14
reports.csv(users) -> bytes   reports.xlsx(candidates) -> bytes
```

## 3. End-to-end UI verification — Playwright

`verify_and_screenshot.py` drives the live app and asserts each page renders,
while capturing all console output.

**Checks (all functional areas pass):**

- Login → Dashboard ✔
- Users / Companies / Jobs / Applications / Reports / Settings pages render ✔
- User detail drawer opens and loads full profile ✔
- Mobile (390px) dashboard renders ✔
- Logout returns to the login screen ✔  (also confirmed via the API)

**Console health:** only **2** messages, both benign React-Router *future-flag*
warnings (`v7_startTransition`, `v7_relativeSplatPath`).
**Zero React duplicate-key warnings** — every list uses a stable `rowKey`
(e.g. `${type}:${id}` for the unified Users table).

> Note: when the verification script sweeps all pages in a few seconds it can hit
> Supabase Auth's per-request token-verification rate limit (every backend call
> re-verifies the JWT against GoTrue). That manifests as transient timeouts in
> the *script*, not as product bugs — under normal single-user interaction it
> does not occur, and a brief cooldown + client-side navigation makes the run
> clean. This is why `capture_screens.py` waits for rendered content and paces
> itself.

## 4. Screenshots

`capture_screens.py` produces the documentation screenshots in `screenshots/`,
waiting for charts/tables to actually render before each capture so no image
shows a loading state.
