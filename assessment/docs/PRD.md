# Product Requirements Document (PRD)
## Project
Xquesty AI Interview Engine Replacement

## Background

The current interview experience depends on n8n. It works, but has major limitations:
- slow question-to-question response time
- expensive token usage because old turns are resent repeatedly
- limited control over interview UX
- weak question structure for recruiter-ready data collection
- hard to evolve into a polished product

## Problem Statement

Candidates currently wait around 4–10 seconds after pressing submit before receiving the next question. The system also wastes tokens by re-sending prior conversation context. The interview UI is not optimized for structured input types like checkboxes, radio buttons, dropdowns, and grouped sub-questions.

## Goal

Replace the existing interview subsystem with a custom interview engine that:
- is faster
- uses fewer tokens
- produces better questions
- uses structured JSON question blocks
- supports rich UI types
- improves recruiter data quality
- is easier to control and improve over time

## Success Metrics

### Performance
- median next-question response under 2.5 seconds
- p95 next-question response under 5 seconds
- reduce token usage per turn by at least 60%

### UX
- candidate can answer faster due to better input controls
- fewer long free-text answers unless intentionally required
- better visual grouping of multi-part questions
- no repeated questions

### Data Quality
- recruiter receives cleaner structured data
- competency signals are extracted during the interview
- motivation, communication, confidence, and evidence are captured clearly

## In Scope

- replace interview orchestration currently tied to n8n
- replace existing candidate interview UX
- direct OpenAI API integration in application backend
- interview state storage in DB
- structured question JSON output
- adaptive follow-up logic
- final recruiter summary generation
- configurable interview templates by role

## Out of Scope

- full ATS replacement
- video interviewing
- voice interviewing
- proctoring
- anti-cheating beyond simple validation rules
- multilingual expansion beyond first supported language set unless already planned

## Users

### Primary
- candidates taking AI interview assessments
- recruiters reading final candidate reports

### Secondary
- admins configuring interview templates
- internal Xquesty operators monitoring interview quality

## Main User Stories

### Candidate
- I want the next question to appear quickly
- I want questions to be clear and easy to answer
- I want to use quick inputs when possible instead of writing everything
- I want the interview to feel intelligent and relevant

### Recruiter
- I want deeper candidate insights than a CV gives me
- I want structured output I can compare across candidates
- I want the system to detect real competencies, not only self-claims
- I want final summaries that are concise and evidence-based

### Admin
- I want to define interview rules and competency goals
- I want to control question quality and tone
- I want predictable interview behavior
- I want the ability to improve prompts without rewriting the whole system

## Product Principles

1. Structured over unstructured
2. Fast over overly open-ended
3. Adaptive over rigid
4. Evidence over claims
5. AI reasoning + code orchestration
6. Clear UI over raw chatbot look

## Core Features

### 1. Structured Question Engine
The AI returns question JSON, not plain text.

Supported input types:
- single_choice
- multi_choice
- dropdown
- short_text
- long_text
- numeric
- date
- boolean
- multi_part

### 2. Interview State Engine
The system stores:
- stage
- slots filled
- missing slots
- confidence by competency
- asked questions
- answer history references
- rolling summary
- stop conditions

### 3. Adaptive Follow-Ups
The engine probes deeper only when needed:
- vague answer -> deeper follow-up
- strong evidence -> move forward
- missing critical slot -> targeted question

### 4. Final Evaluation Output
At the end of interview:
- recruiter summary
- competency scoring
- evidence snippets
- red flags
- motivations
- communication notes
- recommendation level

## Interview Stages

1. introduction
2. candidate profile basics
3. motivation and goals
4. experience validation
5. technical or functional deep dive
6. project evidence
7. behavioral or situational checks
8. logistics and availability
9. closing confidence checks
10. finalization

## Functional Requirements

### FR1 — Start Interview
System loads interview template and creates interview session state.

### FR2 — Generate Next Question
Backend sends compact state + latest answer to OpenAI and gets next structured question.

### FR3 — Render Question
Frontend renders question dynamically from JSON schema.

### FR4 — Save Answer
Each answer is stored both:
- raw candidate response
- normalized structured response

### FR5 — Update State
System updates slot completion, stage progress, summary, and signals.

### FR6 — Avoid Repetition
Engine must not ask already answered questions unless explicitly re-verifying.

### FR7 — Multi-Part Questions
System can group related sub-questions into one visual card.

### FR8 — Stop Criteria
Interview ends when:
- mandatory slots are filled
- confidence threshold reached
- max question count reached
- interviewer logic decides enough evidence exists

### FR9 — Final Summary
System generates recruiter-ready final assessment after completion.

## Non-Functional Requirements

- API-first design
- schema-driven frontend
- role-based interview configuration
- observability for latency and token usage
- safe fallback when JSON is invalid
- low-latency model selection for turn-by-turn generation

## Risks

- model may generate poor JSON without strict schema enforcement
- overuse of long_text fields could reduce speed gains
- too much flexibility can reduce consistency
- weak slot design can hurt recruiter usefulness

## Mitigations

- strict JSON schema validation
- question catalog with reusable templates
- structured state model
- fallback question generation rules
- analytics on completion rate and latency

## MVP Definition

The MVP is successful when one role-based interview flow is fully migrated off n8n and supports:
- structured JSON questions
- direct API usage
- dynamic rendering
- DB-backed state
- final report output
