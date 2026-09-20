# AnyLearn Client Features, UI & Architecture Survey Report
**Agent**: Explorer 2 (Client Features & UI Auditor)  
**Date**: 2026-09-19  
**Scope**: All user-facing pages, App Router structure, client components, state stores, interactive features, error handling, hooks, and browser APIs.

---

## Executive Summary

AnyLearn is structured as a Next.js 16 (React 19) App Router single-page/client-side application with a glassmorphic dark theme, backed by Zustand state management with `localStorage` persistence and direct client-side calls to the Gemini 2.0 Flash REST API. 

While the core conceptual architecture (deterministic engines, domain models, and UI shell) is cleanly ported from its Swift foundations, this comprehensive audit identified **20 distinct bugs and implementation defects**, including:
1. **Critical flow breakers**: Demo/Preview mode leaves users stranded on the goal intake screen; stub lessons in demo mode kick the user back to `/goal`; and missing/invalid lessons render an infinite spinner.
2. **Missing core value loops**: Quiz completion displays a prominent "Adaptive update triggered" banner when a learner struggles, but never invokes `Prompts.adapt` or `applyPatch`, leaving the roadmap unaltered (Moat 2 failure).
3. **Broken AI verification loop**: The Report & Fix verifier prompt sends the unpatched original lesson as both the "before" and "after" payload, preventing the AI verifier from actually evaluating the patch (Moat 3 defect).
4. **Hydration and SSR hazards**: Direct `sessionStorage` access in the render body of `/build` and synchronous `ApiKeyStore` calls during `useState` initialization on `/goal`.
5. **Completely missing features**: The `capstone` project model is generated and saved in the course object but is never rendered anywhere in the UI.

---

## Section 1: Application Architecture & Inventory

### 1.1 Page & Route Inventory

| Route | File Path | Rendering Mode | Purpose & Interactions |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Client (`'use client'`) | Root router redirect. Uses a 100ms timeout to detect if `course` exists in Zustand store; redirects to `/roadmap` if present, else `/goal`. |
| `/goal` | `src/app/goal/page.tsx` | Client (`'use client'`) | Goal intake and calibration. Includes goal textarea, 6 pre-set example chips, artifact selection chips, hours/week selector, and "Build my course →" CTA. Hosts the `ApiKeyModal`. |
| `/build` | `src/app/build/page.tsx` | Client (`'use client'`) | Visual course generation pipeline. Renders 5 sequential progress steps with animated dots. Orchestrates profile synthesis, `conceptGraph` generation, `curriculum` structuring, and course assembly. |
| `/roadmap` | `src/app/roadmap/page.tsx` | Client (`'use client'`) | Main persistent course hub. Features interactive SVG graph, module bounding boxes, concept mastery color-coding, overall progress bar, "Next Best Action" CTA, slide-over lesson details drawer, and slide-over changelog drawer with undo. |
| `/lesson/[id]` | `src/app/lesson/[id]/page.tsx` | Client (`'use client'`) | Lesson workspace. Renders learning objectives, modular content blocks (markdown, worked examples, callouts, checkpoints, diagrams), hands-on task cards, and external sources. Handles lazy stub generation. Footer provides Mark Complete, Report/Fix, and Take Quiz buttons. |
| `/quiz/[lessonId]` | `src/app/quiz/[lessonId]/page.tsx` | Client (`'use client'`) | Step-by-step diagnostic/formative quiz. Shows question prompt, difficulty tier, option buttons with misconception tags, immediate correctness feedback, explanation card, concept mastery bars, and review. |
| `/report/[lessonId]` | `src/app/report/[lessonId]/page.tsx` | Client (`'use client'`) | Report & Fix loop. Displays 9 issue taxonomy buttons, optional detail textarea, loading states for diagnosis, patch generation, verification, and a result inspection view showing root cause, patch operations, verifier verdict, and affected concepts. |

*Note on API Routes*: There are zero Next.js API routes (`src/app/api/`). The application is designed to operate client-side only, making direct HTTP calls to `https://generativelanguage.googleapis.com/v1beta/models`.

### 1.2 Client Component Inventory

| Component | File Path | Description & Props |
|---|---|---|
| `ApiKeyModal` | `src/components/ApiKeyModal.tsx` | Modal dialog for entering and validating Gemini API keys. Props: `onReady: () => void`. Checks key prefix `AIza`, verifies against Google API, saves to `localStorage`, and provides a "Preview with PCB Design demo" option. |
| `BlockRenderer` | `src/components/BlockRenderer.tsx` | Dispatches discriminated union blocks: `MarkdownBlock` (with flag button), `WorkedExampleBlock` (collapsible step-by-step), `CalloutBlock` (mistake, tip, warning), `CheckpointBlock` (with answer reveal button), and `DiagramBlock` (pre-formatted code block). Props: `block: Block`, `onFlag?: (id: string) => void`. |
| `MasteryRing` | `src/components/MasteryRing.tsx` | SVG circular mastery gauge with percentage text and color transitions based on probability tiers (untouched, weak, ok, solid). Props: `probability: number`, `size?: number`, `strokeWidth?: number`, `label?: string`. |
| `MasteryBar` | `src/components/MasteryRing.tsx` | Horizontal mastery bar with concept title and progress fill. Props: `probability: number`, `conceptName?: string`. |
| `RoadmapGraph` | `src/components/RoadmapGraph.tsx` | Interactive SVG canvas rendering module containers, lesson node rectangles, status indicators, skippable badges, cubic bezier curves, and pan dragging. Props: `course: Course`, `learner: LearnerState`, `selectedID?: string`, `onSelect: (id: string) => void`. |

### 1.3 State Management & Storage Inventory

| Store / Storage | Key Name | File Path | Schema / Contents | Safety / SSR Handling |
|---|---|---|---|---|
| Zustand `useStore` | `anylearn-state` | `src/lib/store.ts` | `{ course: Course \| null, learner: LearnerState }` (partialized from AppState). | Uses `createJSONStorage` with window check fallback. Lacks explicit hydration listener leading to 100ms delay hacks. |
| Gemini API Key | `anylearn-gemini-key` | `src/lib/llmClient.ts` | String: raw API key. Managed by `ApiKeyStore` helper object. | Client-side only. Checked synchronously on SSR causing hydration mismatch on `/goal`. |
| Demo Mode Flag | `anylearn-demo-mode` | `src/lib/llmClient.ts`, `ApiKeyModal.tsx` | String: `'true'` or `null`. | Client-side only. If active, intercepts `generate()` calls and checks cache. |
| Response Cache | `anylearn-cache-<sha256>` | `src/lib/llmClient.ts` | String: JSON-serialized LLM response keyed by SHA-256 of `system + user`. | Client-side only. Fallback for demo mode and offline resilience. |
| Course Intake Handoff | `anylearn-goal`, `anylearn-artifact`, `anylearn-hours` | `src/app/goal/page.tsx`, `src/app/build/page.tsx` | Strings stored in `sessionStorage` during transition from `/goal` to `/build`. | Not SSR safe: accessed directly in JSX render in `/build/page.tsx:171`. |

---

## Section 2: Comprehensive Feature Inventory (For PROJECT.md)

| Feature ID | Feature Name | Spec Reference | Current Implementation Status | Evaluation & Gap Analysis |
|---|---|---|---|---|
| **FEAT-01** | Goal Intake & Calibration | PRD §8 F1, UX §3.1 | **Implemented** with UX quirks | Textarea and example chips work. Calibration chips for artifact and hours work. API Key modal triggers properly, but lacks smooth hydration transition. |
| **FEAT-02** | Gemini API Key Management | PRD §6, README | **Implemented** with lint issues | Live validation against Google's API works. Stored in `localStorage`. Uses forbidden `require('@/lib/store')` in modal callback. |
| **FEAT-03** | Preview / Demo Mode | PRD §8 F14, DEMO.md | **Partially Broken** | Loads `pcbCourseFixture`, but does not navigate user to `/roadmap`. Clicking stub lessons in demo mode kicks user back to `/goal`. |
| **FEAT-04** | Course Generation Pipeline | PRD §8 F2, UX §3.2 | **Implemented** | Generates concept graph and curriculum via Gemini 2.0 Flash. Missing DAG cycle validation call on returned concepts. |
| **FEAT-05** | Roadmap Interactive Graph | PRD §8 F3, UX §3.3 | **Implemented** with minor UI flaws | SVG layout renders modules, nodes, and mastery colors. Pan dragging works with mouse, but missing touch event support. Bezier curves loop awkwardly for horizontal nodes. |
| **FEAT-06** | Progress & Mastery Dashboard | PRD §8 F9, UX §3.3 | **Implemented** | Overall lesson progress bar, average mastery ring, and "Next Best Action" button all compute and update dynamically. |
| **FEAT-07** | Course Changelog & Undo | PRD §8 F7, UX §3.3 | **Implemented** with engine edge cases | Slide-over changelog displays history with badges. Undo button invokes `store.undo()`. Engine inverse for `markSkippable` and `addPractice` fails to revert cleanly. Redo not implemented. |
| **FEAT-08** | Lazy Lesson Content Generation | PRD §8 F4, UX §3.4 | **Implemented** | When opening a 'stub' lesson, queries Gemini for structured blocks and quiz. Works in live mode with API key; breaks in demo mode. |
| **FEAT-09** | Block-Based Lesson Workspace | PRD §8 F4, UX §3.4 | **Implemented** | Renders markdown, worked examples with step-by-step collapse, callouts with emoji icons, checkpoints with answer reveal, and hands-on task cards. Diagram block does not render SVG (prints text). Flagging a block does nothing. |
| **FEAT-10** | Lesson Mark Complete | PRD §8 F9 | **Implemented** | "Mark complete" button updates `learner.completedLessonIDs` in store and switches to a green badge. |
| **FEAT-11** | Concept-Tagged Quizzes | PRD §8 F5, UX §3.5 | **Implemented** | Quizzes render 1 question at a time with difficulty badge. Selection, immediate answer confirmation, misconception callout, and explanation all render correctly. |
| **FEAT-12** | Mastery Updating Engine | PRD §8 F5, models.ts | **Implemented** | `Mastery.updateFromAnswer` correctly applies alpha learning rate, difficulty penalty, and records misconceptions. |
| **FEAT-13** | Adaptive Roadmap Engine | PRD §8 F6, UX §3.5 | **BROKEN / STUBBED** | Quiz summary displays "Adaptive update triggered", but NEVER calls `Prompts.adapt` or `applyPatch`. Roadmap is never patched after quiz failure. |
| **FEAT-14** | Report & Fix Diagnosis & Patch | PRD §8 F7, UX §3.6 | **Implemented** | 9-category report selection, Gemini diagnosis generation, and patch creation work. Uses native `alert()` on failure. |
| **FEAT-15** | Independent Verifier Loop | PRD §8 F7, UX §3.6 | **BROKEN LOGIC** | Verifier prompt passes `(lesson, lesson, ...)` — compares the unpatched lesson to itself, ignoring the patch. |
| **FEAT-16** | Capstone Project Display | PRD §8 F11, DEMO.md | **MISSING** | Capstone is generated and stored in `course.capstone`, but no component or screen renders it. |
| **FEAT-17** | Global Error Boundaries | PRD §10 | **MISSING** | No React Error Boundaries configured in `app/layout.tsx` or pages. Unhandled runtime errors cause white screens. |

---

## Section 3: Detailed Bug & Issue Catalog

### Category A: Critical Flow Breakers & Runtime Crashes

#### Bug 1: Preview Mode Does Not Navigate to Roadmap & Uses Forbidden Require
- **Location**: `src/components/ApiKeyModal.tsx:51-61`
- **Symptom**: In the API Key Modal, clicking "Preview with PCB Design demo (no key needed)" loads the fixture into the Zustand store and dismisses the modal, but leaves the user stuck on `/goal` with an empty text box. If the user then submits a goal, they are redirected back to `/goal` because no API key exists. Furthermore, line 56 triggers an ESLint build error: `A require() style import is forbidden (@typescript-eslint/no-require-imports)`.
- **Root Cause**: `handlePreview` only calls `onReady()`, which in `GoalPage` just toggles `setShowModal(false)` instead of navigating to `/roadmap`. Additionally, it uses synchronous `require('@/lib/store')` inside a promise callback.
- **Fix Strategy**:
  1. Import `useStore` at top-level of `ApiKeyModal.tsx`.
  2. Have `handlePreview` accept a router push or invoke `router.push('/roadmap')` directly, or let `onReady` inform `GoalPage` to redirect.

#### Bug 2: Stub Lessons in Demo Mode Kick User Out to `/goal`
- **Location**: `src/app/lesson/[id]/page.tsx:38-40` & `src/lib/llmClient.ts:112-116`
- **Symptom**: In Demo/Preview mode, clicking on any of the 9 stub lessons in `pcbCourseFixture` immediately redirects the user to `/goal`.
- **Root Cause**: `generateLesson()` checks `const apiKey = ApiKeyStore.get(); if (!apiKey) { router.push('/goal'); return; }`. In demo mode, no API key is provided. Even if bypassed, `llmClient.ts:115` throws `LLMError('cacheMiss')` because responses are not pre-cached in `localStorage`.
- **Fix Strategy**:
  1. Either pre-populate ready content for the demo lessons in `pcbCourseFixture`, OR
  2. In `LessonPage`, check `localStorage.getItem('anylearn-demo-mode') === 'true'`. If in demo mode without an API key, display an informative callout banner ("Stub lesson content generation requires a live Gemini API key") instead of kicking the user back to `/goal`.

#### Bug 3: Infinite Spinner on Non-Existent or Missing Lesson
- **Location**: `src/app/lesson/[id]/page.tsx:91-97`
- **Symptom**: Navigating to `/lesson/invalid-id` or opening a lesson when the course is not yet loaded renders an infinite spinner with no error message, timeout, or navigation controls.
- **Root Cause**: The component simply checks `if (!course || !lesson) return <div className="spinner" />` without differentiating between initial loading and missing resource.
- **Fix Strategy**: Add a timeout / `mounted` state. If `mounted && course && !lesson`, render an error card: "Lesson not found" with a "Return to Roadmap" button.

#### Bug 4: Quiz Page Broken Loop When Quiz is Empty
- **Location**: `src/app/lesson/[id]/page.tsx:234`
- **Symptom**: For a lesson where `lesson.status === 'ready'` but quiz questions were not generated, the "Take Quiz →" button remains enabled. Clicking it navigates to `/quiz/[lessonId]`, which shows "No quiz yet. Open the lesson first to generate content and quiz questions." Clicking "Go to Lesson" returns the user to the lesson, creating an inescapable loop.
- **Root Cause**: Line 234 disables the button only when `!hasQuiz && lesson.status !== 'ready'`. If `lesson.status === 'ready'`, the condition evaluates to `false` even if `!hasQuiz` is `true`.
- **Fix Strategy**: Change button disabled prop to: `disabled={!hasQuiz}`.

---

### Category B: Broken AI & Adaptive Logic

#### Bug 5: Phantom "Adaptive update triggered" - Adaptive Patch Never Called
- **Location**: `src/app/quiz/[lessonId]/page.tsx:18, 76-79, 121-137`
- **Symptom**: When a user completes a quiz with low scores on concepts, the UI displays a warning box: `⚠ Adaptive update triggered. You're struggling with X concepts. The roadmap will be updated to add a remedial path.` However, the roadmap is never patched, no remedial lesson is created, and the course remains unchanged.
- **Root Cause**: `applyPatch` is imported from `useStore` at line 18 (flagged as unused by ESLint), but never called. No call to `Prompts.adapt()` or LLM generation is ever made in `QuizPage`.
- **Fix Strategy**:
  1. Trigger an adaptive patch request in `QuizPage` (or provide an explicit "Apply Remedial Path" button).
  2. Call `Prompts.adapt(...)`, generate the `RoadmapPatch` via `llmClient`, and apply it with `applyPatch(patch, 'adapt', reason)`.
  3. In demo mode, apply a deterministic fallback remedial patch (e.g. inserting a short 10-minute ground plane recap lesson).

#### Bug 6: Report/Fix Verifier Compares Original Lesson to Itself
- **Location**: `src/app/report/[lessonId]/page.tsx:78`
- **Symptom**: In the Report & Fix flow, the independent verifier is asked to verify whether the proposed patch fixes the reported problem. However, the verifier always sees zero changes and may produce inaccurate or invalid verification results.
- **Root Cause**: Line 78 calls: `Prompts.verify(lesson, lesson, report, mastery)`. Both `before` and `after` arguments receive `lesson`.
- **Fix Strategy**: Compute the patched lesson representation before calling `Prompts.verify`. Apply `plan.patch` to a clone of `lesson` so the verifier inspects the actual `before` vs `after` content.

#### Bug 7: Report/Fix Displays False Success When `applyPatch` Fails
- **Location**: `src/app/report/[lessonId]/page.tsx:84, 108, 122-124`
- **Symptom**: If `applyPatch` fails (e.g. due to cyclic DAG, too many ops, or unknown IDs), the result screen still displays a large green banner: `✓ Fix applied & verified`.
- **Root Cause**: Line 122 determines the header text solely using `passed = verify?.verdict === 'pass'`, ignoring `applyResult?.success`.
- **Fix Strategy**:
  Check `const effectivelyApplied = passed && applyResult?.success;` and display failure / warning states accordingly.

#### Bug 8: Inverse Patch Calculation in `patchEngine.ts` Fails for `markSkippable` and `addPractice`
- **Location**: `src/lib/patchEngine.ts:106-111, 115-121`
- **Symptom**: Undoing a `markSkippable` patch on a lesson that was not previously skippable does not unmark it as skippable. Undoing an `addPractice` patch on a lesson with no prior practice re-adds the practice instead of deleting it.
- **Root Cause**:
  - In `markSkippable`, if `!old`, `inverses` is not appended to.
  - In `addPractice`, `inverses` sets `task: oldTask ?? op.task`. If `oldTask` was undefined, it copies `op.task`.
- **Fix Strategy**: Support explicit removal in patch operations or inverse operations (e.g. `clearPractice`, `unmarkSkippable`).

---

### Category C: Hydration, Storage & Hook Issues

#### Bug 9: Direct `sessionStorage` Read in Render Body of `/build`
- **Location**: `src/app/build/page.tsx:171`
- **Symptom**: Line 171 executes `{sessionStorage.getItem('anylearn-goal')?.slice(0, 80) ?? ''}` directly during component rendering. This causes hydration mismatches or runtime errors in environments where `sessionStorage` is undefined during SSR.
- **Root Cause**: Direct DOM storage access during render phase rather than in `useEffect` or state.
- **Fix Strategy**: Read `sessionStorage` inside `useEffect`, store the goal in a local state `goalSummary`, and render from state.

#### Bug 10: Hydration Mismatch & Modal Flash on `/goal`
- **Location**: `src/app/goal/page.tsx:28`
- **Symptom**: `const [showModal, setShowModal] = useState(!ApiKeyStore.has());`. On SSR, `ApiKeyStore.has()` returns `false`, initializing `showModal = true`. When client hydrates with an existing key in `localStorage`, the modal is rendered initially before any correction.
- **Root Cause**: Reading `localStorage` synchronously during state initialization.
- **Fix Strategy**: Use a `mounted` flag (`const [mounted, setMounted] = useState(false)`). Render modal only after mount if `!ApiKeyStore.has()`.

#### Bug 11: ESLint Function Hoisting Violation on `buildCourse`
- **Location**: `src/app/build/page.tsx:39, 44`
- **Symptom**: ESLint error: `Error: Cannot access variable before it is declared. 'buildCourse' is accessed before it is declared (react-hooks/immutability)`.
- **Root Cause**: Calling `buildCourse(...)` inside `useEffect` above its `async function buildCourse` declaration.
- **Fix Strategy**: Move `buildCourse` definition above `useEffect`, or wrap in `useCallback`.

#### Bug 12: Calling `setState` Synchronously in Effect on `/roadmap`
- **Location**: `src/app/roadmap/page.tsx:18`
- **Symptom**: ESLint error: `Calling setState synchronously within an effect can trigger cascading renders (react-hooks/set-state-in-effect)`.
- **Root Cause**: `useEffect(() => { setMounted(true); }, []);`.
- **Fix Strategy**: Follow recommended React 19 / Next.js hydration patterns (e.g. `useSyncExternalStore` or standard hydration wrapper).

#### Bug 13: Shared Mutable Global Variable in `llmClient.ts`
- **Location**: `src/lib/llmClient.ts:96`
- **Symptom**: `let lastError = '';` is declared at the file scope. If concurrent requests occur, this variable is shared and can leak incorrect error contexts into prompt retries.
- **Root Cause**: Module-level mutable state instead of scoped local variable inside `callGemini`.
- **Fix Strategy**: Scope `lastError` inside the `callGemini` function closure.

---

### Category D: Missing UI Features & Interactive Dead Ends

#### Bug 14: Capstone Project Never Rendered Anywhere in UI
- **Location**: `src/app/roadmap/page.tsx`, `src/lib/models.ts:106-110`
- **Symptom**: The Capstone project is generated by the LLM and exists in `course.capstone` (with title, description, and success criteria), but is completely omitted from the UI. Users cannot view their final project goal.
- **Root Cause**: No component or card in `roadmap/page.tsx` renders `course.capstone`.
- **Fix Strategy**: Add a Capstone Card at the top or bottom of the roadmap canvas or within a dedicated tab/section as specified in `docs/UX.md` and `docs/DEMO.md`.

#### Bug 15: Flagging Blocks in Lesson Does Nothing
- **Location**: `src/app/lesson/[id]/page.tsx:23-24, 157` & `src/components/BlockRenderer.tsx:28-36`
- **Symptom**: Clicking the flag icon ⚑ on a markdown block updates `flaggedBlock` and `showReport` state, but neither state is ever rendered or used to navigate.
- **Root Cause**: Unfinished feature. The state variables are assigned but unused.
- **Fix Strategy**: Clicking flag should navigate to `/report/[lessonId]?blockId=${block.id}` or pre-fill the report form with the flagged block context.

#### Bug 16: RoadmapGraph Missing Touch Drag Support
- **Location**: `src/components/RoadmapGraph.tsx:59-69`
- **Symptom**: On mobile devices or touchscreen laptops, users cannot pan or drag the roadmap canvas.
- **Root Cause**: Only `onMouseDown`, `onMouseMove`, `onMouseUp` handlers are attached to the `<svg>`; `onTouchStart`, `onTouchMove`, `onTouchEnd` are missing.
- **Fix Strategy**: Add touch event listeners with `touch.clientX/clientY` mapping.

#### Bug 17: RoadmapGraph Awkward Reverse-Curving Edges
- **Location**: `src/components/RoadmapGraph.tsx:138-145, 240-243`
- **Symptom**: Connecting horizontal nodes within the same row creates upward looping bezier curves.
- **Root Cause**: Coordinates always connect bottom-center `(x1, y1 + NODE_H)` to top-center `(x2, y2)`. For nodes on the same horizontal row, `y1 + NODE_H > y2`.
- **Fix Strategy**: Check whether `from.y === to.y`. If on the same row, connect right-edge `(x1 + NODE_W, y1 + NODE_H/2)` to left-edge `(x2, y2 + NODE_H/2)`.

#### Bug 18: Unescaped HTML Entities Breaking ESLint
- **Location**:
  - `src/app/goal/page.tsx:102:83` (`What's your end goal?`)
  - `src/app/quiz/[lessonId]/page.tsx:127:20` (`You're struggling with...`)
  - `src/app/report/[lessonId]/page.tsx:231:13, 231:28` (`"{lesson.title}"...`)
  - `src/components/ApiKeyModal.tsx:128:52` (`browser's localStorage`)
- **Symptom**: ESLint errors: `react/no-unescaped-entities`.
- **Fix Strategy**: Replace `'` with `&apos;` or `&#39;` and `"` with `&quot;`.

#### Bug 19: Native `alert()` Used in Report Page
- **Location**: `src/app/report/[lessonId]/page.tsx:91`
- **Symptom**: Catch block triggers `alert('Error: ' + ...)` which halts thread and disrupts UX.
- **Fix Strategy**: Replace with an inline error card or toast message.

#### Bug 20: Unused / Dead Files and Dependencies
- **Location**: `src/app/globals.css`, `src/app/page.module.css`, `mermaid` in `package.json`
- **Symptom**: `src/app/globals.css` is an unreferenced 50-line boilerplate file. `mermaid` is installed in `package.json` but diagrams are rendered as plain text in `<pre>`.
- **Fix Strategy**: Clean up unused css files and either integrate `mermaid` dynamically or document its status.

---

## Section 4: Recommended Implementation & Fix Roadmap

To systematically resolve all issues, the fix implementation should be partitioned into 4 logical tracks:

1. **Track 1: Core Navigation & Demo Mode Integrity (Bugs 1, 2, 3, 4, 10)**
   - Fix `ApiKeyModal` preview flow to navigate directly to `/roadmap`.
   - Protect stub lessons in demo mode from kicking user to `/goal`.
   - Add proper loading/fallback states on `/lesson/[id]` and `/roadmap`.
   - Sanitize `sessionStorage` and `localStorage` initial reads for SSR safety.

2. **Track 2: AI Logic & Moat Integrity (Bugs 5, 6, 7, 8, 13)**
   - Wire up `Prompts.adapt` in `QuizPage` so failing a quiz triggers a true roadmap patch (Moat 2).
   - Fix `Prompts.verify` in `ReportPage` to compare original vs patched lesson (Moat 3).
   - Ensure `applyResult.success` dictates report success UI.
   - Fix `patchEngine.ts` inverses for `markSkippable` and `addPractice`.
   - Scope `lastError` locally in `llmClient.ts`.

3. **Track 3: UI Completion & Polish (Bugs 14, 15, 16, 17, 19)**
   - Render Capstone Project card on the Roadmap.
   - Wire up lesson block flagging to navigate to `/report`.
   - Add touch handlers to `RoadmapGraph` and fix bezier curve direction for horizontal nodes.
   - Replace native `alert()` with inline error banner in `/report`.

4. **Track 4: Build, Lint & Cleanliness (Bugs 11, 12, 18, 20)**
   - Fix all ESLint errors (unescaped entities, variable hoisting, `require()` removal).
   - Remove unused CSS files (`src/app/globals.css`, `src/app/page.module.css`).
   - Add comprehensive regression tests in `src/__tests__/` covering mastery updates, patch engine inverses, DAG validation, and component rendering.

---
