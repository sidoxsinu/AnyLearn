# Setup

## Prerequisites
Node 20+, npm or pnpm, API keys: Gemini (AI Studio) and YouTube Data API v3; optional: Anthropic key, Tavily key.

## Install
```bash
npx create-next-app@latest anylearn --ts --tailwind --app --src-dir
cd anylearn
npm i zustand zod ai @ai-sdk/google @ai-sdk/anthropic @xyflow/react framer-motion mermaid diff lucide-react
npx shadcn@latest init
```

## Environment (`.env.local`)
```
GOOGLE_GENERATIVE_AI_API_KEY=...
ANTHROPIC_API_KEY=...            # optional: stronger Fix/Verify
YOUTUBE_API_KEY=...
TAVILY_API_KEY=...               # or BRAVE_API_KEY
LLM_FAST_MODEL=<gemini flash-class id>
LLM_STRONG_MODEL=<claude sonnet-class id or same as fast>
```
Check current model IDs in provider docs; they change.

## Run
```bash
npm run dev      # http://localhost:3000
```
- Live mode: default.
- **Safe mode:** `http://localhost:3000/?demo=safe` loads `src/lib/fixtures/pcb-course.json` and serves cached responses for `/api/*` (keyed by prompt hash).

## Generating the safe-mode fixture
1. Run live once with the demo goal; use the dev-only "Export fixture" button (dumps Course + LearnerState + AI response cache to JSON).
2. Commit to `src/lib/fixtures/`.
3. Manually review lessons for accuracy before the demo (you are the human verifier).

## Troubleshooting
| Symptom | Fix |
|---|---|
| Schema validation errors | Lower temperature; ensure Zod `.describe()` hints; retry logic in `llm.ts` |
| YouTube quota exceeded | Cache results; reduce `maxResults`; fall back to web search only |
| Embeds blocked | Use link card; check `frame-src` if CSP set |
| Slow roadmap | Stream concepts first; use fast model; reduce concept count to 20 |
| Mermaid render errors | Wrap in try/catch; hide diagram block on failure |
