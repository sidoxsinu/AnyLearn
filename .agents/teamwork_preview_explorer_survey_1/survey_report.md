# Comprehensive Codebase & Build Audit Report: AnyLearn Web

**Audit Date**: 2026-09-19  
**Auditor**: Explorer 1 (Codebase & Build Auditor)  
**Project Root**: `/Users/sinanm/Documents/ChatGPT/AnyLearn`  
**Integrity Mode**: Benchmark  
**Next.js Version**: `16.3.5` (Turbopack) | **React Version**: `19.2.8`

---

## 1. Executive Summary

AnyLearn Web is a Next.js 16 App Router application converting the original iOS AnyLearn architecture into a client-side adaptive learning web app. The core architecture uses Zustand for state management (`localStorage` persistence), a set of deterministic pure-function engines (`mastery.ts`, `dagValidator.ts`, `patchEngine.ts`), a Gemini 2.0 Flash REST client (`llmClient.ts`), and SVG/CSS-driven visualization components.

### Audit Findings Summary
| Area | Severity | Status | Key Issues |
|---|---|---|---|
| **Build & Tooling** | High | ⚠ Broken CLI wrappers | `node_modules/.bin/eslint` & `tsc` fail when run via CLI; `package-lock.json` outside git root warning in Turbopack |
| **Linting & Types** | High | ✖ 26 ESLint issues | **9 errors** (React 19 compiler hooks rules, unescaped HTML entities, CJS require, `any` cast), **17 warnings** (unused variables/imports) |
| **SSR / Hydration** | High | ✖ Mismatch risks | Direct `sessionStorage` in render body, localStorage-dependent initial state in `GoalPage`, unguarded store access on dynamic routes |
| **Runtime & Demo UX**| High | ✖ Broken demo flows | Preview mode bounces to `/goal` on 9/10 lessons (stubs without API key); demo cache never populated; nested `<a>` inside `<label>` |
| **Domain Engines** | Medium | ⚠ Validation bypass | `patchEngine.ts` skips `validateDAG` on concept/block virtual delete due to `continue` in `switch` |
| **Test Coverage** | Medium | ✖ 0 tests | Web project has 0 tests; legacy iOS XCTest coverage was not ported to TypeScript |

---

## 2. Environment & Configuration Analysis

### 2.1 Dependencies & Engine (`package.json`)
- **Next.js**: `16.3.5` (Next.js 16 App Router Canary release).
- **React**: `19.2.8` & **React DOM**: `19.2.8` (React 19 with strict React compiler lint rules).
- **TypeScript**: `^5`
- **Zustand**: `^5.0.15`
- **Mermaid**: `^12.0.0`
- **React-Markdown**: `^10.1.0`

### 2.2 Next.js & Turbopack Configuration (`next.config.ts`)
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Required so that Zustand doesn't SSR-error on localStorage access
  // (all store usage is behind 'use client')
};

export default nextConfig;
```
**Observations**:
1. When running `npm run build`, Turbopack emits:
   ```
   ⚠ Warning: Next.js ignored package-lock.json in /Users/sinanm because it is outside the current Git repository (/Users/sinanm/Documents/ChatGPT/AnyLearn).
   To use this directory, set `turbopack.root` in your Next.js config.
   ```
   *Recommendation*: Configure `turbopack: { root: __dirname }` or specify the project root in `next.config.ts` to silence the Turbopack warning.
2. The comment states `all store usage is behind 'use client'`. However, in Next.js App Router, **Client Components still execute on the server during SSR**. They are prerendered to HTML and hydrated in the browser.

### 2.3 Redundant Boilerplate CSS Files
The project contains two distinct global stylesheet implementations:
- `src/styles/globals.css` (658 lines, 22.8 KB): The real custom design system used by `src/app/layout.tsx`.
- `src/app/globals.css` (50 lines) & `src/app/page.module.css`: Unused default Next.js template artifacts.

---

## 3. Build & Command Verification

### 3.1 `npm run build`
- **Command**: `node node_modules/next/dist/bin/next build`
- **Exit Code**: `0` (Success)
- **Output Routes**:
  - `○ /` (Static)
  - `○ /_not-found` (Static)
  - `○ /build` (Static)
  - `○ /goal` (Static)
  - `ƒ /lesson/[id]` (Dynamic, server-rendered on demand)
  - `ƒ /quiz/[lessonId]` (Dynamic, server-rendered on demand)
  - `ƒ /report/[lessonId]` (Dynamic, server-rendered on demand)
  - `○ /roadmap` (Static)

### 3.2 `npm run lint` & Binary Symlink Defect
- **Command**: `npm run lint` (which executes `eslint`)
- **Exit Code**: `7` (Fatal Error)
- **Root Cause**:
  `node_modules/.bin/eslint` is a regular file copied from `node_modules/eslint/bin/eslint.js` rather than a symbolic link (`../eslint/bin/eslint.js`).
  When executed, `require("../lib/cli")` looks for `node_modules/lib/cli` instead of `node_modules/eslint/lib/cli`. When that throws, `onFatalError` attempts `require("../package.json")` (which resolves to `node_modules/package.json`), crashing Node with:
  ```
  Error: Cannot find module '../package.json'
  Require stack: /Users/sinanm/Documents/ChatGPT/AnyLearn/node_modules/.bin/eslint
  ```
- **Direct Verification**:
  Running ESLint directly via Node:
  ```bash
  node node_modules/eslint/bin/eslint.js .
  ```
  Executes successfully and detects **26 problems (9 errors, 17 warnings)**.
- **Fix**: Update `package.json` script:
  ```json
  "lint": "node node_modules/eslint/bin/eslint.js ."
  ```
  (Matching how `dev`, `build`, and `start` already use `node node_modules/next/dist/bin/next ...`).

### 3.3 `npx tsc --noEmit` & TypeScript Binary Defect
- **Command**: `npx tsc --noEmit`
- **Exit Code**: `1` (Fatal Error)
- **Root Cause**: Same defect as ESLint: `node_modules/.bin/tsc` is a flat copy instead of a symlink, failing on `require('../lib/tsc.js')`.
- **Direct Verification**:
  ```bash
  node node_modules/typescript/bin/tsc --noEmit
  ```
  Exits with code `0` (No TypeScript compile errors found).

---

## 4. ESLint Errors & Warnings Inventory

Running `node node_modules/eslint/bin/eslint.js .` identified 9 errors and 17 warnings across 8 files:

### 4.1 The 9 ESLint Errors
| # | File | Line:Col | Rule | Problem Description | Recommended Fix Strategy |
|---|---|---|---|---|---|
| **E1** | `src/app/build/page.tsx` | 39:5 | `react-hooks/immutability` | `buildCourse` is accessed before declaration in `useEffect`. | Move `async function buildCourse` above `useEffect` or wrap in `useCallback` defined prior to `useEffect`. |
| **E2** | `src/app/goal/page.tsx` | 102:83 | `react/no-unescaped-entities` | Unescaped apostrophe: `What's your end goal?` | Replace `'` with `&apos;` (`What&apos;s your end goal?`). |
| **E3** | `src/app/quiz/[lessonId]/page.tsx` | 127:20 | `react/no-unescaped-entities` | Unescaped apostrophe: `You're struggling with...` | Replace `'` with `&apos;` (`You&apos;re struggling with...`). |
| **E4** | `src/app/report/[lessonId]/page.tsx` | 231:13 | `react/no-unescaped-entities` | Unescaped double quote before `{lesson.title}` | Replace with `&quot;` or `&ldquo;`. |
| **E5** | `src/app/report/[lessonId]/page.tsx` | 231:28 | `react/no-unescaped-entities` | Unescaped double quote after `{lesson.title}` | Replace with `&quot;` or `&rdquo;`. |
| **E6** | `src/app/roadmap/page.tsx` | 18:21 | `react-hooks/set-state-in-effect` | `useEffect(() => { setMounted(true); }, [])` calls setState synchronously in effect. | Use React 18/19 `useSyncExternalStore(subscribe, () => true, () => false)` to detect client hydration cleanly. |
| **E7** | `src/components/ApiKeyModal.tsx` | 56:30 | `@typescript-eslint/no-require-imports` | `const { useStore } = require('@/lib/store');` inside dynamic import callback. | Replace with static top-level ES `import { useStore } from '@/lib/store';` or `const { useStore } = await import('@/lib/store');`. |
| **E8** | `src/components/ApiKeyModal.tsx` | 128:52 | `react/no-unescaped-entities` | Unescaped apostrophe: `browser's localStorage` | Replace `'` with `&apos;` (`browser&apos;s`). |
| **E9** | `src/lib/store.ts` | 139:12 | `@typescript-eslint/no-explicit-any` | `as any` used on fallback storage object for `createJSONStorage`. | Import `StateStorage` from `zustand/middleware` and type as `as StateStorage`. |

### 4.2 The 17 ESLint Warnings (Unused Variables & Imports)
| # | File | Line:Col | Identifier | Rule | Fix |
|---|---|---|---|---|---|
| **W1** | `src/app/goal/page.tsx` | 23:9 | `setBuilding` | `@typescript-eslint/no-unused-vars` | Remove unused store selector |
| **W2** | `src/app/lesson/[id]/page.tsx` | 23:10 | `flaggedBlock` | `@typescript-eslint/no-unused-vars` | Wire up to block report dialog or remove |
| **W3** | `src/app/lesson/[id]/page.tsx` | 24:10 | `showReport` | `@typescript-eslint/no-unused-vars` | Wire up to modal or remove |
| **W4** | `src/app/page.tsx` | 6:10 | `ApiKeyStore` | `@typescript-eslint/no-unused-vars` | Remove unused import |
| **W5** | `src/app/quiz/[lessonId]/page.tsx` | 3:20 | `useEffect` | `@typescript-eslint/no-unused-vars` | Remove unused import |
| **W6** | `src/app/quiz/[lessonId]/page.tsx` | 18:9 | `applyPatch` | `@typescript-eslint/no-unused-vars` | Remove or wire up to adaptive update |
| **W7** | `src/components/ApiKeyModal.tsx` | 3:20 | `useEffect` | `@typescript-eslint/no-unused-vars` | Remove unused import |
| **W8** | `src/components/ApiKeyModal.tsx` | 21:10 | `show` | `@typescript-eslint/no-unused-vars` | Remove unused state |
| **W9** | `src/components/ApiKeyModal.tsx` | 21:16 | `setShow` | `@typescript-eslint/no-unused-vars` | Remove unused state setter |
| **W10** | `src/components/RoadmapGraph.tsx` | 4:37 | `Lesson` | `@typescript-eslint/no-unused-vars` | Remove unused type import |
| **W11** | `src/components/RoadmapGraph.tsx` | 4:45 | `Module` | `@typescript-eslint/no-unused-vars` | Remove unused type import |
| **W12** | `src/components/RoadmapGraph.tsx` | 43:25 | `totalW` | `@typescript-eslint/no-unused-vars` | Omit or prefix with underscore `_totalW` |
| **W13** | `src/components/RoadmapGraph.tsx` | 43:33 | `totalH` | `@typescript-eslint/no-unused-vars` | Omit or prefix with underscore `_totalH` |
| **W14** | `src/lib/patchEngine.ts` | 2:60 | `Block` | `@typescript-eslint/no-unused-vars` | Remove unused type import |
| **W15** | `src/lib/patchEngine.ts` | 2:67 | `Lesson` | `@typescript-eslint/no-unused-vars` | Remove unused type import |
| **W16** | `src/lib/patchEngine.ts` | 2:75 | `TaskCard` | `@typescript-eslint/no-unused-vars` | Remove unused type import |
| **W17** | `src/lib/store.ts` | 6:37 | `MasteryRecord` | `@typescript-eslint/no-unused-vars` | Remove unused type import |

---

## 5. SSR & Hydration Mismatch Anti-Patterns

### 5.1 Critical Hydration Hazards

#### Hazard 1: Direct `sessionStorage` in Render Body (`src/app/build/page.tsx:171`)
```tsx
<p className="text-muted text-sm">
  {sessionStorage.getItem('anylearn-goal')?.slice(0, 80) ?? ''}
</p>
```
- **Mechanism**: During SSR / static page generation (`○ /build`), `sessionStorage.getItem('anylearn-goal')` evaluates to `null` (rendering empty text `""`). In browser hydration, the user has entered a goal in `sessionStorage`, evaluating to `"I want to learn..."`.
- **Result**: Immediate React Hydration mismatch error:
  `Text content does not match server-rendered HTML.`
- **Fix**: Store `goal` in component state (`const [goalText, setGoalText] = useState('')`) initialized inside `useEffect`, or defer rendering until mounted.

#### Hazard 2: LocalStorage State Mismatch in Goal Page (`src/app/goal/page.tsx:28`)
```tsx
const [showModal, setShowModal] = useState(!ApiKeyStore.has());
```
- **Mechanism**:
  - On SSR: `typeof window === 'undefined'` $\rightarrow$ `ApiKeyStore.has()` returns `false` $\rightarrow$ `showModal` initializes to `true`. Server renders `<ApiKeyModal />`.
  - On Client Hydration: User already configured an API key in localStorage $\rightarrow$ `ApiKeyStore.has()` returns `true` $\rightarrow$ `showModal` initializes to `false`. Client renders `<div className="page">...Goal Input...</div>`.
  - React detects complete DOM tree discrepancy between server `<ApiKeyModal>` and client `<GoalPage>`:
    `Hydration failed because the initial UI does not match what was rendered on the server.`
- **Fix**: Initialize `showModal` to a default that matches SSR (or `false`), and check `ApiKeyStore.has()` inside a `useEffect` or client-mounted hook before displaying/hiding the modal.

#### Hazard 3: SSR/Client Discrepancies in Dynamic Routes (`/quiz`, `/report`, `/lesson`)
In `src/app/quiz/[lessonId]/page.tsx` (lines 29-44) and `src/app/report/[lessonId]/page.tsx` (lines 43-49):
- During SSR: Zustand store has `course === null` (persisted store is in client `localStorage`).
  - `/quiz`: Renders `<div className="card">No quiz yet</div>`.
  - `/report`: Renders `<button>← Roadmap</button>`.
- During Client Hydration: `course` is loaded from localStorage.
  - `/quiz`: If quiz questions exist, renders active Question 1 form.
  - `/report`: Renders full issue diagnosis form.
- **Fix**: Use a mounted guard or standard loader skeleton during initial hydration so that server and initial client render produce identical markup.

#### Hazard 4: Timezone/Locale-Sensitive Date Formatting (`src/app/roadmap/page.tsx:231`)
```tsx
<span className="text-xs text-dim">{new Date(entry.timestamp).toLocaleString()}</span>
```
- **Mechanism**: `toLocaleString()` produces different strings depending on server timezone/locale (e.g. UTC) vs client browser locale (e.g. `en-US` or user's local timezone).
- **Status**: Currently protected by `if (!mounted) return null;`, but if mounted guard is modified or removed, this will trigger hydration mismatch.
- **Fix**: Retain mounted guard or use deterministic date formatting (`toISOString()` or date-only format).

---

## 6. Runtime & Logic Hazards

### 6.1 Demo / Preview Mode Navigation Traps
1. **Stub Lesson Bounce-Back**:
   In `src/lib/fixture.ts`, `pcbCourseFixture` has 10 lessons. **Only 1 lesson (`l-elec-basics`) has `status: 'ready'`. The other 9 lessons have `status: 'stub'`.**
   When a user running in Preview Mode clicks on any of the 9 stub lessons:
   ```ts
   // src/app/lesson/[id]/page.tsx:38-39
   const apiKey = ApiKeyStore.get();
   if (!apiKey) { router.push('/goal'); return; }
   ```
   Because preview mode users have no API key, clicking on 90% of the lessons in the demo silently redirects them back to `/goal`!
2. **Demo Cache Miss**:
   In `src/lib/llmClient.ts:112-116`:
   ```ts
   if (isDemoMode) {
     const cached = cacheRead(key);
     if (cached) return JSON.parse(cached) as T;
     throw new LLMError('cacheMiss', 'No cached response for demo mode.');
   }
   ```
   `handlePreview()` in `ApiKeyModal.tsx` sets `localStorage.setItem('anylearn-demo-mode', 'true')`, but never seeds `anylearn-cache-*` entries. If any AI feature is triggered (generating a lesson, diagnosing an issue), it crashes with `LLMError: cacheMiss`.
3. **Fix Strategy**:
   - Provide pre-populated mock blocks for all fixture lessons, OR
   - Seed fixture cache responses in localStorage during `handlePreview()`, OR
   - Detect `isDemoMode` in `LessonPage` and generate instant mock content without redirecting to `/goal`.

### 6.2 `patchEngine.ts` DAG Validation Bypass
In `src/lib/patchEngine.ts`:
```ts
      case 'deleteLesson': {
        const id = op.lessonID;
        // Virtual delete for concepts
        if (id.startsWith('concept:')) {
          const cid = id.slice(8);
          draft.concepts = draft.concepts.filter(c => c.id !== cid);
          continue; // <-- Bypasses validateDAG(draft.concepts) below!
        }
        // Virtual delete for blocks
        if (id.startsWith('block:')) {
          const parts = id.split(':');
          if (parts.length !== 3) throw new PatchEngineError('unknownID', id);
          const lesson = draft.lessons[parts[1]];
          if (!lesson) throw new PatchEngineError('unknownID', parts[1]);
          draft.lessons[parts[1]] = { ...lesson, blocks: lesson.blocks.filter(b => b.id !== parts[2]) };
          continue; // <-- Bypasses validateDAG!
        }
        ...
        break;
      }
    }

    if (!validateDAG(draft.concepts)) throw new PatchEngineError('cyclicGraph');
```
- **Mechanism**: `continue` targets the enclosing `for (const op of patch.ops)` loop, completely skipping line 194 (`if (!validateDAG(draft.concepts))`).
- **Impact**: If an undo operation removes a concept that other remaining concepts depend on, it leaves dangling prerequisite IDs without validating graph integrity.
- **Fix**: Replace `continue` with `break;`.

### 6.3 Dead Code in `dagValidator.ts`
Lines 6–19 compute `adj` and `inDegree`, but their results are never used because lines 23–34 immediately recompute `inDeg` and `dependents`.
- **Fix**: Remove lines 6–19 to avoid confusion and unnecessary computation.

### 6.4 Interactive HTML Tag Inside `<label>` (`ApiKeyModal.tsx:101-108`)
An `<a>` tag (`https://aistudio.google.com/apikey`) is nested directly within `<label>`.
In HTML5, clicking a hyperlink inside a `<label>` can trigger the label's default behavior (focusing the password input), interfering with external link navigation.
- **Fix**: Place the anchor outside the `<label>` or style as an independent link element.

---

## 7. Test Suite Status

- **Existing Tests**: **0**. No Jest, Vitest, Playwright, or Cypress test files exist in the repository.
- **Acceptance Criteria**: The project prompt requires:
  - Existing test suites pass (N/A currently).
  - New tests are added for identified and fixed bugs, and they pass.
- **Recommendation**:
  Install `vitest` (or `jest` with `ts-node`) and add test suites for:
  1. `mastery.ts`: Mastery probability calculations, decay, adaptation thresholds.
  2. `dagValidator.ts`: Cycle detection, topological sort validity, dangling prerequisites.
  3. `patchEngine.ts`: All patch operations (`addConcept`, `insertLesson`, `replaceBlock`, `deleteLesson`, etc.), undo inverse operation verification, duplicate ID rejection.
  4. Hydration / Store serialization in `store.ts`.

---

## 8. Prioritized Remediation Roadmap

### Priority 0: Build & Lint Blockers
1. **Fix `package.json` lint command**:
   Update `"lint": "node node_modules/eslint/bin/eslint.js ."` in `package.json`.
2. **Fix 9 ESLint Errors**:
   - `src/app/build/page.tsx`: Move `buildCourse` above `useEffect`.
   - `src/app/goal/page.tsx`: Escape apostrophe in `What&apos;s`.
   - `src/app/quiz/[lessonId]/page.tsx`: Escape apostrophe in `You&apos;re`.
   - `src/app/report/[lessonId]/page.tsx`: Escape quotes with `&quot;` or `&ldquo;`/`&rdquo;`.
   - `src/app/roadmap/page.tsx`: Implement `useMounted` via `useSyncExternalStore`.
   - `src/components/ApiKeyModal.tsx`: Replace `require('@/lib/store')` with static import; escape `browser&apos;s`.
   - `src/lib/store.ts`: Replace `as any` with `as StateStorage`.

### Priority 1: SSR & Hydration Stability
1. **Fix `BuildPage` (`src/app/build/page.tsx:171`)**:
   Move `sessionStorage.getItem('anylearn-goal')` into state populated on mount.
2. **Fix `GoalPage` (`src/app/goal/page.tsx:28`)**:
   Ensure `showModal` initial state matches SSR and syncs client-side after mount.
3. **Add Consistent Hydration Guard**:
   Add a reusable `useHydrated` hook across all client pages to prevent flash or mismatch between unhydrated server HTML and localStorage-backed client state.

### Priority 2: Runtime & Demo UX Fixes
1. **Resolve Preview Mode Stub Lesson Redirect**:
   In `src/app/lesson/[id]/page.tsx`, handle demo mode so clicking stub lessons generates mock content or loads fixture data instead of redirecting to `/goal`.
2. **Fix `patchEngine.ts` Validation Bypass**:
   Change `continue` to `break` in `deleteLesson` virtual handler.
3. **Clean Up Unused Variables**:
   Remove all 17 unused variable/import warnings identified by ESLint.
4. **Fix Nested `<a>` in `<label>` in `ApiKeyModal.tsx`**.

### Priority 3: Verification & Test Infrastructure
1. Configure `vitest` in `package.json`.
2. Write unit tests for `mastery.ts`, `dagValidator.ts`, and `patchEngine.ts` to satisfy acceptance criteria.
