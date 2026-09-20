# Component Library & Motion Architecture Survey Report
**Project**: AnyLearn Frontend Redesign (Dei Reference Design)  
**Author**: Explorer 2 (`teamwork_preview_explorer_survey_r2_2`)  
**Date**: 2026-09-20T01:52:00Z  
**Target Milestone**: Survey R2 — Component Library & Motion  

---

## 1. Observation

### 1.1 Project Setup & Dependencies
- `package.json` (lines 12–27) indicates Next.js `16.3.5`, React `19.2.8`, React DOM `19.2.8`, Zustand `^5.0.15`, React Markdown `^10.1.0`, and Mermaid `^12.0.0`.
- Neither `tailwindcss` nor `framer-motion` / `motion` is currently present in `package.json`.
- `public/` directory currently contains only standard Next.js template SVGs (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`). The folder `/public/assets/` does not exist yet.
- Execution of `npm test` runs `node tests/runner.mjs` and executes 80 tests across 8 test suites (`boundaries.test.ts`, `dagValidator.test.ts`, `interactions.test.ts`, `mastery.test.ts`, `patchEngine.test.ts`, `regressions.test.ts`, `store.test.ts`, `workflows.test.ts`), with 80 passing, 0 failing.
- Execution of `npm run build` runs `node node_modules/next/dist/bin/next build` (Next.js 16.3.5 Turbopack), compiling 7 routes successfully in ~556ms.

### 1.2 Existing Components in `src/components/`
Directory inspection of `src/components/` revealed exactly 4 files:
1. `src/components/MasteryRing.tsx` (101 lines):
   - Exports `MasteryRing({ probability, size = 48, strokeWidth = 4, label }: MasteryRingProps)` and `MasteryBar({ probability, conceptName }: MasteryBarProps)`.
   - Uses SVG circle elements with radius `(size - strokeWidth) / 2` and `strokeDasharray={`${dash} ${circumference}`}`.
   - Computes color tier via:
     - `probability === 0`: `var(--mastery-untouched)`
     - `probability < 0.5`: `var(--mastery-weak)`
     - `probability < 0.8`: `var(--mastery-ok)`
     - `else`: `var(--mastery-solid)`
   - Displays label text if passed; otherwise `{Math.round(probability * 100)}%`.
2. `src/components/ApiKeyModal.tsx` (161 lines):
   - Exports `ApiKeyModal({ onReady }: ApiKeyModalProps)`.
   - Validates key format (`sk-` or `AIza`, length >= 10).
   - Contains input with `id="api-key-input"`, save button with `id="save-api-key-btn"`, and preview button with `id="preview-mode-btn"`.
   - On preview click, executes `localStorage.setItem('anylearn-demo-mode', 'true')`, sets `useStore.getState().setCourse(pcbCourseFixture)`, calls `onReady()`, and calls `router.push('/roadmap')`.
3. `src/components/RoadmapGraph.tsx` (257 lines):
   - Exports `RoadmapGraph({ course, learner, selectedID, onSelect }: RoadmapGraphProps)`.
   - Implements SVG canvas with pan drag (`pan` state, `onMouseDown`, `onMouseMove`, `onMouseUp`, `onTouchStart`, `onTouchMove`, `onTouchEnd`).
   - Generates DAG layout via `layoutGraph(course, learner)` with module grouping rects and bezier curve `<path>` edges terminating with `markerEnd="url(#arrowhead)"`.
   - Renders node `<rect>` with `className={`node-rect ${masteryClass} ${isSelected ? 'selected' : ''} ${node.skippable ? 'skippable' : ''}`}`.
4. `src/components/BlockRenderer.tsx` (128 lines):
   - Exports `BlockRenderer({ block, onFlag }: Props)`.
   - Switches over `block.type`:
     - `'markdown'` -> `MarkdownBlock` (renders ReactMarkdown, displays `⚑` button with `title="Flag this block"` when `onFlag` is provided).
     - `'workedExample'` -> `WorkedExampleBlock` (collapsible, displays `Step 1`, `Step 2`..., step `text`, and `Why` step explanation).
     - `'callout'` -> `CalloutBlock` (maps kind to icon: mistake `⚠`, tip `💡`, warning `🔔`, with `className={`block-callout ${block.kind}`}`).
     - `'checkpoint'` -> `CheckpointBlock` (shows question `✏`, 'Reveal answer' toggle button, and hint).
     - `'diagram'` -> `DiagramBlock` (displays Mermaid diagram text and optional caption).
5. `DiffView.tsx`:
   - Grep search for `DiffView` across `src/` yielded **0 results**.
   - `src/app/report/[lessonId]/page.tsx` currently renders a simple vertical card list of patch operations (`op.type`, `op.reason`) without a diff component.

### 1.3 Strict Test Assertions in `tests/interactions.test.ts`
`tests/interactions.test.ts` uses `ReactDOMServer.renderToStaticMarkup` directly against `BlockRenderer`, `MasteryRing`, `MasteryBar`, and `RoadmapGraph`. The assertions require:
- `TC-INT-01`: `<h2>Heading 2</h2>`, `<strong>bold</strong>`, `Flag this block`, `⚑`.
- `TC-INT-02`: `Calculate Resistor Value for 5V to 2V LED`, `Step 1`, `Step 2`, `Step 3`, `Voltage drop across resistor = 5V - 2V = 3V`, `Ohm’s law applies to the resistor`, `150 Ohms`.
- `TC-INT-03`: `block-callout mistake`, `⚠`, `block-callout tip`, `💡`, `block-callout warning`, `🔔`.
- `TC-INT-04`: `What happens if you reverse the polarity of a diode?`, `Reveal answer`, `Hint: Think of a diode like a one-way check valve.`.
- `TC-INT-05`: `width="60"`, `height="60"`, `var(--mastery-untouched)`, `0%`, `stroke-dasharray="0 169.64600329384882"`, `var(--mastery-weak)`, `40%`, `var(--mastery-ok)`, `75%`, `var(--mastery-solid)`, `MASTER`.
- `TC-INT-06`: `Kirchhoff’s Current Law`, `width:65%`, `var(--mastery-ok)`, `65%`.
- `TC-INT-07`: `<svg`, `class="roadmap-svg"`, `id="arrowhead"`, `Electronics Foundations`, `Schematic Design`, `PCB Layout`, `Fabrication &amp; First Board`, `Voltage, Current`, `marker-end="url(#arrowhead)"`.
- `TC-INT-08`: `skip ✓`.

### 1.4 State Store Interactions in `src/lib/store.ts`
- State fields: `course: Course | null`, `learner: LearnerState`, `latestError: string | null`, `isBuilding: boolean`, `buildStep: string`.
- Mutators / Actions:
  - `setCourse`: updates active course.
  - `setLearner`: updates learner state.
  - `updateMastery(question, option)`: updates probability and logs attempt record.
  - `completeLesson(lessonID)`: idempotent append to `completedLessonIDs`.
  - `applyPatch(patch, source, reason, verify)`: validates via `patchEngine`, computes inverse ops, writes to `changelog`.
  - `undo(entryID)`: inverts patch from `changelog` and updates undone flag.
  - `reset()`: clears course, resets learner to default, removes `anylearn-demo-mode` from `localStorage`.

---

## 2. Logic Chain

### 2.1 Preserving Existing Test Contracts During Redesign
1. *From 1.3*: `tests/interactions.test.ts` asserts verbatim HTML strings, CSS class names (`block-callout tip`, `roadmap-svg`), marker IDs (`id="arrowhead"`), and CSS variables (`var(--mastery-untouched)`, `var(--mastery-solid)`).
2. If restyled components drop these classes, attributes, or variable references, `npm test` will fail, violating AC-2 ("all 80 existing tests pass").
3. *Inference*: The restyled components must retain these class hooks and CSS variable linkages as base or fallback values, while layering Tailwind v4 utility tokens and Framer Motion wrappers on top.

### 2.2 Rebuilding Existing Components to Dei Specifications

#### A. `MasteryRing.tsx`
- **Spec**: Thick ring, pastel gradient, percent + emoji at 100%.
- **Implementation Design**:
  - Increase default `strokeWidth` from 4 to 8 (or make it proportionally 12–15% of `size`). Ensure explicit prop overrides (`strokeWidth={6}` in `TC-INT-05`) remain respected.
  - SVG linear gradient: Add `<defs><linearGradient id="pastelMasteryGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--mastery-start, #CFF7D3)" /><stop offset="100%" stopColor="var(--mastery-end, #D5F1F7)" /></linearGradient></defs>`.
  - Color determination: Retain the exact fallback CSS variables (`var(--mastery-untouched)`, `var(--mastery-weak)`, etc.) on the SVG circle `stroke` attribute so `interactions.test.ts` matches verbatim. Define these CSS variables in `globals.css` with pastel tokens (e.g., `--mastery-solid: #CFF7D3`, `--mastery-ok: #D5F1F7`, `--mastery-weak: #FBE8B0`, `--mastery-untouched: #E5E7EB`).
  - 100% State: When `Math.round(probability * 100) === 100` (and no custom label prop override is given), render `100% 🎓` or `100% 👏`. When `label` is provided (e.g. `label: 'MASTER'`), render `{label}` directly.

#### B. `ApiKeyModal.tsx`
- **Spec**: Blurred backdrop, white rounded card, masked input, "Use Demo Mode 🚀" mint button, 🔒 helper text.
- **Implementation Design**:
  - Backdrop: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4`.
  - Card: White rounded surface `bg-white text-black rounded-[32px] p-8 shadow-2xl max-w-lg w-full border border-black/5`.
  - Key Input: Retain `id="api-key-input"`, `type="password"`, `placeholder="sk-..."`, styled with `bg-[#F7F7F7] border border-black/10 rounded-2xl px-4 py-3 text-black`.
  - Helper text: `🔒 Stored locally in your browser. Never sent to our servers.`
  - Action buttons:
    - Primary CTA: `id="save-api-key-btn"` styled as black pill `bg-black text-white font-semibold rounded-full py-3.5 px-6 hover:bg-black/90 active:scale-[0.98]`.
    - Demo CTA: `id="preview-mode-btn"` styled as mint pill `bg-mint text-black font-semibold rounded-full py-3.5 px-6 hover:brightness-95 active:scale-[0.98]`, label: `Use Demo Mode 🚀 (Preview PCB Design)`.

#### C. `RoadmapGraph.tsx`
- **Spec**: SVG DAG pastel cards, dashed green connectors, locked nodes lock icon, tilted lavender featured card, pan/touch support, spring pop-in on new nodes.
- **Implementation Design**:
  - Container: Preserve `<svg className="roadmap-svg" ...>` with full touch/mouse pan handlers (`pan`, `dragging`, `dragStart`).
  - Modules: Soft rounded boundaries `rx={20}` with subtle border `stroke="rgba(0,0,0,0.06)"`, fill `rgba(255,255,255,0.4)`, and bold module header.
  - Connectors / Edges: Retain `id="arrowhead"` and `marker-end="url(#arrowhead)"`. Style paths with dashed green stroke: `stroke="#10B981"`, `strokeDasharray="6 4"`, `strokeWidth={2}`.
  - Node Cards:
    - Shape: SVG rect with `rx={16}` or HTML pastel card inside `<foreignObject>`.
    - Colors by status:
      - Completed: Mint card (`#CFF7D3`) with checkmark badge.
      - Current / Active: Lavender card (`#F1D3FA`), tilted by ~-4° (`transform="rotate(-4 cx cy)"`), bold border.
      - Locked / Upcoming: Off-white / light grey card (`#F0F0F0`) with 🔒 lock icon.
      - Skippable: Soft butter tint (`#FBE8B0`) with `skip ✓`.
  - Interaction: Node click fires `onSelect(node.id)`.

#### D. `BlockRenderer.tsx`
- **Spec**: Pastel card by type (text=white, video=lavender+play button, diagram=sky, tip=butter, key idea=mint).
- **Implementation Design**:
  - Text / Markdown (`type === 'markdown'`): White card `bg-white rounded-3xl p-6 border border-black/5 shadow-sm`, rich typography, subtle flag button with `title="Flag this block"` and `⚑`.
  - Video (`block.type === 'workedExample'` or video resource): Lavender card `bg-lavender text-black rounded-3xl p-6 shadow-sm` with a large 52px circular play button and step breakdown.
  - Diagram (`type === 'diagram'`): Sky card `bg-sky text-black rounded-3xl p-6 shadow-sm` with clean monospace diagram display.
  - Tip (`type === 'callout' && kind === 'tip'`): Butter card `bg-butter text-black rounded-3xl p-6 shadow-sm` with `💡` icon. Retain `block-callout tip` in class name.
  - Mistake (`type === 'callout' && kind === 'mistake'`): Soft red/butter card with `⚠` icon. Retain `block-callout mistake`.
  - Warning (`type === 'callout' && kind === 'warning'`): Soft amber card with `🔔` icon. Retain `block-callout warning`.
  - Key Idea / Checkpoint (`type === 'checkpoint'`): Mint card `bg-mint text-black rounded-3xl p-6 shadow-sm`, interactive 'Reveal answer' toggle and hint.

#### E. `DiffView.tsx` (New Component Creation)
- **Spec**: Red-tinted removed lines, mint-tinted added lines, animated "AI patching 🔧" pill, "Fixed ✨" badge on completion.
- **Location**: `src/components/DiffView.tsx`.
- **Props**:
  ```ts
  export interface DiffViewProps {
    beforeLesson?: Lesson;
    afterLesson?: Lesson;
    patch?: RoadmapPatch;
    status?: 'idle' | 'patching' | 'verified' | 'failed';
    claimsChecked?: string[];
  }
  ```
- **Structure**:
  - Outer card: `bg-white rounded-3xl p-6 border border-black/5 shadow-sm flex flex-col h-full`.
  - Header: Title "AI Patch & Verification", status pill ("AI patching 🔧" with animated spin/pulse, or "Fixed ✨" mint pill, or "Failed ❌" red pill).
  - Diff block:
    - Removed lines: `bg-red-50 text-red-900 border-l-4 border-red-400 font-mono text-xs px-3 py-1.5 my-1` with `- ` prefix.
    - Added lines: `bg-mint/40 text-emerald-950 border-l-4 border-emerald-500 font-mono text-xs px-3 py-1.5 my-1` with `+ ` prefix.
    - Context lines: `text-black/60 font-mono text-xs px-3 py-1` with `  ` prefix.
  - Verified claims pill list: checklist of claims verified by AI judge.

### 2.3 New Components Specifications (R4)

1. **Pill Status Badges** (`src/components/StatusBadge.tsx`):
   - Badges: `"Completed 👏"` (`bg-mint text-emerald-950`), `"Upcoming ⏱️"` (`bg-butter/50 text-amber-950`), `"AI patching 🔧"` (`bg-sky text-sky-950`), `"Fixed ✨"` (`bg-mint text-emerald-950`).
   - Format: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm`.
2. **Round Icon Buttons (52px)** (`src/components/IconButton.tsx`):
   - Fixed size: `w-[52px] h-[52px] rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105 active:scale-95`.
   - Mandatory accessibility: Every button MUST require `aria-label: string`.
   - Color variants: `lavender` (`bg-lavender`), `sky` (`bg-sky`), `pink` (`bg-pink`), `butter` (`bg-butter`), `mint` (`bg-mint`), `black` (`bg-black text-white`), `ghost` (`border border-black/10 hover:bg-black/5`).
3. **Stat Trio** (`src/components/StatTrio.tsx`):
   - Three pastel summary cards:
     - Total Lessons: `bg-sky/40`, count, label "Total 📚".
     - Completed: `bg-mint`, count, label "Completed 👏".
     - Upcoming: `bg-butter`, count, label "Upcoming ⏱️".
   - Used on `/roadmap` top bar and progress overviews.
4. **Avatar Stacks** (`src/components/AvatarStack.tsx`):
   - Overlapping circular user avatars (`flex -space-x-3 overflow-hidden`).
   - Each avatar `w-9 h-9 rounded-full ring-2 ring-white flex items-center justify-center font-bold text-xs`.
   - Trailing count badge `+3` or `+8`.
5. **Dashed-Border Empty Cards** (`src/components/EmptyCard.tsx`):
   - Container: `border-2 border-dashed border-black/15 bg-white/40 rounded-3xl p-6 flex flex-col items-center justify-center text-center text-black/50 min-h-[120px]`.
   - Used for pending build steps on `/build`, empty module placeholders, and unstarted lessons.
6. **Floating Bottom Toolbar** (`src/components/FloatingToolbar.tsx`):
   - Fixed pill: `fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-black/90 backdrop-blur-md rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-3 border border-white/10`.
   - Houses 52px (or 44px compact) colorful circular buttons: lavender, sky, pink, butter, mint, dark `+`, each with accessible `aria-label`.
7. **App Shell Navigation with Curved Notch** (`src/components/AppShell.tsx`):
   - Top black bar (`bg-[#0A0A0A] text-white h-16 flex items-center justify-between px-6`).
   - Wordmark: "AnyLearn" in bold geometric font.
   - Active nav notch: Inverted curved notch under the active icon transitioning seamlessly into the off-white `#F7F7F7` main panel (`rounded-t-[40px]`).
   - Right section: Avatar stack + user profile dropdown.

### 2.4 Motion Architecture & React 19 Compatibility (R5)
1. **React 19 Package Resolution**:
   - `package.json` uses React `19.2.8`.
   - Framer Motion has been unified under `motion` (v12+).
   - In React 19, `npm install motion` (or `framer-motion@^12.0.0`) allows importing from `motion/react` or `framer-motion` without peer dependency conflicts.
2. **Standard Animation Tokens**:
   - **Hover Lift**: `whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}`.
   - **Spring Transitions**: `transition={{ type: "spring", stiffness: 350, damping: 25 }}`.
   - **Tilted Active Card**: `transform: rotate(-4deg)` / `animate={{ rotate: -4 }}`.
   - **Card Pop-in Spring**: `initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 22 }}`.
   - **Confetti on Completion**: SSR-safe dynamic invocation on 100% quiz completion, using pastel color stops (`['#CFF7D3', '#F1D3FA', '#FBE8B0', '#D5F1F7', '#FF8FC7']`).
3. **Node SSR / Test Safety**:
   - `tests/interactions.test.ts` executes in Node via `ReactDOMServer.renderToStaticMarkup`.
   - Motion components render valid HTML tags during static markup generation without executing client hooks. No browser window APIs will be accessed at render time.

### 2.5 3D Emojis & Illustration Assets
1. **Emoji Analysis**:
   - The package `@fluentui/react-emoji` cited in dispatch is not published under that exact name on npm (the community package is `@fluentui-emoji/react` or `@lobehub/fluent-emoji`).
   - The most robust, zero-dependency, and deterministic approach is storing the required 3D emoji assets in `/public/assets/emojis/` (or providing an inline `<FluentEmoji symbol="..." />` component supporting the 16 required emojis: 🎓, 🧠, 🗺️, 🎯, 🔒, ✅, ❌, 🎉, 👏, ⏱️, 🔧, ✨, 🚀, 📚, 🧬, 💡).
2. **Required Illustration Assets in `/public/assets/`**:
   - `hero-collage.svg`: Collage of overlapping pastel cards tilted at `-4°`, `+3°`, and `-2°` for the landing page hero.
   - `empty-state.svg`: Minimalist pastel illustration for empty courses/modules.
   - `logo-mark.svg`: Geometric AnyLearn brand icon.

---

## 3. Caveats

1. **No Code Modifications Made**: Explorer 2 operated under read-only investigation mode. No packages were installed and no files were modified in `src/` or `public/`.
2. **Package Installation Requirement**: To implement the design, the orchestrator/implementer must install Tailwind CSS v4, `motion` (or `framer-motion`), and `canvas-confetti` (plus `@types/canvas-confetti`).
3. **SSR / Hydration Discipline**: When using `localStorage` or `sessionStorage` in components (such as `anylearn-demo-mode`), components must guard with `mounted` state (`useSyncExternalStore` or `useEffect`) to prevent Next.js hydration mismatches.
4. **SVG ForeignObject vs Pure SVG in RoadmapGraph**: `interactions.test.ts` expects SVG `<svg>`, `<rect>`, and `<text>` in `RoadmapGraph`. If `<foreignObject>` is used for HTML pastel cards, ensure that outer SVG tags and text strings like `Voltage, Current` and `skip ✓` remain detectable by `ReactDOMServer.renderToStaticMarkup`.

---

## 4. Conclusion

1. **Current State Assessment**:
   - The codebase has 4 existing UI components in `src/components/`, while `DiffView.tsx` is completely missing.
   - All 80 existing tests pass, but `tests/interactions.test.ts` strictly validates specific DOM classes, SVG attributes, and CSS variables.
2. **Actionable Implementation Blueprint**:
   - Create `src/components/DiffView.tsx` for the `/report/[lessonId]` page with red/mint diff styling.
   - Restyle `MasteryRing.tsx`, `ApiKeyModal.tsx`, `RoadmapGraph.tsx`, and `BlockRenderer.tsx` using Dei pastel tokens while maintaining 100% backward compatibility with `tests/interactions.test.ts`.
   - Build 6 new reusable components: `StatusBadge`, `IconButton` (52px, mandatory aria-label), `StatTrio`, `AvatarStack`, `EmptyCard` (dashed border), and `FloatingToolbar`.
   - Implement the black app shell with curved notch navigation in `layout.tsx` / `AppShell.tsx`.
   - Use `motion` for hover lift, spring transitions, ~-4° tilt, and pop-in animations.
   - Store 3D emojis and illustrations in `/public/assets/` to ensure offline resilience and instant rendering.

---

## 5. Verification Method

To independently verify these findings and validate future implementations:

1. **Run Full Test Suite**:
   ```bash
   npm test
   ```
   *Expected*: All 80 tests pass across all 8 suites with 0 failures.
2. **Inspect Component Static Markup Compatibility**:
   Inspect `tests/interactions.test.ts` to confirm every asserted string exists in the component output:
   - `MasteryRing`: checks `var(--mastery-untouched)`, `var(--mastery-weak)`, `var(--mastery-ok)`, `var(--mastery-solid)`.
   - `BlockRenderer`: checks `block-callout mistake`, `block-callout tip`, `block-callout warning`, `Flag this block`, `⚑`.
   - `RoadmapGraph`: checks `class="roadmap-svg"`, `id="arrowhead"`, `marker-end="url(#arrowhead)"`, `skip ✓`.
3. **Verify Production Build**:
   ```bash
   npm run build
   ```
   *Expected*: Next.js Turbopack build exits with code 0 and 0 TypeScript errors.
