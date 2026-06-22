# Xquesty Interview Engine (Backend MVP)

Backend-first AI interview engine replacing n8n orchestration.

## What This Includes

- Direct OpenAI integration from backend
- DB-backed structured interview state (no transcript replay per turn)
- Structured JSON question generation with validation
- Supported question types:
  - `single_choice`
  - `multi_choice`
  - `dropdown`
  - `short_text`
  - `long_text`
  - `numeric`
  - `multi_part`
- Adaptive next-question generation using state + latest answer
- Final recruiter report generation

## API

- `POST /api/interview/start`
- `POST /api/interview/answer`
- `GET /api/interview/session/:sessionId`
- `GET /api/interview/report/:sessionId`

See docs in [../docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md).

`/start` supports `templateId` but defaults to `tmpl_dynamic_assessment_v1`.

## Run

1. Copy `.env.example` to `.env` and fill values.
2. Apply `sql/schema.sql` to Supabase.
2.5 Seed the adaptive template with `sql/seed_template.sql`.
3. Install dependencies and run:

```bash
npm install
npm run dev
```

## Notes on Speed

- Uses compact state + latest answer only for turn generation
- Avoids full chat history replay
- Uses fast-turn model (`OPENAI_FAST_MODEL`, default `gpt-4.1-mini`)
- Includes fallback question path when model JSON is invalid

## Table Isolation

- By default this engine writes to `tst_*` tables in your existing project.
- Prefix is configurable via `INTERVIEW_TABLE_PREFIX` (default `tst_`).
