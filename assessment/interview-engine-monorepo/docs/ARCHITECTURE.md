# Interview Engine Architecture

- `apps/interview-backend`: owns session orchestration, AI calls, persistence.
- `apps/interview-renderer`: owns candidate interview rendering and UX flows.
- `packages/shared-schemas`: shared contracts to keep backend/frontend consistent.
