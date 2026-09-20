# Task Assignment — Explorer 3 (Milestone 1 Remediation Strategy)

**Working Directory**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_3`
**Role**: `teamwork_preview_explorer`
**Original Request**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`
**Auditor Evidence Report**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`

## Mandatory Context — Forensic Audit Integrity Violation
Milestone 1 failed gate verification with a non-negotiable **INTEGRITY VIOLATION** from the Forensic Auditor.
You MUST read the full auditor evidence report at `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.

## Objectives
1. Read `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md` and `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.
2. Inspect `tests/` files to determine if any tests import `createRemedialPatch` from `src/app/quiz/[lessonId]/page.tsx` or `constructAfterLesson` from `src/app/report/[lessonId]/page.tsx`.
3. If tests DO import them: determine how to re-export or structure them so tests continue to pass while Next.js App Router route type validation succeeds (e.g. move functions to `src/lib/courseHelpers.ts` or similar and re-export where needed, or make sure Next.js typegen is satisfied).
4. Provide the exact fix for `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`.
5. Verify that removing `ignoreBuildErrors: true` allows `npm run build` to pass cleanly with `tsc` type validation enabled.
6. Write your report in `handoff.md` and notify orchestrator.

## 2026-09-20T02:13:08Z
<USER_REQUEST>
You are Explorer 3 for Milestone 1 Remediation.
Your working directory is /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_3.
Read your DISPATCH.md at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_3/DISPATCH.md.
MANDATORY: Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md.
MANDATORY: Read the full auditor report at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md.

Inspect tests/ to see if tests import createRemedialPatch or constructAfterLesson.
Design the solution that satisfies both Next.js App Router route typegen and test imports.
Provide complete remediation instructions.
Write handoff.md and notify orchestrator.
</USER_REQUEST>
