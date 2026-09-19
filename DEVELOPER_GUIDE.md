# Developer guide

`useStore` (Zustand) owns one `Course` plus `LearnerState`, JSON-persisted in `localStorage`. `mastery.ts`, `dagValidator.ts`, and `patchEngine.ts` are pure deterministic engines. AI clients only propose typed data through `llmClient.ts`; state changes go through `patchEngine.ts` and retain inverse operations for undo.

API keys are managed purely on the client side for demo purposes and are stored in `localStorage`. Replace the `llmClient.ts` implementation with a backend proxy before production.

## Architecture
- `src/lib/models.ts`: Core domain models and discriminated unions for Blocks and Patches.
- `src/lib/patchEngine.ts`: Deterministic roadmap mutations.
- `src/lib/llmClient.ts`: Direct REST calls to Gemini with prompt caching for demo speed.
- `src/components/`: Reusable React components (Graph, Ring, Markdown).
- `src/app/`: Next.js App Router pages (`/goal`, `/build`, `/roadmap`, `/lesson`, `/quiz`, `/report`).
