# AnyLearn Frontend Redesign (Dei Reference Design) — Survey Report
**Author**: Explorer 3 (`teamwork_preview_explorer_survey_r2_3`)  
**Scope**: 7 Pages in `src/app/`, Component Hierarchy, Data Flow & State Hooks, 80 Existing Tests Preservation  
**Date**: 2026-09-20T01:50:00Z  

---

## 1. Observation

### 1.1 Test Suite Inventory & Execution Engine
Running `npm test` triggers `node tests/runner.mjs`. The runner executes Node.js's native test runner with `--experimental-strip-types`, `--loader ./tests/loader.mjs`, and `--test`.
```
ℹ tests 80
ℹ suites 0
ℹ pass 80
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms ~450ms
```
The 80 test results comprise 8 top-level test suites containing 72 individual subtests:

| Test File | Subtests | Core Focus | Direct UI / DOM Assertions |
|---|---|---|---|
| `tests/boundaries.test.ts` | 8 | Patch limits (0 to 3 ops), cycle rejection, mastery numeric clamping [0, 1], unknown/duplicate IDs, storage fallback in Node | Yes: `TC-BND-08` verifies storage fallback when `window` is `undefined` |
| `tests/dagValidator.test.ts` | 11 | Linear, diamond, confluence DAGs, cycle detection, self-loops, disconnected subgraphs, fixture validation | No: pure domain logic |
| `tests/interactions.test.ts` | 8 | `BlockRenderer`, `MasteryRing`, `MasteryBar`, `RoadmapGraph` rendered via `ReactDOMServer.renderToStaticMarkup` | **YES (CRITICAL)**: Asserts exact CSS variables, classes, tags, and strings |
| `tests/mastery.test.ts` | 9 | Bayesian Knowledge Tracing (BKT), alpha attenuation, penalties on difficulty ≥ 3, misconception tracking, `shouldAdapt` | No: pure domain logic |
| `tests/patchEngine.test.ts` | 14 | 3-op limit, 8 patch types (`addConcept`, `insertLesson`, `replaceBlock`, `insertBlock`, `addPractice`, `markSkippable`, `reorder`, `replaceQuestion`, `refreshResources`, `deleteLesson`), inverse generation, undo | No: pure domain logic |
| `tests/regressions.test.ts` | 11 | `PatchEngineError` constructor, completed lesson protection, cycle detection draft isolation, deep undo, store idempotency, SSR storage safety, demo preview mode, missing lesson fallback | **YES**: `TC-REG-08` (SSR storage safety), `TC-REG-09` (demo mode), `TC-REG-10` (missing lesson fallback), `TC-REG-11` (StateStorage) |
| `tests/store.test.ts` | 7 | Zustand store slices (`course`, `learner`, `latestError`, `isBuilding`, `buildStep`), actions (`completeLesson`, `updateMastery`, `applyPatch`, `undo`, `reset`) | No: state logic |
| `tests/workflows.test.ts` | 4 | PCB Design fixture integrity, quiz-to-mastery lifecycle, remedial patch & undo, localStorage serialization | No: state & domain workflows |

#### Verbatim Static Markup Assertions in `tests/interactions.test.ts` (Must Be Preserved)
1. **`BlockRenderer` (`TC-INT-01`)**:
   - Renders `markdown`: must produce `<h2>Heading 2</h2>` and `<strong>bold</strong>`.
   - Flag button (when `onFlag` passed): must include `"Flag this block"` and `"⚑"`.
2. **`BlockRenderer` (`TC-INT-02`)**:
   - Renders `workedExample`: must include title, `"Step 1"`, `"Step 2"`, `"Step 3"`, step text, and explanation why (`"Ohm’s law applies to the resistor"`).
3. **`BlockRenderer` (`TC-INT-03`)**:
   - Callouts must contain classes and emojis:
     - `kind: 'mistake'` → class `"block-callout mistake"`, icon `"⚠"`
     - `kind: 'tip'` → class `"block-callout tip"`, icon `"💡"`
     - `kind: 'warning'` → class `"block-callout warning"`, icon `"🔔"`
4. **`BlockRenderer` (`TC-INT-04`)**:
   - Checkpoint must include question, `"Reveal answer"`, and `"Hint: Think of a diode like a one-way check valve."`.
5. **`MasteryRing` (`TC-INT-05`)**:
   - Untouched (0%): SVG with `width="60"`, `height="60"`, `var(--mastery-untouched)`, `0%`, `stroke-dasharray="0 169.64600329384882"`.
   - Weak (40%): `var(--mastery-weak)`, `40%`.
   - OK (75%): `var(--mastery-ok)`, `75%`.
   - Solid (95%): `var(--mastery-solid)`, and custom label string if provided.
6. **`MasteryBar` (`TC-INT-06`)**:
   - Must render concept name, `width:65%` (style attribute), `var(--mastery-ok)`, and percentage text `65%`.
7. **`RoadmapGraph` (`TC-INT-07`)**:
   - SVG element with `class="roadmap-svg"`.
   - Marker with `id="arrowhead"`.
   - Module titles: `"Electronics Foundations"`, `"Schematic Design"`, `"PCB Layout"`, `"Fabrication &amp; First Board"`.
   - Lesson titles truncated: `"Voltage, Current"`.
   - Connecting edges with `marker-end="url(#arrowhead)"`.
8. **`RoadmapGraph` (`TC-INT-08`)**:
   - Skippable indicator: `"skip ✓"`.

#### Verbatim Assertions in `tests/regressions.test.ts`
- **`TC-REG-09` (Demo mode preview)**:
  `localStorage.setItem('anylearn-demo-mode', 'true')`, loads `pcbCourseFixture`, destination `/roadmap`.
- **`TC-REG-10` (Missing lesson fallback)**:
  When `currentCourse` is loaded but `lessonID` does not exist in `currentCourse.lessons`: renders status `not_found` with `"Lesson not found"` message and `"Return to Roadmap"` button.
- **`TC-REG-08` (SSR safety)**:
  No direct access to `sessionStorage` or `localStorage` during initial render / SSR without checking `typeof window !== 'undefined'`.

---

### 1.2 Inspection of All 7 Pages in `src/app/`

#### Page 1: Landing Page (`/` — `src/app/page.tsx`)
- **Current Lines**: 30 lines.
- **Current Behavior**: Redirect stub that uses `useEffect` and `setTimeout(..., 100)`: if `course` exists in Zustand, redirects to `/roadmap`, else redirects to `/goal`.
- **Current Hooks**:
  - `useRouter()` (`next/navigation`)
  - `useStore(s => s.course)`
- **Required Dei Redesign**:
  - **Black shell hero**: Deep black background (`#0A0A0A`) with subtle radial glow / ambient accents.
  - **Giant headline with 3D emoji**: E.g. `AnyLearn 🧠` or `Learn Anything From Zero 🎓` in Outfit / Plus Jakarta Sans bold geometric typography.
  - **Pastel card collage**: Tilted, overlapping preview cards highlighting features (mint `#CFF7D3`, lavender `#F1D3FA`, butter `#FBE8B0`, sky `#D5F1F7`, pink `#FF8FC7`).
  - **Black pill CTA**: Primary button (e.g. `"Start Learning 🚀"`) navigating to `/goal`, plus a secondary pill (e.g. `"Resume Course →"`) if `course` is already active in store.
  - **Test Preservation**: No test calls `/` directly. Existing routing logic can be preserved by routing the CTA to `/goal` or `/roadmap`.

#### Page 2: Goal Input Page (`/goal` — `src/app/goal/page.tsx`)
- **Current Lines**: 166 lines.
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const [goal, setGoal] = useState('')`
  - `const [artifact, setArtifact] = useState('')`
  - `const [hours, setHours] = useState(5)`
  - `const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)`
  - `const [showModalOverride, setShowModalOverride] = useState<boolean | null>(null)`
  - `const showModal = mounted && (showModalOverride ?? !ApiKeyStore.has())`
  - `const canSubmit = goal.trim().length >= 8`
- **Data Flow & Storage**:
  - Sets `sessionStorage.setItem('anylearn-goal', goal.trim())`
  - Sets `sessionStorage.setItem('anylearn-artifact', artifact || 'Working prototype')`
  - Sets `sessionStorage.setItem('anylearn-hours', String(hours))`
  - Clears `localStorage.removeItem('anylearn-demo-mode')`
  - Navigates via `router.push('/build')`
- **DOM IDs**:
  - `id="goal-input"` (textarea)
  - `id="build-course-btn"` (primary action button)
  - `id="example-..."` (goal chip buttons)
  - `id="artifact-..."` (end artifact chip buttons)
  - `id="hours-..."` (hours chip buttons)
- **Required Dei Redesign**:
  - **Centered mint/lavender card**: Card with pastel background (`#CFF7D3` mint or `#F1D3FA` lavender) or double-layered pastel card.
  - **Large textarea / search-bar style**: Prominent rounded search-style input container.
  - **Emoji suggestion chips**: Mandatory chips including 🧬 Biology, 💻 Python, 🎸 Guitar, alongside existing topics (PCB design, Rust, etc.).
  - **Black CTA button**: High-contrast black pill button (`#0A0A0A`) with white text and hover lift.
  - **Calibration section**: Refactored into pastel badge chips with smooth transitions.
  - **Modal Integration**: When `showModal` is active, displays `ApiKeyModal` with blurred backdrop and white rounded card.

#### Page 3: Build Stepper Page (`/build` — `src/app/build/page.tsx`)
- **Current Lines**: 210 lines.
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const setCourse = useStore(s => s.setCourse)`
  - `const [currentStep, setCurrentStep] = useState(0)`
  - `const [error, setError] = useState('')`
  - `const [dots, setDots] = useState('')`
  - `const [goalSummary, setGoalSummary] = useState('')`
  - `const abortRef = useRef(false)`
- **Data Flow & Async Pipeline**:
  - Reads `anylearn-goal`, `anylearn-artifact`, `anylearn-hours` from `sessionStorage` in `useEffect`. If missing, replaces route to `/goal`.
  - Step 1: Constructs learner profile.
  - Step 2: `Prompts.conceptGraph(...)` → `generate<{ concepts: Concept[] }>`.
  - Step 3: `Prompts.curriculum(...)` → `generate<{ modules, lessons, capstone }>`.
  - Step 4: Sourcing external links.
  - Step 5: Assembles full `Course` object, calls `setCourse(course)`, waits 600ms, and pushes `router.push('/roadmap')`.
- **Required Dei Redesign**:
  - **Vertical stepper of pastel cards**:
    1. Understanding goal 🎯
    2. Mapping concepts 🗺️
    3. Writing lessons 📝
    4. Building quizzes 🧠
  - **Card states**:
    - **Active card**: Tilted (~-4° rotate), elevated shadow, active spinner.
    - **Completed card**: Displays `"Completed 👏"` mint pill badge.
    - **Pending card**: Subtle dashed border (`border-dashed border-2`), muted tone.
  - **Error handling**: Pastel error card with retry button returning to `/goal`.

#### Page 4: Interactive Roadmap (`/roadmap` — `src/app/roadmap/page.tsx`)
- **Current Lines**: 298 lines.
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const course = useStore(s => s.course)`
  - `const learner = useStore(s => s.learner)`
  - `const reset = useStore(s => s.reset)`
  - `const [selectedID, setSelectedID] = useState<string | null>(null)`
  - `const [showChangelog, setShowChangelog] = useState(false)`
  - `const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)`
- **Data Flow & Calculations**:
  - Computes progress percentage: `(completedLessons / totalLessons) * 100`.
  - Computes average mastery: `mean(Object.values(learner.mastery).map(r => r.probability))`.
  - Derives `nextLesson`: First uncompleted, non-skippable lesson.
  - Derives `recentChanges`: Filter active changes from `course.changelog`.
  - Evaluates `isCourseComplete`: Checks capstone readiness.
- **DOM IDs & Elements**:
  - `RoadmapGraph` with `course`, `learner`, `selectedID`, `onSelect`
  - `id="changelog-btn"`
  - `id="next-lesson-btn"`
  - `id="capstone-card"`
  - `id="open-lesson-${selectedLesson.id}"`
- **Required Dei Redesign**:
  - **Two-column layout**:
    - **Left column**: SVG DAG with pastel card nodes linked by dashed green connectors.
      - Locked nodes display lock icon 🔒.
      - Current / selected node is a tilted lavender featured card.
      - **Stat trio at top**: Total / Completed / Upcoming in rounded pastel cards.
      - Spring pop-in animation on new node insertion via Framer Motion.
    - **Right column**: "My Events"-style sidebar for node details, lesson objectives, and next tasks.
  - **Bottom Floating Toolbar**: Render black pill toolbar with colorful circular tool buttons.

#### Page 5: Lesson Reader (`/lesson/[id]` — `src/app/lesson/[id]/page.tsx`)
- **Current Lines**: 283 lines.
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const params = useParams()` where `lessonID = params.id as string`
  - `const course = useStore(s => s.course)`
  - `const learner = useStore(s => s.learner)`
  - `const setCourse = useStore(s => s.setCourse)`
  - `const completeLesson = useStore(s => s.completeLesson)`
  - `const [generating, setGenerating] = useState(false)`
  - `const [error, setError] = useState('')`
  - `const [notice, setNotice] = useState('')`
- **Data Flow & Fallbacks**:
  - If `course && !lesson`: Renders `"Lesson not found"` with `"Return to Roadmap"` button (critical for `TC-REG-10`).
  - If `!course || !lesson`: Renders loading spinner.
  - If `lesson.status === 'stub'`: Triggers LLM generation for lesson content + quiz questions.
  - Renders blocks via `<BlockRenderer block={block} onFlag={id => router.push('/report/' + lessonID + '?blockId=' + id)} />`.
- **DOM IDs**:
  - `id="report-fix-btn"` (navigates to `/report/${lessonID}`)
  - `id="take-quiz-btn"` (navigates to `/quiz/${lessonID}`)
- **Required Dei Redesign**:
  - **Block cards by type**:
    - `markdown` / text block → White card (`#FFFFFF`) with bold typography.
    - `video` block → Lavender card (`#F1D3FA`) with large circular play button.
    - `diagram` block → Sky blue card (`#D5F1F7`).
    - `callout` (tip) → Butter yellow card (`#FBE8B0`).
    - `callout` (key idea / solid) → Mint green card (`#CFF7D3`).
  - **Progress pill**: Floating or header pill tracking completion progress.
  - **Sidebar**: Sticky sidebar with `MasteryRing` (thick pastel gradient ring) and next lesson shortcut.

#### Page 6: Quiz Evaluation (`/quiz/[lessonId]` — `src/app/quiz/[lessonId]/page.tsx`)
- **Current Lines**: 436 lines.
- **Exported Function**:
  - `export function createRemedialPatch(course: Course, lesson: Lesson, weakConcepts: string[]): RoadmapPatch` (Preserve exact signature and behavior).
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const params = useParams()` where `lessonID = params.lessonId as string`
  - `const course = useStore(s => s.course)`
  - `const learner = useStore(s => s.learner)`
  - `const updateMastery = useStore(s => s.updateMastery)`
  - `const [step, setStep] = useState(0)`
  - `const [selected, setSelected] = useState<QuestionOption | null>(null)`
  - `const [answered, setAnswered] = useState(false)`
  - `const [results, setResults] = useState<Array<{ question; option; correct }>>([])`
  - `const [showSummary, setShowSummary] = useState(false)`
  - `const [adaptationState, setAdaptationState] = useState<{ status; summary?; error? }>`
  - `const adaptationTriggeredRef = useRef(false)`
- **Data Flow & Adaptive Progression**:
  - Upon selecting and confirming an option:
    - Calls `updateMastery(question, selectedOption)` (updates BKT probabilities and attempts).
    - Sets `answered = true` to reveal explanation.
  - On the final question:
    - Calls `completeLesson(lessonID)`.
    - Sets `showSummary = true`.
    - Automatically checks `Mastery.shouldAdapt(...)` on weak concepts. If triggered, applies remedial patch via `useStore.getState().applyPatch(patch, 'adapt', reason)`.
- **DOM IDs**:
  - `id={`option-${i + 1}`}`
  - `id="confirm-answer-btn"`
  - `id="next-question-btn"`
- **Required Dei Redesign**:
  - **One question per large card**: Expansive pastel/off-white card with clean spacing.
  - **Option pills**: Large rounded pill buttons with hover states.
  - **Feedback styling**:
    - Correct answer: Mint `#CFF7D3` background with ✅ checkmark.
    - Incorrect answer: Soft red `#FEE2E2` background with ❌, plus an explanation card in Butter `#FBE8B0`.
  - **Confetti result screen**: High-energy confetti 🎉 animation on completion (using lightweight SVG/canvas particles or Framer Motion variants).

#### Page 7: Report / AI Patching (`/report/[lessonId]` — `src/app/report/[lessonId]/page.tsx`)
- **Current Lines**: 432 lines.
- **Exported Function**:
  - `export function constructAfterLesson(lesson: Lesson, patchOps: PatchOp[], lessonID: string): Lesson` (Preserve exact signature and logic).
- **Current State & Hooks**:
  - `const router = useRouter()`
  - `const params = useParams()` where `lessonID = params.lessonId as string`
  - `const searchParams = useSearchParams()`, `blockId = searchParams.get('blockId')`
  - `const course = useStore(s => s.course)`
  - `const learner = useStore(s => s.learner)`
  - `const applyPatch = useStore(s => s.applyPatch)`
  - `const [selectedType, setSelectedType] = useState('')`
  - `const [freeText, setFreeText] = useState('')`
  - `const [step, setStep] = useState<'input' | 'loading' | 'result'>('input')`
  - Wrapped in `<Suspense>` for App Router search params safety.
- **Data Flow & Diagnosis Engine**:
  - `Prompts.diagnoseAndFix(...)` → `generate<FixPlan>`
  - `constructAfterLesson(...)` builds virtual after-lesson.
  - `Prompts.verify(...)` → `generate<VerifyResult>`
  - If verdict is `'pass'`, calls `applyPatch(plan.patch, 'report', plan.learnerFacingMessage, vResult)`.
- **DOM IDs**:
  - `id={`report-type-${rt.id}`}`
  - `id="submit-report-btn"`
- **Required Dei Redesign**:
  - **Split layout**:
    - **Left column**: Interactive report category selection & free-text input form.
    - **Right column**: `DiffView` component rendering removed lines in red tint and inserted lines in mint tint (`#CFF7D3`).
  - **Animated "AI patching 🔧" pill**: Floating animated pill badge during the 10–20 second diagnostic/verification stage.
  - **"Fixed ✨" badge**: High-visibility celebration badge on successful patch verification and application.

---

## 2. Logic Chain

### 2.1 Preserving Business Logic While Completely Transforming the UI Layer
1. **Fact**: All 80 unit and regression tests in `tests/` operate on the store (`src/lib/store.ts`), domain models (`src/lib/models.ts`), engines (`patchEngine.ts`, `mastery.ts`, `dagValidator.ts`), and static SSR renders of components (`BlockRenderer.tsx`, `MasteryRing.tsx`, `RoadmapGraph.tsx`).
2. **Deduction**: The page redesign in `src/app/` is strictly presentation-tier. If all exported helpers (`createRemedialPatch`, `constructAfterLesson`), state subscriptions (`useStore`), route parameter names (`params.id`, `params.lessonId`), URL search parameter handling (`searchParams.get('blockId')`), and element IDs (`id="goal-input"`, `id="build-course-btn"`, `id="confirm-answer-btn"`, etc.) are preserved, the underlying state machines will function identically without regressions.
3. **Deduction on Test Preservation**: In `tests/interactions.test.ts`, static HTML strings are checked directly (`var(--mastery-ok)`, `block-callout mistake`, `Reveal answer`, `skip ✓`, `roadmap-svg`, `id="arrowhead"`). Therefore, redesigning `BlockRenderer`, `MasteryRing`, and `RoadmapGraph` requires maintaining these specific CSS variables, classes, and attributes alongside any Tailwind v4 utility classes.

### 2.2 Reconciling New Dei Requirements with App Architecture
1. **Fact**: `ORIGINAL_REQUEST.md` mandates Tailwind CSS v4, Framer Motion, 3D emojis, floating bottom toolbar, black shell layout, and pastel card styling.
2. **Deduction**: The layout shell (`src/app/layout.tsx`) must provide:
   - The persistent black top bar (`#0A0A0A`) with "AnyLearn" wordmark, icon-only navigation with a curved active notch, and profile avatar.
   - The off-white inner content panel (`#F7F7F7`) with 40px radius.
   - The floating black bottom toolbar with circular colorful tool buttons.
3. **Deduction on Component Upgrades**:
   - `MasteryRing`: Must preserve its SVG geometry and `var(--mastery-...)` variables to pass `TC-INT-05`, while gaining an optional outer pastel gradient glow and 100% celebration state.
   - `DiffView`: Must be created as a new dedicated component in `src/components/DiffView.tsx` accepting `before` and `after` blocks or patch ops, rendering diff lines with `#FEE2E2` and `#CFF7D3` backgrounds.
   - `ApiKeyModal`: Must maintain `#api-key-input`, `#save-api-key-btn`, `#preview-mode-btn`, and the `anylearn-demo-mode` flag handling (tested in `TC-REG-09`), styled with blurred backdrop, white rounded card, masked input, and "Use Demo Mode 🚀" mint button.

---

## 3. Caveats

1. **Node `--test` SSR Environment**:
   - The test runner runs via Node.js with a custom TypeScript loader (`tests/loader.mjs`). Any components imported by test files (`BlockRenderer`, `MasteryRing`, `RoadmapGraph`) MUST be able to execute in a headless server environment without accessing `window`, `document`, or `sessionStorage` at module evaluation time.
   - If Framer Motion's `motion` elements are used inside `BlockRenderer` or `MasteryRing`, ensure they do not crash during `ReactDOMServer.renderToStaticMarkup`. (In modern Framer Motion, `motion.*` renders standard HTML tags on the server, but must not rely on browser-only layout effects).
2. **Next.js 16 App Router Dynamic Route Constraints**:
   - In Next.js 16, page route params in App Router may be provided as asynchronous promises in server components, but since all 7 pages are marked `'use client'`, `useParams()` and `useSearchParams()` from `next/navigation` remain synchronous hooks.
   - `useSearchParams()` in `src/app/report/[lessonId]/page.tsx` MUST remain wrapped in `<Suspense>` to prevent client bailout warnings during `npm run build`.
3. **Color Contrast & Accessibility (WCAG AA)**:
   - When using pastel backgrounds (mint `#CFF7D3`, lavender `#F1D3FA`, butter `#FBE8B0`, sky `#D5F1F7`), text placed directly on the background must use high-contrast dark colors (e.g. `#0A0A0A` or `#1E293B`) rather than white or light gray to satisfy WCAG AA 4.5:1 contrast requirements.

---

## 4. Conclusion

The AnyLearn application has a robust, clean domain engine and state management architecture with 100% passing tests (80/80). All 7 pages in `src/app/` are ready for visual transformation to the Dei reference design.

### Summary of Redesign Blueprints per Page

| Route | Primary Visual Shift | Critical Functional Contracts to Preserve |
|---|---|---|
| `/` | From redirector to landing hero: Black shell, 3D emoji headline, tilted pastel collage, black pill CTA | Navigate CTA to `/goal` (or `/roadmap` if course loaded) |
| `/goal` | Centered mint/lavender card, search-bar textarea, 🧬/💻/🎸 chips, black CTA | Preserves `anylearn-goal`, `anylearn-artifact`, `anylearn-hours` in `sessionStorage`, `#goal-input`, `#build-course-btn` |
| `/build` | 4-step vertical stepper of pastel cards, active card tilted with spinner, "Completed 👏" mint pill, dashed pending | Preserves async LLM generation pipeline, error retry, `setCourse(course)`, push to `/roadmap` |
| `/roadmap` | Two-column layout: Left SVG DAG with pastel cards, dashed green connectors, locked icons, current node tilted lavender, stat trio; Right "My Events" sidebar; spring pop-in | Preserves `RoadmapGraph` SVG structure (`roadmap-svg`, `arrowhead`, `skip ✓`), `#next-lesson-btn`, `#changelog-btn`, changelog undo |
| `/lesson/[id]` | Pastel cards by block type (white, lavender+play, sky, butter, mint), progress pill + mastery sidebar | Preserves `BlockRenderer` markup contracts (`block-callout mistake`, `⚠`, `Reveal answer`), `#report-fix-btn`, `#take-quiz-btn`, missing lesson fallback (`TC-REG-10`) |
| `/quiz/[lessonId]` | One question per large card, option pills, mint+✅, soft red+❌+butter card, confetti 🎉 result screen | Preserves `createRemedialPatch` export, `updateMastery`, `completeLesson`, adaptive patch generation, option buttons |
| `/report/[lessonId]` | Split view: Report form left, `DiffView` right (red/mint tinted lines), animated "AI patching 🔧" pill, "Fixed ✨" badge | Preserves `constructAfterLesson` export, `<Suspense>`, diagnosis/verification flow, `applyPatch` |

---

## 5. Verification Method

To independently verify the findings and ensure zero regressions during and after the frontend redesign:

1. **Unit & Logic Tests**:
   ```bash
   npm test
   ```
   *Expected output*: `ℹ tests 80`, `ℹ pass 80`, `ℹ fail 0`. Must pass completely with zero failures.

2. **Static Markup & Component Integrity Inspection**:
   Run the interaction test suite directly to check HTML markup contracts:
   ```bash
   node --experimental-strip-types --loader ./tests/loader.mjs --test tests/interactions.test.ts
   ```
   *Expected output*: All 8 subtests in `interactions.test.ts` pass, validating `BlockRenderer`, `MasteryRing`, `MasteryBar`, and `RoadmapGraph`.

3. **Production Build & TypeScript Verification**:
   ```bash
   npm run build
   ```
   *Expected output*: Turbopack compiles successfully, 0 TypeScript errors, all 7 routes properly generated (`/`, `/build`, `/goal`, `/roadmap` static; `/lesson/[id]`, `/quiz/[lessonId]`, `/report/[lessonId]` dynamic).
