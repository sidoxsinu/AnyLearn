# Dispatch for Explorer 2: Client Features & UI Auditor

**Objective**: Audit the client-side pages, routing, components, state management, and user-facing features for bugs, broken flows, and runtime crashes.
**Working Directory**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2
**Original Request**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
**Project Root**: /Users/sinanm/Documents/ChatGPT/AnyLearn

## 2026-09-19T20:55:36Z
Survey and map all user-facing features, pages, routing, components, and client-side interactions in AnyLearn, identifying bugs, broken flows, missing error handling, and state management issues.

Specific instructions:
1. Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md.
2. Enumerate all pages, routes, client components, state stores (e.g. React context, Zustand, Redux, local state), and API routes.
3. Audit all client-side interactive features:
   - Navigation, forms, inputs, submit handlers, validation
   - Error boundaries, fallback UIs, loading states
   - Browser storage (localStorage/sessionStorage) syncing and error handling (e.g. SSR safety, quota errors)
   - Theme toggling, responsive layouts, modals, popovers, drawers
   - React hooks usage: missing useEffect dependencies, memory leaks, event listener cleanup, stale closures, infinite render loops
4. Check for broken links, broken imports, missing assets, uncaught exceptions, null/undefined reference errors.
5. Create a comprehensive Feature Inventory of all application features (to be incorporated into PROJECT.md) and a detailed list of all identified bugs/issues.
6. Document exact files, line numbers, error symptoms, root causes, and recommended fix strategies.
7. Produce a detailed survey report at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2/survey_report.md
   and write your standard handoff at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_2/handoff.md
8. Update progress.md with timestamps for liveness.
9. When complete, send a message to parent (ID: 291951c3-b3bc-4196-8548-b9bf845d3adc) referencing your report paths.
