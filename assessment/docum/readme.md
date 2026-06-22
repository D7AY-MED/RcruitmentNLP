AI Interview Platform
An intelligent interview platform that conducts personalized, adaptive interviews based on a candidate's CV.
How It Works

Candidate uploads their CV
AI reads the CV and starts the interview
Questions adapt in real-time based on every answer
Follows a structured flow: Technical → Soft Skills → Motivation

Key Technical Decision
This project uses OpenAI Responses API (stateful) — not the standard chat completions API.
Each turn sends only the candidate's answer + a previous_response_id. No history management needed.
Getting Started

Clone the repo
Copy .env.example to .env and add your OPENAI_API_KEY
Follow setup instructions in /frontend and /backend folders

Project Structure
/frontend    → Candidate-facing UI
/backend     → Server + OpenAI Responses API integration
/prompts     → System prompt templates
Read First
Before making any changes, read AGENTS.md — it contains the full architecture, rules, and constraints for this project.