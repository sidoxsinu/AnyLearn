# Task Assignment — Explorer 3 (Survey R2: 7 Pages & Test Preservation)

**Working Directory**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_3`
**Role**: `teamwork_preview_explorer` (Pages & Test Preservation Explorer)
**Original Request**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`

## Objectives
1. Read `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md` (specifically the section starting at `## 2026-09-20T01:44:00Z`).
2. Inspect all 7 pages:
   - `/` (`src/app/page.tsx`): landing hero, giant headline with 3D emoji, pastel card collage (tilted, overlapping), black pill CTA.
   - `/goal` (`src/app/goal/page.tsx`): centered mint/lavender card, large textarea, emoji suggestion chips (🧬 Biology, 💻 Python, 🎸 Guitar), black CTA, search-bar style input.
   - `/build` (`src/app/build/page.tsx`): vertical stepper of pastel cards (Understanding goal 🎯 → Mapping concepts 🗺️ → Writing lessons 📝 → Building quizzes 🧠); active tilted with spinner, done cards "Completed 👏" mint pill, pending dashed-border.
   - `/roadmap` (`src/app/roadmap/page.tsx`): two-column: left SVG DAG pastel card nodes linked by dashed green connectors (locked nodes have lock icon, current node is tilted lavender featured card, stat trio at top: Total/Completed/Upcoming); right "My Events" sidebar for node details and next tasks; spring pop-in for new nodes.
   - `/lesson/[id]` (`src/app/lesson/[id]/page.tsx`): pastel cards by type (text=white, video=lavender+play button, diagram=sky, tip=butter, key idea=mint), progress pill + sidebar with mastery ring and next lesson.
   - `/quiz/[lessonId]` (`src/app/quiz/[lessonId]/page.tsx`): one question per large card, option pills; correct → mint + ✅, wrong → soft red + ❌ + butter explanation card; confetti 🎉 result screen.
   - `/report/[lessonId]` (`src/app/report/[lessonId]/page.tsx`): split report form left, DiffView right (red-tinted removed lines, mint-tinted added lines), animated "AI patching 🔧" pill, "Fixed ✨" badge on completion.
3. Inspect all tests in `tests/` directory:
   - What tests exist? What do they test?
   - How do tests assert on page state, store, and components?
   - Ensure the UI redesign does NOT break any of the 80 existing tests!
4. Map the exact data flow, state hooks (`useStore`), route transitions, and event handlers for each of the 7 pages.


## 2026-09-20T01:45:53Z
You are Explorer 3 for the AnyLearn Frontend Redesign (Dei Reference Design).
Your working directory is /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_3.
Read your DISPATCH.md at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_3/DISPATCH.md.
MANDATORY: Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md completely.

Your mission:
1. Inspect all 7 pages in src/app/ (/, /goal, /build, /roadmap, /lesson/[id], /quiz/[lessonId], /report/[lessonId]).
2. For each page, analyze:
   - Current state variables, hooks (useStore, useParams, useRouter), and data flow
   - Required Dei visual redesign:
     - /: black shell hero, giant headline with 3D emoji, pastel card collage (tilted, overlapping), black pill CTA
     - /goal: centered mint/lavender card, large textarea, emoji suggestion chips (🧬 Biology, 💻 Python, 🎸 Guitar), black CTA, search-bar style input
     - /build: vertical stepper of pastel cards (Understanding goal 🎯 → Mapping concepts 🗺️ → Writing lessons 📝 → Building quizzes 🧠); active tilted with spinner, done cards "Completed 👏" mint pill, pending dashed-border
     - /roadmap: two-column: left SVG DAG with pastel card nodes linked by dashed green connectors, locked icon, tilted lavender featured card, stat trio; right "My Events" sidebar for node details and next tasks; spring pop-in
     - /lesson/[id]: pastel cards by type, progress pill + sidebar with mastery ring and next lesson
     - /quiz/[lessonId]: one question per large card, option pills, correct mint + ✅, wrong soft red + ❌ + butter explanation card, confetti 🎉 result screen
     - /report/[lessonId]: split: report form left, DiffView right, animated "AI patching 🔧" pill, "Fixed ✨" badge on completion
3. Inspect tests/ directory (all 80 existing tests). Document what each test suite checks (domain engines, store, regressions) and ensure the UI changes do not break any test expectations.
4. Produce a comprehensive survey report in your working directory at /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_r2_3/handoff.md.
Send a message when done with summary.
