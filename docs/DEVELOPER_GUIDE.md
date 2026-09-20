# AnyLearn — Developer & Architecture Guide

Welcome to the **AnyLearn** codebase. This document outlines the project's technical architecture, invariants, engine designs, and development workflows.

---

## 1. Core Architectural Principle

> **"AI proposes, the engine disposes."**

Generative AI models (`llmClient.ts`) produce structured, schema-validated JSON proposals. They never directly mutate application state, write database records, or invent web links. 

Deterministic TypeScript code:
1. Validates schema boundaries.
2. Checks topological acyclic invariants (`dagValidator.ts`).
3. Computes Bayesian Knowledge Tracing scores (`mastery.ts`).
4. Executes atomic, reversible course mutations with undo capability (`patchEngine.ts`).
5. Persists state safely to client-side storage (`store.ts`).

---

## 2. Directory Structure

```
AnyLearn/
├── docs/                        # Specifications, PRDs, and prompt guides
├── public/                      # Static assets, SVG icons, and illustrations
├── src/
│   ├── app/                     # Next.js 16 App Router pages & layouts
│   │   ├── layout.tsx           # Global root layout with AppShell wrapper
│   │   ├── globals.css          # Neo-Brutalist CSS tokens & grid layout utilities
│   │   ├── page.tsx             # Root page (redirects to /roadmap or /goal)
│   │   ├── goal/page.tsx        # Goal intake & milestone calibration
│   │   ├── build/page.tsx       # Live curriculum generation stepper pipeline
│   │   ├── roadmap/page.tsx     # Living roadmap dashboard & SVG concept graph
│   │   ├── lesson/[id]/page.tsx # Modular block-based lesson workspace
│   │   ├── quiz/[lessonId]/page.tsx # Formative quiz runner with misconception tagging
│   │   ├── report/page.tsx      # Fallback redirect to active lesson report
│   │   └── report/[lessonId]/page.tsx # In-browser diagnostic & patch engine
│   ├── components/              # Reusable Neo-Brutalist UI components
│   │   ├── AppShell/            # Sticky header, navigation pills, brand emblem, settings modal
│   │   ├── ApiKeyModal.tsx      # Client-side Gemini API key configuration
│   │   ├── BlockRenderer.tsx    # Discriminated union renderer for lesson blocks
│   │   ├── MasteryRing.tsx      # Circular SVG mastery indicator & linear mastery bar
│   │   └── RoadmapGraph.tsx     # Interactive SVG DAG graph renderer
│   └── lib/                     # Pure logic engines and data models
│       ├── models.ts            # TypeScript interfaces and discriminated unions
│       ├── dagValidator.ts      # Kahn's topological sort, cycle detection, auto-repair
│       ├── mastery.ts           # Bayesian Knowledge Tracing and adaptive triggers
│       ├── patchEngine.ts       # Atomic course patch applicator and inverse generator
│       ├── llmClient.ts         # Gemini REST client with in-memory caching
│       ├── prompts.ts           # System and user prompts with schema enforcement
│       ├── store.ts             # Zustand store with localStorage persistence
│       └── fixture.ts           # Pre-built Medical & PCB course fixtures
├── tests/                       # 4-tier automated test suite (80 tests)
│   ├── runner.mjs               # Node.js native test runner
│   ├── loader.mjs               # On-the-fly TSX transpile & path alias resolver
│   ├── dagValidator.test.ts     # Tier 1 DAG graph tests
│   ├── mastery.test.ts          # Tier 1 Bayesian engine tests
│   ├── patchEngine.test.ts      # Tier 1 Patch engine tests
│   ├── store.test.ts            # Tier 1 Zustand store tests
│   ├── boundaries.test.ts       # Tier 2 Boundary & edge case tests
│   ├── interactions.test.ts     # Tier 3 Component rendering & interaction tests
│   ├── workflows.test.ts        # Tier 4 End-to-end user journey tests
│   └── regressions.test.ts      # Tier 4 Invariant & regression tests
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 3. Key Engines

### 3.1 DAG Validator (`src/lib/dagValidator.ts`)
- Implements Kahn's topological sorting algorithm.
- Validates that prerequisite relationships between concepts and lessons form an acyclic directed graph.
- Automatically isolates and repairs cycles by dropping lower-confidence back-edges during dynamic course generation.

### 3.2 Mastery Engine (`src/lib/mastery.ts`)
- Computes Bayesian Knowledge Tracing probability updates:
  $$p_{\text{new}} = p_{\text{old}} + \alpha \cdot (\text{score} - p_{\text{old}})$$
- Dynamic learning rate $\alpha = 0.5$ for early attempts, attenuating to $0.3$ for subsequent attempts.
- Evaluates misconception tags on multiple-choice distractors to flag persistent conceptual confusions.
- Determines when adaptive triggers should fire (`isWeak`, `shouldAdapt`, `isSolid`).

### 3.3 Patch Engine (`src/lib/patchEngine.ts`)
- Manages versioned course mutations via 8 atomic operations:
  1. `addConcept`
  2. `insertLesson`
  3. `replaceBlock`
  4. `insertBlock`
  5. `addPractice`
  6. `markSkippable`
  7. `reorder`
  8. `replaceQuestion`
- Enforces safety invariants: maximum 3 operations per patch, completed lessons cannot be deleted, and new edges must not introduce cycles.
- Generates exact inverse patches, enabling zero-loss roundtrip **Undo** and **Redo**.

---

## 4. State Management (`src/lib/store.ts`)

- Powered by Zustand with client-side `localStorage` persistence under the `anylearn-storage` key.
- SSR-safe hydration fallback ensures pages render cleanly during server-side execution without reading browser globals prematurely.
- Manages:
  - `course`: Active `Course` object (modules, lessons, concepts, quizzes, capstone, changelog).
  - `learner`: User state (completed lesson IDs, per-concept mastery records, attempt histories).

---

## 5. Styling Guidelines & Design System

The application strictly adheres to an authentic **Neo-Brutalist** aesthetic:
- **Palette**:
  - Background Canvas: Warm Paper `#F4F0EA`
  - Cards & Containers: Crisp White `#FFFFFF`
  - Primary Accent: Electric Yellow `#FFE600`
  - Success / Mastery: Acid Mint `#00F59B`
  - Objectives / Concepts: Sky Blue `#38BDF8`
  - Secondary Accent: Electric Violet `#DDD6FE`
  - High Alert / Danger: Hot Coral `#FF5A36`
  - Typography: Pure Black `#000000` (zero low-contrast gray text)
- **Borders & Shadows**:
  - Main cards & buttons: `border: 3px solid #000000; box-shadow: 4px 4px 0px #000000;`
  - Badges & small controls: `border: 2px solid #000000; box-shadow: 2px 2px 0px #000000;`
  - Hero elements: `box-shadow: 6px 6px 0px #000000;`
- **Responsive Layout**:
  - Uses pure CSS grids (`.brutal-grid-4`, `.brutal-grid-2`) with breakpoint media queries.
  - Natural document flow with responsive scrolling; no fixed-height viewport clipping.

---

## 6. Testing & Quality Assurance

The test suite runs offline with zero external network dependencies via the Node.js native test runner:

```bash
# Run the complete test suite (80 tests)
npm test

# Run a specific test suite
node --experimental-strip-types --loader ./tests/loader.mjs --test tests/mastery.test.ts
```

### Invariants to Maintain:
- All tests in `tests/*.test.ts` must pass (80/80 passing).
- `npm run build` must compile cleanly with 0 TypeScript/Webpack errors.
- Never use direct `sessionStorage` or `localStorage` during initial component render; use `useSyncExternalStore` or `useEffect` to guarantee hydration safety.
- The `RoadmapGraph` SVG output must preserve standard element selectors (`<svg class="roadmap-svg">`, `#arrowhead`, module titles, `skip ✓`) to ensure compatibility with graph interaction tests.
