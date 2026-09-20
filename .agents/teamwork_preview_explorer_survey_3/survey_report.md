# AnyLearn Test Infrastructure, Test Suites & Coverage Survey Report

**Author**: Explorer 3 (Test Infrastructure Auditor)  
**Date**: 2026-09-19T21:05:00Z  
**Project**: AnyLearn Web (`anylearn-web@0.1.0`)  
**Project Root**: `/Users/sinanm/Documents/ChatGPT/AnyLearn`  
**Integrity Mode**: Benchmark  
**Authoritative Context**: `/Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md`

---

## Executive Summary

A comprehensive audit of the AnyLearn test infrastructure, test suites, and test coverage was conducted. 

### Key Findings
1. **Zero Existing Tests in Web Port**: Despite references in documentation (`PROGRESS.md` mentions Phase 0 XCTest coverage for iOS foundations), the Next.js web application currently contains **zero test files**, **zero test configurations**, and **no test scripts** in `package.json`.
2. **Missing Test Runner**: No test runner (Jest, Vitest, Mocha, Playwright, Cypress) or testing utilities (`@testing-library/react`) are installed in `devDependencies`.
3. **Execution Results**:
   - `npm test`: **FAILED** (`Missing script: "test"`).
   - `npm run lint`: **FAILED** (exit code 7 / 1; 26 problems found: 9 errors, 17 warnings across React hooks, unescaped entities, and TypeScript typing).
   - `npm run build`: **PASSED** (Turbopack builds in ~131ms, TypeScript type check passes in 466ms, all 7 static pages compile).
   - `node node_modules/typescript/bin/tsc --noEmit`: **PASSED** (0 compilation errors).
   - `node --experimental-strip-types --test`: **PASSED** (0 tests discovered).
4. **Codebase Testability**: The core business logic (`src/lib/mastery.ts`, `src/lib/dagValidator.ts`, `src/lib/patchEngine.ts`) is cleanly partitioned into pure, deterministic TypeScript modules with high algorithmic testability. The Zustand store (`src/lib/store.ts`) and React UI components are well-structured for modular unit and integration testing.
5. **Requirements for Acceptance**: To satisfy the Authoritative Request Acceptance Criteria ("Existing test suites pass successfully", "New tests are added for the identified and fixed bugs, and they pass"), a complete 4-Tier test architecture must be implemented.

---

## 1. Test Configurations & Tools Inspection

### 1.1 `package.json` Configuration
- **Package Name**: `anylearn-web@0.1.0`
- **Framework**: Next.js 16.3.5, React 19.2.8, React-DOM 19.2.8
- **Language**: TypeScript ^5
- **Dependencies**: `mermaid` (^12.0.0), `next` (16.3.5), `react` (19.2.8), `react-dom` (19.2.8), `react-markdown` (^10.1.0), `zustand` (^5.0.15)
- **DevDependencies**: `@types/node` (^20), `@types/react` (^19), `@types/react-dom` (^19), `eslint` (^9), `eslint-config-next` (16.3.5), `typescript` (^5)
- **Configured Scripts**:
  ```json
  "scripts": {
    "dev": "node node_modules/next/dist/bin/next dev --turbopack",
    "build": "node node_modules/next/dist/bin/next build",
    "start": "node node_modules/next/dist/bin/next start",
    "lint": "eslint"
  }
  ```
- **Observations**:
  - No `"test"` or `"test:*"` scripts exist.
  - No testing dependencies exist in `devDependencies` (no `jest`, `vitest`, `@testing-library/react`, `playwright`, `cypress`, etc.).

### 1.2 Configuration Files in Repository
- `tsconfig.json`:
  - Target: `ES2017`
  - Module: `esnext`, Module Resolution: `bundler`
  - JSX: `react-jsx`
  - Path alias: `"@/*": ["./src/*"]`
  - `"noEmit": true`
- `eslint.config.mjs`:
  - Next.js Core Web Vitals and TypeScript ESLint flat configuration.
- `next.config.ts`:
  - Empty NextConfig object.
- **Missing Test Configuration Files**:
  - No `jest.config.js` / `jest.config.ts`
  - No `vitest.config.ts` / `vitest.config.mts`
  - No `playwright.config.ts`
  - No `cypress.config.ts`

### 1.3 Repository Binaries & Environment Quirks
- **Node.js Version**: v26.7.0 (includes native `node:test`, `node:assert`, and experimental TypeScript stripping via `--experimental-strip-types`).
- **Binary Symlink Issue in `node_modules/.bin`**:
  - `node_modules/.bin/eslint` and `node_modules/.bin/tsc` were copied as static files rather than symbolic links. When executed directly, they fail looking for `../package.json` and `../lib/tsc.js`.
  - Calling them via direct node scripts (`node node_modules/eslint/bin/eslint.js` and `node node_modules/typescript/bin/tsc`) works properly.

---

## 2. Test Execution & Automated Verification Results

| Command | Status | Exit Code | Execution Time | Output Summary & Issues |
|---|---|---|---|---|
| `npm test` | **FAIL** | 1 | ~300ms | `npm error Missing script: "test"` |
| `npm run test:e2e` | **FAIL** | 1 | ~200ms | `npm error Missing script: "test:e2e"` |
| `node --experimental-strip-types --test` | **PASS (Empty)** | 0 | 8.5ms | Discovered 0 tests, 0 suites, 0 duration. |
| `npm run lint` | **FAIL** | 7 | ~1.8s | Crash in `.bin/eslint` handler, followed by 26 lint violations (9 errors, 17 warnings). |
| `node node_modules/eslint/bin/eslint.js .` | **FAIL** | 1 | ~1.9s | 9 errors (React hook hoisting in `build/page.tsx`, unescaped entities, setState in effect, `@typescript-eslint/no-require-imports`, `any` type). |
| `npm run build` | **PASS** | 0 | ~1.5s | Next.js 16.3.5 Turbopack compilation succeeded; TypeScript passed; 7 static routes generated. |
| `node node_modules/typescript/bin/tsc --noEmit` | **PASS** | 0 | ~650ms | 0 TypeScript compiler errors across all files. |

### 2.1 Lint Errors Breakdown (Candidate Bugs for Regression Testing)
ESLint identified 9 critical errors and 17 warnings that represent concrete bugs/code smells:
1. `src/app/build/page.tsx:39:5`: `buildCourse` accessed in `useEffect` before declaration (`react-hooks/immutability`).
2. `src/app/roadmap/page.tsx:18:21`: `setMounted(true)` synchronously inside `useEffect` triggering cascading renders (`react-hooks/set-state-in-effect`).
3. `src/components/ApiKeyModal.tsx:56:30`: `require('@/lib/store')` forbidden dynamic require (`@typescript-eslint/no-require-imports`).
4. `src/lib/store.ts:139:12`: `as any` in storage fallback (`@typescript-eslint/no-explicit-any`).
5. Unescaped quotes/entities (`react/no-unescaped-entities`):
   - `src/app/goal/page.tsx:102:83`
   - `src/app/quiz/[lessonId]/page.tsx:127:20`
   - `src/app/report/[lessonId]/page.tsx:231:13`, `231:28`
   - `src/components/ApiKeyModal.tsx:128:52`

---

## 3. Test Coverage Assessment Across Codebase

### 3.1 Feature Coverage Matrix

| Category | File Path | Complexity | Core Responsibilities | Current Unit / Integration Tests | Test Coverage % |
|---|---|---|---|---|---|
| **Engine** | `src/lib/mastery.ts` | Medium | Bayesian / EMA mastery updating, difficulty weighting, misconception tracking, weak/solid/adapt logic | None | **0%** |
| **Engine** | `src/lib/dagValidator.ts` | High | Kahn's algorithm topological sorting, cycle detection, prerequisite graph validation | None | **0%** |
| **Engine** | `src/lib/patchEngine.ts` | High | Course roadmap mutations (8 op types), inverse op calculation for undo, invariant validation | None | **0%** |
| **Data** | `src/lib/fixture.ts` | Low | Pre-built PCB course fixture for demo and testing | None | **0%** |
| **State** | `src/lib/store.ts` | High | Zustand store, localStorage persistence, undo stack, patch history, mastery updating | None | **0%** |
| **Client** | `src/lib/llmClient.ts` | Medium | Gemini REST client, prompt caching (SHA-256), JSON stripping, API key store | None | **0%** |
| **Prompts** | `src/lib/prompts.ts` | Medium | System/user prompt formatting for curriculum, lessons, quizzes, error diagnosis | None | **0%** |
| **UI** | `src/components/MasteryRing.tsx` | Low | SVG circular progress ring, linear mastery bar, color bands | None | **0%** |
| **UI** | `src/components/BlockRenderer.tsx` | Medium | Markdown, worked examples (collapsible), callouts, checkpoints (reveal answer) | None | **0%** |
| **UI** | `src/components/RoadmapGraph.tsx` | High | Interactive SVG curriculum DAG, layout calculations, pan/drag, node selection | None | **0%** |
| **UI** | `src/components/ApiKeyModal.tsx` | Medium | API key intake & validation, preview mode activator | None | **0%** |
| **Page** | `src/app/page.tsx` | Low | Root redirection based on course presence | None | **0%** |
| **Page** | `src/app/goal/page.tsx` | Medium | Goal intake form, example chips, calibration inputs | None | **0%** |
| **Page** | `src/app/build/page.tsx` | High | Multi-step curriculum generation pipeline with animated step progress | None | **0%** |
| **Page** | `src/app/roadmap/page.tsx` | High | Full roadmap view, module accordion, changelog drawer with undo | None | **0%** |
| **Page** | `src/app/lesson/[id]/page.tsx` | High | Lesson reading workspace, stub-to-ready generation, task completion | None | **0%** |
| **Page** | `src/app/quiz/[lessonId]/page.tsx` | High | Quiz display, answer grading, mastery updates, adaptive patching trigger | None | **0%** |
| **Page** | `src/app/report/[lessonId]/page.tsx` | High | Issue reporting, AI diagnosis, fix verification, real-time patch application | None | **0%** |

**Summary**: 100% of features and components currently have **0% automated test coverage**.

---

## 4. 4-Tier Test Architecture & Strategy

To satisfy the Acceptance Criteria:
1. "Existing test suites pass successfully."
2. "New tests are added for the identified and fixed bugs, and they pass."

The testing architecture is structured into 4 distinct tiers:

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 4: Real-World Workflows & Bug Regression Tests        │
│  - Goal → Build → Roadmap → Lesson → Quiz → Report → Undo   │
│  - Bug regression suites for all identified codebase fixes │
├─────────────────────────────────────────────────────────────┤
│  Tier 3: Component Integration & User Interactions         │
│  - Checkpoint reveal, worked example toggle, flag action   │
│  - RoadmapGraph layout & node selection, modal triggers    │
├─────────────────────────────────────────────────────────────┤
│  Tier 2: Boundary & Edge Case Tests                         │
│  - Max ops limit, cyclic graph detection, delete completed  │
│  - Extreme scores, disconnected DAGs, storage errors        │
├─────────────────────────────────────────────────────────────┤
│  Tier 1: Feature Coverage (Core Engine & Store Unit Tests)  │
│  - Mastery calculation & misconception accumulation         │
│  - Kahn's algorithm DAG validation                          │
│  - PatchEngine 8 operations & exact inverse calculations    │
│  - Zustand store actions & state persistence                │
└─────────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (Core Engine & Store Unit Tests)

#### 1. Mastery Engine (`tests/unit/mastery.test.ts`)
- **TC-MAST-01: Default Record**: Verify `Mastery.defaultRecord()` returns `{ probability: 0, attempts: 0, misconceptions: {} }` and `colorClass` is `'untouched'`.
- **TC-MAST-02: Correct Answer Progression**: An initial score of 1.0 increases probability to `0 + 0.5 * (1 - 0) = 0.5`, increments attempts to 1, and updates `colorClass` to `'ok'`.
- **TC-MAST-03: Multiple Attempts Alpha Decay**: Second attempt uses `alpha = 0.5`, third attempt uses `alpha = 0.3`.
- **TC-MAST-04: Difficulty Penalty**: Wrong answers on questions with `difficulty >= 3` result in zero adjusted score and penalize probability.
- **TC-MAST-05: Misconception Tracking**: An incorrect answer with a defined `misconception` string increments that misconception count in `record.misconceptions`.
- **TC-MAST-06: Classification Boundaries**:
  - `isWeak(record)` returns `true` if `probability < 0.5`.
  - `isSolid(record)` returns `true` if `probability >= 0.8`.
- **TC-MAST-07: Adaptation Trigger (`shouldAdapt`)**:
  - Returns `true` if weak and `attempts >= 2`.
  - Returns `true` if any misconception count `>= 2`.

#### 2. DAG Validator (`tests/unit/dagValidator.test.ts`)
- **TC-DAG-01: Valid Linear Pipeline**: `A -> B -> C` passes validation.
- **TC-DAG-02: Diamond Dependency**: `A -> B, A -> C, B -> D, C -> D` passes validation.
- **TC-DAG-03: Direct Cycle Rejection**: `A -> B -> A` fails validation.
- **TC-DAG-04: Multi-Node Cycle Rejection**: `A -> B -> C -> A` fails validation.
- **TC-DAG-05: Self-Referential Node**: Concept requiring itself fails validation.
- **TC-DAG-06: Disconnected Components**: Multiple independent concept graphs pass validation.
- **TC-DAG-07: PCB Fixture Integrity**: `pcbCourseFixture.concepts` passes validation.

#### 3. Patch Engine (`tests/unit/patchEngine.test.ts`)
- **TC-PATCH-01: Operation Limit**: Reject patches with >3 operations (`tooManyOperations`).
- **TC-PATCH-02: `addConcept`**: Appends concept to `course.concepts`, generates inverse `{ type: 'deleteLesson', lessonID: 'concept:...' }`.
- **TC-PATCH-03: `insertLesson`**: Inserts lesson into correct module after specified lesson ID, validates concept IDs, generates inverse `{ type: 'deleteLesson', lessonID: '...' }`.
- **TC-PATCH-04: `replaceBlock`**: Replaces specific block by ID, retains original block in inverse operation.
- **TC-PATCH-05: `insertBlock`**: Inserts block after specified ID (or at start if null), generates virtual inverse `{ type: 'deleteLesson', lessonID: 'block:...' }`.
- **TC-PATCH-06: `addPractice`**: Sets task card on lesson, generates inverse with previous task.
- **TC-PATCH-07: `markSkippable`**: Updates `skippable` property with reason, generates inverse restoring old reason if present.
- **TC-PATCH-08: `reorder`**: Reorders lesson IDs within module, generates inverse with original order; rejects if lesson set doesn't match (`invalidReorder`).
- **TC-PATCH-09: `replaceQuestion`**: Replaces quiz question by ID, retains original question in inverse.
- **TC-PATCH-10: `refreshResources`**: Replaces resource queries, retains old queries in inverse.
- **TC-PATCH-11: `deleteLesson` (Real)**: Deletes uncompleted lesson from `lessons` and `modules`.
- **TC-PATCH-12: `deleteLesson` (Completed Guard)**: Throws `completedLesson` if lesson ID exists in `learner.completedLessonIDs`.
- **TC-PATCH-13: Version Increment**: Course version increments by 1 on every successful patch application.

#### 4. Zustand Store (`tests/unit/store.test.ts`)
- **TC-STORE-01: Initialization**: Store initializes with null course and default learner state.
- **TC-STORE-02: `completeLesson`**: Idempotently adds lesson ID to `learner.completedLessonIDs`.
- **TC-STORE-03: `updateMastery`**: Updates mastery record and logs new attempt with timestamp, score, and selected option ID.
- **TC-STORE-04: `applyPatch` & Changelog**: Applies patch, increments course version, appends `ChangeEntry` to `course.changelog` with inverse operations.
- **TC-STORE-05: `undo` Action**: Reverses patch using `inverseOps` and marks changelog entry as `undone: true`.
- **TC-STORE-06: `reset` Action**: Wipes course, clears errors, resets learner state to default.

---

### Tier 2: Boundary & Edge Cases

- **TC-EDGE-01: Boundary Scores**: `Mastery.update` with scores `< 0` or `> 1` clamped to `[0, 1]`.
- **TC-EDGE-02: Boundary Alpha**: Ensure probability stays bounded within `[0, 1]` under repeated failures or successes.
- **TC-EDGE-03: Empty Concepts Array**: `validateDAG([])` returns `true`.
- **TC-EDGE-04: Single Unconnected Concept**: `validateDAG([{ id: 'c1', prereqIDs: [] }])` returns `true`.
- **TC-EDGE-05: Non-existent Prerequisite ID**: Concepts referencing prerequisite IDs that do not exist in the concepts set are filtered gracefully without throwing.
- **TC-EDGE-06: Exactly 3 Operations**: Patch with exactly 3 operations succeeds (boundary test).
- **TC-EDGE-07: Cyclic Patch Rejection**: Patch adding a concept that introduces a cycle is rejected with `cyclicGraph` and state draft is discarded.
- **TC-EDGE-08: Unknown ID Guards**:
  - `replaceBlock` with invalid `lessonID` throws `unknownID`.
  - `replaceBlock` with invalid `blockID` throws `unknownID`.
  - `insertLesson` with unknown `afterLessonID` throws `unknownID`.
  - `reorder` with unknown `moduleID` throws `unknownID`.
- **TC-EDGE-09: Duplicate ID Guards**:
  - `addConcept` with existing concept ID throws `duplicateID`.
  - `insertLesson` with existing lesson ID throws `duplicateID`.
- **TC-EDGE-10: Double Undo Protection**: Calling `undo()` on an already undone changelog entry returns `{ success: false, error: 'Entry not found or already undone.' }`.
- **TC-EDGE-11: SSR Storage Fallback**: Verify `createJSONStorage` fallback in `store.ts` does not crash in server environments where `window` is undefined.

---

### Tier 3: Interactions & Component Integration

- **TC-INT-01: `BlockRenderer` Markdown & Flagging**: Renders markdown content, displays flag button when `onFlag` is provided, and invokes `onFlag(block.id)` on button click.
- **TC-INT-02: `BlockRenderer` Worked Example Expansion**: Collapses and expands worked steps when header is clicked.
- **TC-INT-03: `BlockRenderer` Checkpoint Answer Reveal**: Displays question initially; clicking "Reveal answer" hides the button and reveals the answer text and hint.
- **TC-INT-04: `BlockRenderer` Callout Styling**: Renders appropriate icons and CSS classes for `'mistake'`, `'tip'`, and `'warning'`.
- **TC-INT-05: `MasteryRing` Visual Output**: Correctly calculates SVG stroke dashoffset based on probability percentage and applies corresponding color variable.
- **TC-INT-06: `RoadmapGraph` DAG Rendering**: Computes valid x, y coordinates for all modules and lessons from fixture; renders SVG nodes and connecting edges.
- **TC-INT-07: `RoadmapGraph` Node Click**: Clicking a graph node invokes `onSelect` callback with the corresponding lesson ID.
- **TC-INT-08: Store-to-UI Sync**: Updating store mastery triggers visual changes in rendered `MasteryRing` and `RoadmapGraph` nodes.

---

### Tier 4: Real-World Workflows & Bug Regression Tests

#### Real-World Workflows
- **TC-WF-01: Preview / Demo Mode Flow**:
  1. Trigger preview mode via `ApiKeyModal` (sets `anylearn-demo-mode = true`, loads `pcbCourseFixture`).
  2. Verify course loaded into store.
  3. Navigate to `/roadmap`, verify modules `m-foundations`, `m-schematics`, `m-pcb-layout`, `m-fabrication` are rendered.
- **TC-WF-02: Quiz Mastery & Adaptation Flow**:
  1. Load `pcbCourseFixture`.
  2. Answer Question 1 correctly in `l-elec-basics` -> mastery updates to ok.
  3. Answer Question 2 incorrectly with misconception option -> misconception recorded.
  4. Second wrong attempt flags concept as weak (`shouldAdapt() === true`).
  5. Verify quiz summary displays correct counts and prompts adaptive actions.
- **TC-WF-03: Content Error Reporting & Dynamic Patching Flow**:
  1. User reports error on lesson `l-elec-basics`.
  2. Construct `FixPlan` with patch (e.g. `insertBlock` or `markSkippable`).
  3. Apply patch via `store.applyPatch()`.
  4. Verify course version increments from 1 to 2.
  5. Verify changelog contains the entry.
  6. Execute `store.undo()` on the entry -> verify course restored and changelog entry marked undone.

#### Bug Regression Suites
- **TC-REG-01: Function Hoisting Fix in `src/app/build/page.tsx`**:
  - Test that `buildCourse` is declared before or wrapped in `useCallback` prior to `useEffect` invocation, preventing React hook immutability violations.
- **TC-REG-02: Hydration & SSR Effect Loop in `src/app/roadmap/page.tsx`**:
  - Test that client-side hydration does not trigger cascading renders (`react-hooks/set-state-in-effect`).
- **TC-REG-03: ESLint Rule Compliance**:
  - Test that all unescaped entity errors in `goal/page.tsx`, `quiz/[lessonId]/page.tsx`, `report/[lessonId]/page.tsx`, and `ApiKeyModal.tsx` are resolved and clean ESLint execution passes with 0 errors.
- **TC-REG-04: TypeScript Parameter Properties Compatibility**:
  - Test `PatchEngineError` and `LLMError` class definitions to ensure they do not break strip-only / transpiler execution.

---

## 5. Concrete Recommendations for Implementation

### 5.1 Recommended Test Framework: Vitest

**Why Vitest?**
1. **Next.js 16 & React 19 Alignment**: Vitest seamlessly handles ESM modules (`react-markdown`, `mermaid`), React 19 JSX, and TypeScript 5 out-of-the-box without complex Babel/Webpack transforms.
2. **Speed**: Sub-second execution using Vite's fast transformation engine.
3. **Path Alias Support**: Automatically resolves `@/*` paths from `tsconfig.json`.
4. **Testing Library Integration**: Native compatibility with `@testing-library/react` and `jsdom` for Tier 3 and Tier 4 component/interaction tests.

### 5.2 Test Directory Structure
Place test suites in a root `tests/` directory to prevent Next.js App Router route collision:

```
AnyLearn/
├── tests/
│   ├── unit/
│   │   ├── mastery.test.ts          # Tier 1: Mastery calculations & Bayesian EMA
│   │   ├── dagValidator.test.ts     # Tier 1: Kahn's topological sort & cycle checks
│   │   ├── patchEngine.test.ts      # Tier 1: 8 Patch operations & inverse calculations
│   │   └── store.test.ts            # Tier 1: Zustand store & state persistence
│   ├── boundary/
│   │   ├── patchBoundaries.test.ts  # Tier 2: 3-op limit, unknown IDs, cyclic patches
│   │   └── edgeCases.test.ts        # Tier 2: Boundary scores, empty DAGs, SSR storage
│   ├── components/
│   │   ├── BlockRenderer.test.tsx   # Tier 3: Block expansion, checkpoints, flagging
│   │   └── MasteryRing.test.tsx     # Tier 3: SVG progress and color thresholds
│   ├── workflows/
│   │   ├── previewFlow.test.ts      # Tier 4: Fixture loading and roadmap rendering
│   │   └── quizAdaptation.test.ts   # Tier 4: Quiz failure -> adaptation trigger
│   └── regression/
│       ├── bugfixes.test.ts         # Tier 4: Verification of fixed bugs
│       └── lintVerification.test.ts # Tier 4: Static code quality verification
```

### 5.3 `package.json` Updates
Add the following scripts to `package.json`:
```json
"scripts": {
  "dev": "node node_modules/next/dist/bin/next dev --turbopack",
  "build": "node node_modules/next/dist/bin/next build",
  "start": "node node_modules/next/dist/bin/next start",
  "lint": "node node_modules/eslint/bin/eslint.js .",
  "test": "vitest run",
  "test:unit": "vitest run tests/unit",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest"
}
```

### 5.4 Offline / Sandbox-Resilient Fallback (Zero External Dependencies)
If external network access to npm registry remains restricted:
- Node.js v26.7.0 includes built-in `node:test` and `node:assert`.
- By creating a runner script (e.g. `scripts/test-runner.mjs`) or standard test files using `node:test`, all Tier 1, Tier 2, and workflow tests for the pure logic modules (`mastery.ts`, `dagValidator.ts`, `patchEngine.ts`, `store.ts`, `fixture.ts`) can execute and pass with **zero external packages**.
- Example npm test command:
  `"test": "node --experimental-strip-types --test tests/**/*.test.ts"`

---

## 6. Conclusion & Next Steps for Team

1. **Test Infrastructure**: Currently at 0% test coverage with no test runner configured.
2. **Readiness**: The codebase architecture is highly testable; core algorithms are already decoupled from UI.
3. **Execution Plan**:
   - Implement the test runner setup (Vitest or native `node:test`).
   - Create the 4-Tier test suite covering all 18 test cases and workflows outlined above.
   - Run the new test suites to verify bug fixes identified by Explorer 1 and Explorer 2.
   - Ensure all tests and linting pass with 100% success rate.
