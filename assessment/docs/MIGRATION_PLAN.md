# Migration Plan

## Objective
Replace only the current interview communication and UX layer without rewriting the whole website.

## Step 1 — Audit Current Flow
Document:
- current frontend interview components
- current n8n triggers/webhooks
- current data saved per turn
- current final report logic
- current recruiter outputs

## Step 2 — Freeze Requirements
Agree on:
- supported question types
- interview stages
- output schema
- recruiter report format
- latency target

## Step 3 — Build New Backend Endpoints
Create:
- `/api/interview/start`
- `/api/interview/answer`
- `/api/interview/session/:id`
- `/api/interview/report/:id`

## Step 4 — Build Interview Engine Module
Implement:
- prompt builder
- state manager
- output validator
- fallback logic
- stop logic

## Step 5 — Build Dynamic Frontend Renderer
Replace old interview UI with:
- question card renderer
- field-type renderer
- multi-part card support
- progress UI
- error fallback UI

## Step 6 — Connect DB State
Create session + turn tables and store:
- question json
- raw answer
- normalized answer
- state snapshot
- latency
- token usage

## Step 7 — Run Shadow Testing
For a subset of interviews:
- keep old flow for production
- run new engine in parallel internally
- compare latency, token use, and quality

## Step 8 — Switch Production Traffic
Roll out gradually:
- internal users
- test candidates
- partial live traffic
- full migration

## Step 9 — Remove n8n Dependency for Interview Flow
Keep only if needed for other unrelated automations.

## Rollback Plan
If quality drops:
- feature flag to restore old flow
- keep DB-compatible answer storage
- log all model outputs for diagnosis
