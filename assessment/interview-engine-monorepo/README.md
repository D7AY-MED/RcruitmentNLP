# Interview Engine Monorepo Structure

Production-ready folder layout for the interview engine.

## Tree

```txt
interview-engine-monorepo/
  apps/
    interview-backend/
      src/
        index.ts
      package.json
    interview-renderer/
      src/
        components/
          DynamicInterviewRenderer.tsx
        index.tsx
      package.json
  packages/
    shared-schemas/
      src/
        index.ts
      package.json
  docs/
    ARCHITECTURE.md
    API.md
  .env.example
  package.json
```

## Notes
- `apps/interview-backend`: API + engine orchestration + DB integration.
- `apps/interview-renderer`: dynamic UI question renderer.
- `packages/shared-schemas`: shared zod/json schemas and contracts.
- `docs`: architecture, contracts, runbooks.
