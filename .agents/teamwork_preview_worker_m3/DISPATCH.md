# Dispatch for Worker 3: Core Application & Flow Bug Fixes (Milestone 3)

**Objective**: Implement core logic fixes:
1. Wire up Adaptive Roadmap Engine in `src/app/quiz/[lessonId]/page.tsx` (Moat 2).
2. Fix Independent Verifier before/after lesson in `src/app/report/[lessonId]/page.tsx` (Moat 3) and remove native alert.
3. Fix patchEngine inverse generation for markSkippable, addPractice, and replace continue with break for DAG validation.
4. Standardize LLMError in `src/lib/llmClient.ts` for strip-only compatibility and scope lastError locally.
5. Render Capstone Project card in `src/app/roadmap/page.tsx`.
6. Wire block flagging in `lesson/[id]/page.tsx` to navigate to report.
7. Add touch event handlers to `RoadmapGraph.tsx` and improve horizontal edge curves.
8. Add comprehensive regression tests in `tests/regressions.test.ts` and verify `npm test`, `npm run lint`, `npm run build`.

**Working Directory**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_worker_m3
**Authoritative Request**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
**Project Scope**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/PROJECT.md
**Explorer 2 Survey**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2/survey_report.md
