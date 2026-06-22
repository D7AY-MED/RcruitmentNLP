# Architecture

## High-Level Overview

The new system replaces n8n with a dedicated interview engine.

```txt
Frontend (candidate interview UI)
    ->
Backend API
    ->
Interview Engine Service
    ->
Database + OpenAI API
    ->
Structured next question JSON
    ->
Frontend renderer
```

## Main Components

### 1. Frontend Interview Renderer
Responsibilities:
- render structured question blocks
- validate required fields client-side
- submit normalized answer payload
- show progress and loading states
- support grouped multi-part cards

### 2. Backend API
Responsibilities:
- authenticate candidate session
- read/write interview session state
- call interview engine
- validate AI outputs
- return safe response to frontend

### 3. Interview Engine
Responsibilities:
- decide interview stage
- track competency slots
- create compact prompt state
- call model
- parse structured output
- apply fallback logic if needed
- update state

### 4. Database
Stores:
- interview_sessions
- interview_turns
- interview_templates
- competency_slots
- final_reports
- telemetry

### 5. OpenAI Integration
Use direct API from backend code.
Recommended pattern:
- persistent session strategy in app
- compact state payload
- structured response schema
- stream response if UI supports it

## Recommended Data Flow

### Start
1. candidate opens interview
2. backend creates or resumes session
3. state initialized from template
4. engine generates first question

### Answer Turn
1. candidate submits answer
2. backend stores raw answer
3. state updater normalizes answer
4. engine prepares compact prompt:
   - system instructions
   - interview config
   - compact state
   - latest answer
5. OpenAI returns:
   - state updates
   - next question JSON
   - internal reasoning outputs for system use
6. backend validates and stores
7. frontend renders next question

### Finish
1. stop condition reached
2. engine generates final report
3. recruiter reads summary dashboard

## Prompting Strategy

Send only:
- stable instruction set
- interview template
- compact structured memory
- latest answer
- maybe last question reference

Avoid:
- sending full transcript every turn
- large repeated recruiter prompt text
- unnecessary explanations

## Model Strategy

### Fast-turn model
Use for:
- next question generation
- slot update
- adaptive follow-up

### Stronger model
Use for:
- final candidate assessment
- difficult synthesis
- edge-case fallback if low confidence

## State Layers

### A. Stable Template Layer
- role
- competencies
- target evidence
- interview tone
- allowed question types
- mandatory slots

### B. Session State Layer
- current stage
- completed slots
- missing slots
- confidence levels
- asked question ids
- turn count
- rolling summary

### C. Turn Layer
- latest answer
- latest question id
- latest parsed signals

## Performance Optimizations

1. structured state instead of raw transcript
2. minimal prompt payload
3. role template caching
4. closed questions first
5. smaller model for normal turns
6. stream response to UI
7. local validation before model call
8. deterministic stop logic in code

## Suggested Tables

### interview_sessions
- id
- candidate_id
- template_id
- status
- current_stage
- turn_count
- compact_summary_json
- slot_state_json
- asked_question_ids_json
- created_at
- updated_at

### interview_turns
- id
- session_id
- question_id
- question_json
- answer_raw_json
- answer_normalized_json
- extracted_signals_json
- latency_ms
- token_usage_json
- created_at

### interview_templates
- id
- name
- role
- config_json
- active

### final_reports
- id
- session_id
- report_json
- recommendation
- created_at

## Fallbacks

If AI output fails schema validation:
1. retry once with stricter repair prompt
2. if still invalid, use fallback question from question catalog
3. log incident for review

## Deployment Suggestion

If your app already has backend:
- add `/api/interview/*`
- keep interview engine as a service module
- deploy without touching unrelated website areas

If you want modularization:
- `/packages/interview-engine`
- `/packages/schemas`
- `/packages/ui-question-renderer`
