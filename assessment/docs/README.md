# Xquesty Interview Engine – Codex Dev Environment

This package is the starting workspace for replacing the current **n8n-based interview flow** with a **custom AI interview engine**.

## Goal

Replace the current interview module that:
- sends every prior Q/A turn to n8n
- has slow next-question latency
- has high token usage
- produces weakly structured UI questions

With a new system that:
- uses the OpenAI API directly in app code
- stores interview state in your own database
- outputs structured JSON question blocks
- renders faster, cleaner, more recruiter-friendly interview UX
- improves question quality, consistency, and control

## What is included

- `PRD.md` — product requirements document
- `ARCHITECTURE.md` — technical architecture
- `INTERVIEW_SCHEMA.md` — question JSON schema
- `API_CONTRACTS.md` — backend request/response contracts
- `MIGRATION_PLAN.md` — step-by-step replacement plan
- `TASKS.md` — implementation backlog
- `CODEX_PROMPTS.md` — practical prompts to use with Codex
- `UX_GUIDELINES.md` — interview UX rules
- `STATE_MODEL.md` — structured memory/state model
- `.env.example` — example environment variables

## Recommended build direction

**Best architecture for Xquesty:**
1. frontend submits candidate answer to your backend
2. backend loads structured interview state from DB
3. backend calls OpenAI Responses API
4. model returns:
   - assessment update
   - updated state
   - next question JSON
5. frontend renders the next question block instantly

## Main principles

- do not resend full transcript every turn
- use slot-based memory and rolling summary
- prefer structured UI question types over raw chat text
- use AI for reasoning, code for orchestration
- keep interview deterministic where possible
- use stronger models only when needed

## Suggested first milestone

Build a working replacement for one interview flow:
- login candidate
- fetch interview session
- render first AI-generated question
- store answer
- generate next question JSON
- finish with final recruiter summary

## Suggested repo folders

```txt
/apps
  /web
  /api
/packages
  /interview-engine
  /schemas
  /ui-question-renderer
/docs
  *.md
```

## Notes for Codex

When using Codex, treat these docs as the source of truth.
Start from `PRD.md`, then `ARCHITECTURE.md`, then `TASKS.md`.
