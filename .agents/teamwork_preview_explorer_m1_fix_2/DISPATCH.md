# Task Assignment — Explorer 2 (Milestone 1 Remediation Strategy)

**Working Directory**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_2`
**Role**: `teamwork_preview_explorer`
**Original Request**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`
**Auditor Evidence Report**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`

## Mandatory Context — Forensic Audit Integrity Violation
Milestone 1 failed gate verification with a non-negotiable **INTEGRITY VIOLATION** from the Forensic Auditor.
You MUST read the full auditor evidence report at `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.

## Objectives
1. Read `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md` and `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md`.
2. Analyze the schema mismatches across `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`.
3. Provide exact code replacements for all three components that correctly use `useStore` (`s.course`, `s.learner`), `course.modules`, `m.lessonIDs`, `course.lessons`, and `learner.completedLessonIDs`.
4. Analyze how `quiz` and `report` exports can be handled cleanly without triggering Next.js route type validation errors, while verifying that `tests/` still pass 100%.
5. Ensure `typescript: { ignoreBuildErrors: true }` in `next.config.ts` can be safely deleted.
6. 
## 2026-09-20T02:13:08Z
You are Explorer 2 for Milestone 1 Remediation.
Your working directory is /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_2.
Read your DISPATCH.md at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_m1_fix_2/DISPATCH.md.
MANDATORY: Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md.
MANDATORY: Read the full auditor report at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_auditor_ui_m1_1/handoff.md.

Formulate the exact code fixes for SecondaryPanel, FloatingToolbar, and AvatarDropdown.
Formulate the fix for next.config.ts and route exports.
Write handoff.md and notify orchestrator.
