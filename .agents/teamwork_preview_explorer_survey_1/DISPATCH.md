# Dispatch for Explorer 1: Build & Runtime Auditor

**Objective**: Audit the Next.js application codebase for build warnings, type errors, runtime errors, and SSR/hydration mismatches.
**Working Directory**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1
**Original Request**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
**Project Root**: /Users/sinanm/Documents/ChatGPT/AnyLearn

## 2026-09-19T20:55:36Z

You are the Codebase & Build Auditor (Explorer 1).
Working directory: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1
Project root: /Users/sinanm/Documents/ChatGPT/AnyLearn
Authoritative request: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
Your dispatch file: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1/DISPATCH.md

Your mission:
Survey and audit the Next.js application codebase in /Users/sinanm/Documents/ChatGPT/AnyLearn for build warnings, type errors, runtime errors, and SSR/hydration mismatches.

Specific instructions:
1. Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md.
2. Check AGENTS.md in the project root to note any Next.js version constraints.
3. Investigate package.json, next.config (js/mjs/ts), tsconfig.json, eslint, postcss/tailwind configs, etc.
4. Run build verification commands: `npm run build`, `npm run lint`, `npx tsc --noEmit` (or whatever package scripts exist in package.json). Capture all errors, warnings, deprecations, and potential runtime hazards.
5. Inspect components and layout files for hydration mismatch anti-patterns:
   - Accessing window, document, or localStorage during server rendering or initial render
   - Non-deterministic values rendered on server vs client (Date.now(), Math.random(), browser timezone)
   - Invalid HTML nesting (e.g. <p> containing <div>, improper table elements, <a> inside <a>)
   - Missing "use client" directives or conflicting client/server boundaries
6. Document exact files, line numbers, error/warning messages, root causes, and recommended fix strategies.
7. Produce a detailed survey report at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1/survey_report.md
   and write your standard handoff at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_1/handoff.md
8. Update progress.md with timestamps for liveness.
9. When complete, send a message to parent (ID: 291951c3-b3bc-4196-8548-b9bf845d3adc) referencing your report paths.
