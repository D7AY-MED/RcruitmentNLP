AGENTS.md - AI Interview Platform

What This Project Is
An intelligent interview platform where candidates upload their CV and are interviewed by an AI.
The AI asks personalized, adaptive questions based on CV content and candidate answers.

Who Does What
Candidate: Lands on the app, uploads their own CV, then gets interviewed.
AI: Reads the CV, asks the first question, then adapts each next question based on answers.
No admin involvement during the interview.

Core User Flow
1. Candidate opens the app.
2. Candidate uploads CV (PDF or text).
3. System parses CV and creates interview session.
4. AI asks first question.
5. Candidate answers.
6. AI asks next question using previous_response_id chaining.
7. Loop continues until completion.
8. Session ends.

Question Logic (Critical - Updated)
The interview uses a strict 15-question structure:
1. Opener: candidate frames current position and goals.
2-4. Technical Depth: probe 1-2 CV items for real ownership and depth.
5. Languages: capture language profile and level.
6-8. Work Style: behavioral and soft profile.
9-11. Career Direction: role targeting, preferences, and direction.
12-14. Logistics: availability, location, compensation, contract type.
15. Close: ask exactly "Is there anything important about your profile or preferences we haven't covered?"

Rules:
- Every question must be tied to CV or previous answer.
- One question at a time.
- Keep concise, concrete, non-generic questions.
- Preserve block order while allowing minimal follow-up for missing critical signal.
- After Q15 is complete, output exactly [INTERVIEW_COMPLETE].

Non-Negotiable Data To Capture By Interview End
- Languages: language and level for each.
- Technical: depth behind top 2-3 skills and ownership signals.
- Soft Profile: work style, autonomy level, collaboration style.
- Career Direction: target role type, target industry, target environment.
- Preferences: remote/hybrid/onsite, company size, contract type.
- Constraints: hard dealbreakers, excluded industries or roles.
- Logistics: notice period, location, relocation willingness.
- Compensation: current package, target package.

Memory / Session Architecture (Critical)
Use OpenAI Responses API, not /chat/completions.
First call includes CV plus system instructions and returns response_id.
Each next call sends only candidate answer plus previous_response_id.
Always use store: true.
Do not rebuild full message history manually.

Backend Storage Constraint
Store only minimal session data (candidate identifier, latest response_id, session timestamps/status).
Do not store message arrays/history arrays for core interview memory.

System Prompt Design (Critical)
Send system prompt once at session creation.
Prompt must include:
- role and behavior of interviewer,
- CV content,
- the exact 15-question block structure,
- personalization and anti-generic rule,
- strict output format (next question only),
- completion token [INTERVIEW_COMPLETE].

Performance / UX Goals
- Fast response per turn.
- One question visible at a time.
- Clean, focused interface.
- Easy CV upload.
- Mobile responsive.

Hard Rules
- Never use /chat/completions.
- Never send full conversation history each turn.
- Never show multiple questions at once.
- Never ask non-contextual generic questions.
- Never skip store: true on Responses API calls.
