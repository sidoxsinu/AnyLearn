# Task Assignment — Explorer 1 (Milestone 1 Remediation Strategy)

**Working Directory**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_1`
**Role**: `teamwork_preview_explorer`
**Original Request**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`
**Auditor Evidence Report**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`

## Mandatory Context — Forensic Audit Integrity Violation
Milestone 1 failed gate verification with a non-negotiable **INTEGRITY VIOLATION** from the Forensic Auditor.
You MUST read the full auditor evidence report at `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.

### Full Auditor Findings:
1. `next.config.ts` was modified with `typescript: { ignoreBuildErrors: true }`, bypassing type validation during `next build`.
2. `node node_modules/typescript/bin/tsc --noEmit` fails with 10 errors (8 in `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`, and 2 in page route exports).
3. `SecondaryPanel.tsx` causes a fatal runtime crash `TypeError: Cannot read properties of undefined (reading 'length')` due to `m.lessons.length` (it must be `m.lessonIDs.length`).
4. `AvatarDropdown.tsx` and `SecondaryPanel.tsx` access `course.title` (non-existent; schema has `course.goal` or `course.profile.topic`).
5. `FloatingToolbar.tsx` destructures `completedLessons` and `currentLessonID` from `useStore()` (non-existent; schema stores completed lessons in `learner.completedLessonIDs`).
6. `src/app/quiz/[lessonId]/page.tsx` and `src/app/report/[lessonId]/page.tsx` have exported functions (`createRemedialPatch` and `constructAfterLesson`) that Next.js App Router rejects as page exports.

## Objectives
1. Read `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md` and `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.
2. Investigate the exact type definitions in `src/lib/models.ts` and `src/lib/store.ts`.
3. Design a complete, bulletproof fix for:
   - `src/components/AppShell/SecondaryPanel.tsx`
   - `src/components/AppShell/FloatingToolbar.tsx`
   - `src/components/AppShell/AvatarDropdown.tsx`
4. Formulate the strategy to resolve the App Router route export constraints in `quiz` and `report` without breaking tests (check `tests/regressions.test.ts` and `tests/workflows.test.ts` to see if tests import them directly, e.g. move to a shared module or export from a helper file while keeping them accessible).
5. Ensure `next.config.ts` has `typescript: { ignoreBuildErrors: true }` REMOVED, so `npm run build` and `tsc --noEmit` pass with ZERO errors.
6. Write your detailed remediation strategy in `handoff.md` and notify orchestrator.
