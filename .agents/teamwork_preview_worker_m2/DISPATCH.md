# Dispatch for Worker 2: Codebase Audit & Build/Lint/Hydration Fixes (Milestone 2)

**Objective**: Fix package.json lint script, all 9 ESLint build errors, SSR hydration mismatches in /build and /goal, demo mode routing in ApiKeyModal and lesson/[id], and infinite lesson spinner. Add regression tests and verify all checks pass.
**Working Directory**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_worker_m2
**Authoritative Request**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
**Project Scope**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/PROJECT.md
**Explorer 1 Survey**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1/survey_report.md
**Explorer 2 Survey**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2/survey_report.md

## 2026-09-19T21:14:27Z
You are Worker 2 for Milestone 2 (Codebase Audit & Build/Lint/Hydration Fixes).
Working directory: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_worker_m2
Project root: /Users/sinanm/Documents/ChatGPT/AnyLearn
Authoritative request: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
Project plan: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/PROJECT.md
Explorer 1 Report: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1/survey_report.md
Explorer 2 Report: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2/survey_report.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Ownership:
You own:
- `src/app/build/page.tsx`
- `src/app/goal/page.tsx`
- `src/app/roadmap/page.tsx`
- `src/app/lesson/[id]/page.tsx`
- `src/components/ApiKeyModal.tsx`
- `src/lib/store.ts`
- `package.json` (lint script)
- `tests/regressions.test.ts` (adding tests for M2 bug fixes)

Tasks:
1. Update `"lint"` in `package.json` to `"node node_modules/eslint/bin/eslint.js ."` so `npm run lint` executes directly via node.
2. Fix all 9 ESLint errors across the codebase:
   - `src/app/build/page.tsx`: Fix `buildCourse` accessed before declaration (define `buildCourse` before `useEffect` or wrap in `useCallback`).
   - `src/app/roadmap/page.tsx`: Fix `setMounted(true)` synchronously inside `useEffect` (use React 18/19 hydration pattern or `useSyncExternalStore`).
   - Unescaped entities: replace unescaped apostrophes and quotes with `&apos;` and `&quot;` in `src/app/goal/page.tsx:102`, `src/app/quiz/[lessonId]/page.tsx:127`, `src/app/report/[lessonId]/page.tsx:231`, and `src/components/ApiKeyModal.tsx:128`.
   - `src/components/ApiKeyModal.tsx`: Remove `require('@/lib/store')` and import `useStore` at top level.
   - `src/lib/store.ts`: Remove `as any` in storage fallback and use clean typing (`StateStorage`).
3. Fix SSR hydration mismatches:
   - `src/app/build/page.tsx:171`: Do NOT read `sessionStorage` in the JSX render body. Read `sessionStorage` inside `useEffect` and store in local state `goalSummary`, rendering safely.
   - `src/app/goal/page.tsx:28`: `useState(!ApiKeyStore.has())` produces divergent SSR/client DOM. Initialize safely post-mount or with a mounted guard.
4. Fix Demo Mode flow & dead-ends:
   - In `ApiKeyModal.tsx`, clicking "Preview with PCB Design demo" must navigate the user to `/roadmap` (e.g. `router.push('/roadmap')`).
   - In `src/app/lesson/[id]/page.tsx:38-40`, if in demo mode without an API key, do NOT redirect to `/goal`. Display an informative notice ("Stub lesson generation requires a live Gemini API key") so demo mode users can explore the lesson workspace without getting kicked out.
   - In `src/app/lesson/[id]/page.tsx:91-97`, handle `course && !lesson` with a "Lesson not found" card and a "Return to Roadmap" button instead of an infinite spinner.
5. Add new regression tests in `tests/regressions.test.ts` specifically verifying:
   - No direct sessionStorage access during component mount.
   - Demo mode preview navigation state.
   - Missing lesson fallback handling.
   - Storage fallback type safety.
6. Verify commands:
   - Run `npm run lint`: must exit code 0 with 0 errors.
   - Run `npm test`: all tests must pass with exit code 0.
   - Run `npm run build`: Next.js Turbopack build must pass with exit code 0.
7. Write your handoff report to `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_worker_m2/handoff.md`.
8. When complete, send a message to parent (ID: 291951c3-b3bc-4196-8548-b9bf845d3adc).
