# Project: AnyLearn Web Bug Review and Remediation

## Architecture
- **Framework**: Next.js 16.3.5 (React 19) with Turbopack App Router.
- **Client Architecture**: Pure client-side application (`'use client'`). No Next.js API routes; client directly calls Google Gemini 2.0 Flash REST API.
- **State Store**: Zustand store (`src/lib/store.ts`) with `localStorage` persistence under key `anylearn-state`.
- **Domain Engines**:
  - `mastery.ts`: Bayesian knowledge tracing engine.
  - `dagValidator.ts`: Kahn's algorithm topological sort and cycle detector for concept dependencies.
  - `patchEngine.ts`: Deterministic course graph mutation engine with inverse patch generator for undo.
  - `llmClient.ts`: Gemini REST client with caching and demo mode bypass.
  - `fixture.ts`: PCB Design sample course for demo mode.
- **UI System**: Modern dark-theme glassmorphism with custom SVG interactive DAG graph (`RoadmapGraph.tsx`), circular mastery gauges (`MasteryRing.tsx`), and discriminated union content blocks (`BlockRenderer.tsx`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | FEAT-01: Goal Intake & Calibration | Goal input textarea, example chips, calibration chips (hours/artifact) | M2 | Survey Exp 2 |
| 2 | FEAT-02: API Key Management | Gemini API key modal, validation against Google API, local storage | M2 | Survey Exp 1 & 2 |
| 3 | FEAT-03: Preview & Demo Mode | Preloaded PCB course fixture, offline evaluation without API key, seamless routing | M2 | Survey Exp 1 & 2 |
| 4 | FEAT-04: Course Generation Pipeline | Sequential 5-step visual pipeline, concept graph and curriculum synthesis | M2 | Survey Exp 2 |
| 5 | FEAT-05: Interactive Roadmap Graph | SVG layout of modules, lesson nodes, mastery color coding, pan & touch dragging | M3 | Survey Exp 2 |
| 6 | FEAT-06: Progress & Mastery Dashboard | Progress bar, average mastery ring, "Next Best Action" recommendation CTA | M3 | Survey Exp 2 |
| 7 | FEAT-07: Course Changelog & Undo | Slide-over drawer of patch history with undo and inverse patch application | M3 | Survey Exp 1 & 2 |
| 8 | FEAT-08: Lazy Lesson Content Generation | On-demand generation of stub lessons, demo mode fallback/handling | M2 | Survey Exp 1 & 2 |
| 9 | FEAT-09: Block-Based Lesson Workspace | Discriminated union block rendering (Markdown, Worked Example, Callout, Checkpoint, Diagram) | M3 | Survey Exp 2 |
| 10 | FEAT-10: Lesson Mark Complete | Completes lesson, updates completed IDs, transitions badge and mastery | M3 | Survey Exp 2 |
| 11 | FEAT-11: Concept-Tagged Quizzes | Step-by-step quiz with difficulty tiers, misconception options, feedback | M3 | Survey Exp 2 |
| 12 | FEAT-12: Mastery Engine | Bayesian knowledge update from quiz answers (`mastery.ts`) | M1 | Survey Exp 2 & 3 |
| 13 | FEAT-13: Adaptive Roadmap Engine | Remedial roadmap patch triggered when struggling on quiz (Moat 2) | M3 | Survey Exp 2 |
| 14 | FEAT-14: Report & Fix Diagnosis & Patch | 9-category issue report, diagnostic generation, and roadmap patch | M3 | Survey Exp 2 |
| 15 | FEAT-15: Independent Verifier Loop | Verifier prompt checking patched lesson vs original lesson (Moat 3) | M3 | Survey Exp 2 |
| 16 | FEAT-16: Capstone Project Display | Rendering capstone project card and criteria on the roadmap | M3 | Survey Exp 2 |
| 17 | FEAT-17: Test Infrastructure & Harness | Automated test suite covering unit, integration, and regression | M1 | Survey Exp 3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Test Infrastructure & E2E Testing Track | Establish test runner (`node:test` / runner script), author 4-tier test suite covering core domain engines, storage, models, and regression baselines | None | DONE |
| M2 | Codebase Audit & Build/Lint/Hydration Fixes | Fix `package.json` scripts, all 9 ESLint errors, SSR hydration mismatches in `/build` and `/goal`, Demo Mode routing and stub handling | M1 interface contracts | DONE |
| M3 | Core Application & Flow Bug Fixes | Wire up adaptive quiz patching (Moat 2), fix report verifier prompt (Moat 3), report success UI, patchEngine inverses, capstone project display, touch graph support, standardize LLMError | M1, M2 | IN_PROGRESS |
| M4 | Final Acceptance & Adversarial Hardening | Pass 100% test suite, run Challenger adversarial tests, complete Forensic Audit | M1, M2, M3 | PLANNED |

## Interface Contracts
### Mastery Engine (`src/lib/mastery.ts`)
- `updateFromAnswer(current: LearnerState, conceptIDs: string[], correct: boolean, tier?: DifficultyTier, misconceptionID?: string): LearnerState`
- Pure function, immutable state return, clamped between [0.05, 0.99].

### DAG Validator (`src/lib/dagValidator.ts`)
- `validateDAG(concepts: Concept[]): { valid: boolean; cycle?: string[]; error?: string }`
- Detects circular prerequisite dependencies across concepts using Kahn's algorithm.

### Patch Engine (`src/lib/patchEngine.ts`)
- `applyPatch(course: Course, patch: RoadmapPatch): { course: Course; inverse: RoadmapPatch; success: boolean; error?: string }`
- Atomically applies operations (`addLesson`, `deleteLesson`, `insertPrerequisite`, `markSkippable`, `addPractice`), validates DAG, and produces invertible patch.

### Store & Navigation Flow
- Demo Mode: In `ApiKeyModal.tsx`, clicking "Preview with PCB Design demo" populates course and routes directly to `/roadmap`.
- Stub Lessons: In Demo Mode without API key, stub lessons display a graceful banner/mock rather than redirecting to `/goal`.
- Lesson Report: `Prompts.verify(beforeLesson, afterLesson, report, mastery)` must receive the patched lesson as `afterLesson`.

## Code Layout
- `src/lib/`: Domain engines, models, prompts, store, fixtures.
- `src/components/`: Reusable UI components (`ApiKeyModal.tsx`, `BlockRenderer.tsx`, `MasteryRing.tsx`, `RoadmapGraph.tsx`).
- `src/app/`: Next.js App Router routes (`/`, `/goal`, `/build`, `/roadmap`, `/lesson/[id]`, `/quiz/[lessonId]`, `/report/[lessonId]`).
- `tests/`: Automated test suite (unit, integration, regression).
