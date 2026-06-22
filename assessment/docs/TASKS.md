# Task Backlog

## Phase 1 — Foundations
- [ ] map current interview flow and endpoints
- [ ] identify exact frontend component to replace
- [ ] define interview stages
- [ ] define mandatory competency slots
- [ ] define question JSON schema
- [ ] choose DB tables or collections

## Phase 2 — Backend
- [ ] create interview session model
- [ ] create interview turn model
- [ ] build start endpoint
- [ ] build submit-answer endpoint
- [ ] build resume endpoint
- [ ] build final-report endpoint
- [ ] integrate OpenAI API
- [ ] add schema validation
- [ ] add retry + fallback logic

## Phase 3 — Prompting
- [ ] write stable system prompt
- [ ] write role template format
- [ ] write follow-up policy
- [ ] write stop policy
- [ ] write final evaluation prompt

## Phase 4 — Frontend
- [ ] build dynamic question renderer
- [ ] build field components by type
- [ ] build multi-part card renderer
- [ ] build loading state
- [ ] build progress indicator
- [ ] build validation error UI
- [ ] build completion screen

## Phase 5 — Analytics
- [ ] log latency per turn
- [ ] log token usage per turn
- [ ] log schema failures
- [ ] log completion rate
- [ ] log average interview length

## Phase 6 — Quality
- [ ] create internal test templates
- [ ] run 20 mock interviews
- [ ] review repeated questions
- [ ] review weak follow-ups
- [ ] improve slot coverage
- [ ] refine recruiter report output

## Recommended First Build Order
1. schema
2. DB state
3. backend endpoint
4. OpenAI call
5. frontend renderer
6. final report
