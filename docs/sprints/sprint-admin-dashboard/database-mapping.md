# Database Mapping

The admin module adapts to the **existing** schema. Nothing here was created,
altered or dropped. Columns below were introspected live from the Supabase
PostgREST OpenAPI definition (the source of truth), not from migration files
(which were out of date).

## The six tables

### `admin_profiles`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK → `auth.users.id` |
| `full_name` | text | |
| `email` | text | |
| `created_at` | timestamptz | |
| `password` | text | legacy/unused for auth (auth is via Supabase) — never returned to the client |

Used by: `AdminRepository`, `AuthService`, `SettingsService`, `permissions.get_current_admin`.

### `candidate_profiles`
| Column | Type | | Column | Type |
|--------|------|-|--------|------|
| `id` | uuid (PK) | | `city` | text |
| `full_name` | text | | `education_level` | text |
| `email` | text | | `university_name` | text |
| `phone` | text | | `field_of_study` | text |
| `created_at` | timestamptz | | `languages` | text[] |
| `title` | text | | `expected_salary_min` | numeric |
| `phone_number` | text | | `expected_salary_max` | numeric |
| `linkedin_url` | text | | `profile_picture_url` | text |
| `current_job_title` | text | | `open_to_work` | boolean |
| `current_company` | text | | `years_of_experience` | integer |

Used by: `CandidateRepository`; surfaced in Users (type=candidate) and the user detail drawer.

### `hr_profiles` (recruiters + company data)
| Column | Type | | Column | Type |
|--------|------|-|--------|------|
| `id` | uuid (PK) | | `company_industry` | text |
| `full_name` | text | | `company_size` | text |
| `email` | text | | `company_website` | text |
| `phone` | text | | `company_linkedin_url` | text |
| `created_at` | timestamptz | | `company_email` | text |
| `company_name` | text | | `company_phone` | text |
| `company_description` | text | | `company_address` | text |
| | | | `company_founded_year` | integer |

Used by: `HrRepository`; surfaced in Users (type=recruiter) and **derived into Companies**.

### `job_pools`
| Column | Type | | Column | Type |
|--------|------|-|--------|------|
| `id` | uuid (PK) | | `must_have_skills` | text[] |
| `hr_id` | uuid → hr_profiles.id | | `nice_to_have_skills` | text[] |
| `title` | text | | `soft_skills` | text[] |
| `description` | text | | `deal_breakers` | text[] |
| `public_token` | text | | `responsibilities` | text[] |
| `status` | boolean | | `languages` | text[] |
| `created_at` | timestamptz | | `years_experience` | smallint |
| `seniority_level` | text | | `education_level` | text |
| `main_mission` | text | | `contract_type` | text |
| `experience_range` | text | | `location` | text |
| `generated_jd` | text | | `archived` | boolean |
| `notes` | text | | `gemini_store_name` | varchar |

Used by: `JobPoolRepository`; surfaced in Jobs, Companies (job counts) and Applications (pool title).

### `interview_sessions`  (= applications)
| Column | Type | Notes |
|--------|------|-------|
| `id` | integer (PK) | one row **per question** |
| `candidate_id` | uuid → candidate_profiles.id | |
| `name` | varchar | candidate name snapshot |
| `question` | text | |
| `answer` | text | nullable until answered |
| `sequence` | integer | question order |
| `timestamp` | timestamp | |
| `session_status` | varchar | `active` / `completed` |
| `phone` | text | |
| `openai_session_id` | text | |
| `session_id` | uuid | groups rows into one application |
| `pool_id` | text | the job pool being applied to |

Used by: `InterviewRepository`; rows are grouped by `session_id` in
`ApplicationService` into one "application" with progress + status.

### `Candidate_summaries`  (note the capital C)
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `candidate_id` | uuid → candidate_profiles.id | |
| `Candidate_name` | text | mixed-case column, quoted exactly |
| `summary` | text | AI-generated interview summary |
| `last_updated` | timestamptz | |
| `phone` | text | |
| `score` | text | AI score |

Used by: `SummaryRepository`; shown in the Application detail drawer ("AI summary").

## Relationships used by the module

```
auth.users ──1:1── admin_profiles / candidate_profiles / hr_profiles   (id = auth user id)
hr_profiles ──1:N── job_pools                       (job_pools.hr_id → hr_profiles.id)
candidate_profiles ──1:N── interview_sessions       (interview_sessions.candidate_id)
candidate_profiles ──1:N── Candidate_summaries      (Candidate_summaries.candidate_id)
job_pools ◀┄┄ interview_sessions.pool_id            (text id, joined in app code)
hr_profiles.company_name  ──derives──▶  "Company"   (no companies table)
```

## Screen → table matrix

| Screen | reads | writes |
|--------|-------|--------|
| Dashboard | all six (counts/aggregates) | — |
| Users (list) | candidate_profiles, hr_profiles (+ GoTrue ban state) | — |
| Users (create) | — | candidate_profiles / hr_profiles + GoTrue user |
| Users (edit) | candidate_profiles / hr_profiles | same |
| Users (disable) | — | GoTrue ban (no table column) |
| Users (delete) | — | candidate_profiles / hr_profiles + GoTrue user |
| Companies | hr_profiles, job_pools | hr_profiles (company_* fan-out) |
| Jobs | job_pools (join hr_profiles) | job_pools |
| Applications | interview_sessions, candidate_profiles, job_pools, Candidate_summaries | — |
| Reports | all six | — (export only) |
| Settings → Admin Users | admin_profiles | admin_profiles + GoTrue user |
| Settings → Security | — | GoTrue password |
