# Implementation Plan: AnyLearn Frontend Redesign (Dei Reference Design)

## Overview
Decompose the project into 4 concrete, sequentially gated milestones:
- **Milestone 1**: Design System, Tokens, App Shell & Base Assets
- **Milestone 2**: Component Library & Reusable UI Atoms
- **Milestone 3**: 7 Page Redesigns & Motion Polish
- **Milestone 4**: End-to-End Verification, Accessibility & Hardening

---

## Milestone 1: Design System, Tokens, App Shell & Base Assets
**Assigned Worker**: `worker_m1`
**Files Owned**:
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/AppShell/*` (`AppShell.tsx`, `TopBar.tsx`, `CurvedNotchNav.tsx`, `SecondaryPanel.tsx`, `FloatingToolbar.tsx`, `AvatarDropdown.tsx`)
- `src/components/FluentEmoji.tsx`
- `public/assets/*` (3D emojis & illustrations)

**Iteration Loop**:
1. Worker implements dependencies, token configs, AppShell, and asset helpers. Runs `npm test` and `npm run build`.
2. 2 Reviewers independently verify token fidelity, accessibility (aria-label on all toolbar buttons, curved notch SVG, WCAG AA contrast), build pass, test pass.
3. 2 Challengers verify responsive behavior (375px mobile vs 1440px desktop) and absence of hardcoded hex colors.
4. 1 Forensic Auditor verifies zero cheating and authentic implementation.
5. Gate: All pass -> advance to Milestone 2.

---

## Milestone 2: Component Library & Reusable UI Atoms
**Assigned Worker**: `worker_m2`
**Files Owned**:
- `src/components/MasteryRing.tsx`
- `src/components/ApiKeyModal.tsx`
- `src/components/RoadmapGraph.tsx`
- `src/components/BlockRenderer.tsx`
- `src/components/DiffView.tsx`
- `src/components/StatusBadge.tsx`
- `src/components/IconButton.tsx`
- `src/components/StatTrio.tsx`
- `src/components/AvatarStack.tsx`
- `src/components/EmptyCard.tsx`

**Iteration Loop**:
1. Worker restyles existing components and creates new components. Runs `npm test` (all 80 tests must pass) and `npm run build`.
2. 2 Reviewers independently review component contracts, props, and visual token adherence.
3. 2 Challengers verify `renderToStaticMarkup` compatibility and static assertion hooks (`var(--mastery-...)`, `block-callout`, `roadmap-svg`).
4. 1 Forensic Auditor verifies implementation authenticity.
5. Gate: All pass -> advance to Milestone 3.

---

## Milestone 3: 7 Page Redesigns & Motion Polish
**Assigned Worker**: `worker_m3`
**Files Owned**:
- `src/app/page.tsx`
- `src/app/goal/page.tsx`
- `src/app/build/page.tsx`
- `src/app/roadmap/page.tsx`
- `src/app/lesson/[id]/page.tsx`
- `src/app/quiz/[lessonId]/page.tsx`
- `src/app/report/[lessonId]/page.tsx`

**Iteration Loop**:
1. Worker overhauls all 7 pages to match Dei specs with Framer Motion animations. Runs `npm test` and `npm run build`.
2. 2 Reviewers independently verify each of the 7 pages against requirements and functional state preservation.
3. 2 Challengers stress-test user flows (goal intake -> build -> roadmap -> lesson -> quiz -> remedial patch -> report & AI fix).
4. 1 Forensic Auditor verifies implementation authenticity.
5. Gate: All pass -> advance to Milestone 4.

---

## Milestone 4: E2E Verification, Accessibility & Hardening
**Assigned Workers**: Reviewers, Challengers, Forensic Auditor
**Objectives**:
1. 11-point verification checklist evaluation across all 7 pages.
2. Complete hex audit across `src/components/` and `src/app/` (zero hardcoded hexes).
3. WCAG AA accessibility audit (contrast, aria-labels, focus rings).
4. Full build (`npm run build`) and test (`npm test`) pass (80/80 green).
5. Forensic Auditor final victory audit report.
