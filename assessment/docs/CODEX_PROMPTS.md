# Codex Prompts

## Prompt 1 — Generate Backend Interview Engine
Build a backend interview engine module for an existing web app.

Requirements:
- use direct OpenAI API integration
- do not use n8n
- store interview session state in DB
- generate next interview questions in structured JSON
- validate model output with a strict schema
- support these field types: single_choice, multi_choice, dropdown, short_text, long_text, numeric, date, boolean, multi_part
- avoid resending full transcript on every turn
- instead store compact state with current_stage, slots, rolling_summary, asked_question_ids, turn_count
- expose functions:
  - startInterview(candidateId, templateId)
  - submitAnswer(sessionId, questionId, answer)
  - getSession(sessionId)
  - finalizeInterview(sessionId)
- include retry and fallback logic if model returns invalid JSON
- write clean production-oriented code with comments

## Prompt 2 — Generate Frontend Dynamic Renderer
Build a frontend dynamic interview renderer for an existing website.

Requirements:
- input is a question JSON object
- render different UI components depending on type
- support single_choice, multi_choice, dropdown, short_text, long_text, numeric, date, boolean, multi_part
- validate required fields
- normalize answer payload before submit
- show loading state after submit
- make the UI professional and modern
- multi_part should render as one grouped card
- code should be modular and easy to extend

## Prompt 3 — Generate Zod Schema
Create a strict validation schema for the interview question JSON format using Zod.
Also generate TypeScript types inferred from the schema.

## Prompt 4 — Generate Migration Patch
I already have an interview flow in my web app connected to n8n.
Replace only the interview communication layer and interview UI.
Keep the rest of the website unchanged.
Refactor in a safe incremental way.

## Prompt 5 — Generate Final Report Engine
Build a final recruiter report generator that consumes structured interview state and outputs:
- summary
- competency scores
- motivation assessment
- communication notes
- red flags
- recommendation

## Prompt 6 — Generate Project Scaffold
Create a production-ready folder structure for this interview engine inside an existing monorepo.
Include:
- backend service
- frontend renderer
- shared schemas
- docs folder
- environment variable example
