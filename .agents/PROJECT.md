# Project: AnyLearn Frontend Redesign (Dei Reference Design)

## Architecture
- **Framework**: Next.js 16.3.5 (React 19) App Router with Turbopack.
- **Design System & Styling**:
  - Tailwind CSS v4 via `@tailwindcss/postcss` and `postcss.config.mjs`.
  - Design tokens declared in `tailwind.config.ts` and `@theme` block in `src/app/globals.css`.
  - Dei Color Palette: `mint #CFF7D3`, `lavender #F1D3FA`, `butter #FBE8B0`, `sky #D5F1F7`, `pink #FF8FC7`, `black #0A0A0A`, `off-white #F7F7F7`, `grey #F0F0F0`.
  - Typography: `Plus_Jakarta_Sans` / `Outfit` geometric bold sans via `next/font`.
  - Zero hardcoded hexes: all colors sourced through Tailwind semantic classes (`bg-mint`, `text-lavender`, etc.).
- **App Shell (`src/app/layout.tsx`)**:
  - Full-viewport black shell (`#0A0A0A`).
  - Black top bar with "AnyLearn" wordmark, icon-only navigation with active curved notch, and avatar profile dropdown.
  - Off-white content panel (`#F7F7F7`) with 40px radius (`rounded-panel`).
  - Right secondary panel (`#F0F0F0`) for context details, collapsing below `lg` breakpoint.
  - Floating bottom toolbar: black pill with 6 colorful circular tool buttons (lavender, sky, pink, butter, mint, dark "+") with mandatory `aria-label`.
- **Motion & Assets**:
  - Framer Motion animations (`whileHover={{ y: -4 }}`, spring transitions, `rotate: -4` active card tilt, spring pop-in, confetti).
  - 3D Emoji system supporting `🎓 🧠 🗺️ 🎯 🔒 ✅ ❌ 🎉 👏 ⏱️ 🔧 ✨ 🚀 📚 🧬 💡`.
  - Sourced SVG illustration assets in `/public/assets/`.
- **Logic & Store Invariance**:
  - Complete preservation of Zustand store (`src/lib/store.ts`), domain engines (`mastery.ts`, `dagValidator.ts`, `patchEngine.ts`, `llmClient.ts`), and all 80 tests in `tests/`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | FEAT-R1: Design Tokens & Tailwind v4 | Setup Tailwind CSS v4, PostCSS, globals.css @theme tokens, and tailwind.config | M1 | Survey Exp 1 |
| 2 | FEAT-R2: App Shell Layout | Black shell, top bar, wordmark, avatar dropdown, off-white 40px panel, secondary panel | M1 | Survey Exp 1 |
| 3 | FEAT-R3: Curved Notch Navigation | Icon navigation in top bar with active SVG curved notch connecting to content panel | M1 | Survey Exp 1 |
| 4 | FEAT-R4: Floating Bottom Toolbar | Fixed black pill toolbar with 6 colorful round buttons (52px/38px) and aria-labels | M1 | Survey Exp 1 |
| 5 | FEAT-R5: Asset Library & 3D Emojis | 3D emoji component/SVGs and illustration assets in /public/assets/ | M1 | Survey Exp 2 |
| 6 | FEAT-R6: MasteryRing Component | Thick ring (strokeWidth=8), pastel gradient, percent + emoji at 100%, test-compatible | M2 | Survey Exp 2 |
| 7 | FEAT-R7: ApiKeyModal Component | Blurred backdrop, white rounded card, masked input, mint demo button, 🔒 helper text | M2 | Survey Exp 2 |
| 8 | FEAT-R8: RoadmapGraph Component | SVG DAG pastel cards, dashed green connectors, locked icons, tilted lavender featured card | M2 | Survey Exp 2 |
| 9 | FEAT-R9: BlockRenderer Component | Pastel cards by block type (white, lavender+play, sky, butter, mint), test-compatible | M2 | Survey Exp 2 |
| 10 | FEAT-R10: DiffView Component | Split/unified diff view, red-tinted removed lines, mint-tinted added lines, status badge | M2 | Survey Exp 2 |
| 11 | FEAT-R11: Reusable UI Atoms | Pill status badges, 52px icon buttons, stat trio, avatar stack, dashed empty cards | M2 | Survey Exp 2 |
| 12 | FEAT-R12: Page / (Landing Hero) | Black shell hero, giant headline + 3D emoji, tilted pastel card collage, black pill CTA | M3 | Survey Exp 3 |
| 13 | FEAT-R13: Page /goal (Goal Intake) | Centered mint/lavender card, large search-bar textarea, 🧬/💻/🎸 chips, black CTA | M3 | Survey Exp 3 |
| 14 | FEAT-R14: Page /build (Course Stepper) | 4-step vertical pastel stepper, active tilted with spinner, "Completed 👏" mint pill | M3 | Survey Exp 3 |
| 15 | FEAT-R15: Page /roadmap (DAG & Events) | Two-column layout: left DAG with stat trio; right "My Events" sidebar; spring pop-in | M3 | Survey Exp 3 |
| 16 | FEAT-R16: Page /lesson/[id] (Reader) | Pastel cards by type, progress pill + sidebar with mastery ring, missing fallback | M3 | Survey Exp 3 |
| 17 | FEAT-R17: Page /quiz/[lessonId] (Quiz) | One question per large card, option pills, mint+✅, red+❌+butter card, confetti 🎉 | M3 | Survey Exp 3 |
| 18 | FEAT-R18: Page /report/[lessonId] (Fix) | Split report form + DiffView, animated "AI patching 🔧" pill, "Fixed ✨" badge | M3 | Survey Exp 3 |
| 19 | FEAT-R19: Motion & Animation Tokens | Hover lift, spring transitions, ~-4° active tilt, pop-in spring, confetti animation | M3 | Survey Exp 2 |
| 20 | FEAT-R20: Verification & Accessibility | 11-point checklist verification across all 7 pages, WCAG AA contrast, 80 tests green | M4 | Survey Exp 1, 2, 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System, Tokens, App Shell & Base Assets | Setup Tailwind v4, PostCSS, globals.css tokens, App Shell (TopBar, Curved Notch Nav, Panels, Floating Toolbar), 3D emoji library | None | IN_PROGRESS |
| M2 | Component Library & Reusable UI Atoms | Restyle MasteryRing, ApiKeyModal, RoadmapGraph, BlockRenderer; Build DiffView, StatusBadge, IconButton, StatTrio, AvatarStack, EmptyCard | M1 | PLANNED |
| M3 | 7 Page Redesigns & Motion Polish | Complete visual overhaul of /, /goal, /build, /roadmap, /lesson/[id], /quiz/[lessonId], /report/[lessonId] with Framer Motion animations | M1, M2 | PLANNED |
| M4 | E2E Verification, Accessibility & Hardening | Full 11-point verification across 7 pages, zero hardcoded hexes, 80/80 tests pass, build pass, adversarial challenger & forensic audit | M1, M2, M3 | PLANNED |

## Interface Contracts & Test Anchors
### Test Assertion Invariance (`tests/interactions.test.ts`)
- `MasteryRing`: Must render SVG circle with `var(--mastery-untouched)`, `var(--mastery-weak)`, `var(--mastery-ok)`, `var(--mastery-solid)`.
- `MasteryBar`: Must render `style="width:..."`, concept name, and percentage text.
- `BlockRenderer`:
  - `block-callout mistake` with `⚠`
  - `block-callout tip` with `💡`
  - `block-callout warning` with `🔔`
  - `Reveal answer` and hint text for checkpoints.
  - `Flag this block` and `⚑` for markdown blocks when `onFlag` is provided.
- `RoadmapGraph`:
  - `<svg class="roadmap-svg" ...>`
  - `<marker id="arrowhead" ...>`
  - `marker-end="url(#arrowhead)"`
  - Skippable text: `skip ✓`

### Exported Functions Invariance
- `src/app/quiz/[lessonId]/page.tsx`:
  - `export function createRemedialPatch(course: Course, lesson: Lesson, weakConcepts: string[]): RoadmapPatch`
- `src/app/report/[lessonId]/page.tsx`:
  - `export function constructAfterLesson(lesson: Lesson, patchOps: PatchOp[], lessonID: string): Lesson`

### DOM ID Invariance
- Goal page: `#goal-input`, `#build-course-btn`
- ApiKeyModal: `#api-key-input`, `#save-api-key-btn`, `#preview-mode-btn`
- Lesson page: `#report-fix-btn`, `#take-quiz-btn`
- Quiz page: `#confirm-answer-btn`, `#next-question-btn`, `#option-1`, etc.
- Report page: `#submit-report-btn`
- Roadmap page: `#next-lesson-btn`, `#changelog-btn`

## Code Layout
- `src/app/`: Next.js App Router root layout and 7 pages (`/`, `/goal`, `/build`, `/roadmap`, `/lesson/[id]`, `/quiz/[lessonId]`, `/report/[lessonId]`).
- `src/components/`:
  - `AppShell/`: `AppShell.tsx`, `TopBar.tsx`, `CurvedNotchNav.tsx`, `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`.
  - Reusable components: `MasteryRing.tsx`, `ApiKeyModal.tsx`, `RoadmapGraph.tsx`, `BlockRenderer.tsx`, `DiffView.tsx`.
  - UI Atoms: `StatusBadge.tsx`, `IconButton.tsx`, `StatTrio.tsx`, `AvatarStack.tsx`, `EmptyCard.tsx`.
  - Icons/Emojis: `FluentEmoji.tsx`.
- `src/lib/`: Domain engines, models, prompts, store, fixtures (strictly preserved).
- `public/assets/`: 3D emojis and illustration SVGs.
- `tests/`: 80 automated unit, regression, and interaction tests (must remain 100% green).
