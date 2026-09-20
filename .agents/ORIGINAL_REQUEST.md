# Original User Request

## 2026-09-19T20:54:08Z

# Teamwork Project Prompt

> Requested team: The full large-scale agent team

Review and fix any remaining bugs in the current AnyLearn web implementation.

Working directory: /Users/sinanm/Documents/ChatGPT/AnyLearn
Integrity mode: benchmark

## Requirements

### R1. Codebase Audit
Review the Next.js application codebase for runtime errors, hydration mismatches, and build warnings.

### R2. Bug Fixes
Implement robust fixes for any identified issues, ensuring the app remains fully functional client-side.

## Acceptance Criteria

### Testing & Verification
- [ ] Agent-as-judge verifies that the fixes correctly resolve the identified bugs without introducing new issues.
- [ ] Existing test suites (e.g. XCTest or Jest, if applicable) pass successfully.
- [ ] New tests are added for the identified and fixed bugs, and they pass.

## 2026-09-20T01:44:00Z

Redesign the entire AnyLearn frontend (Next.js 15 App Router, `/Users/sinanm/Documents/ChatGPT/AnyLearn`) to match the "Dei" reference design — a black-shell app with pastel cards, Framer Motion animations, and a floating toolbar. All existing logic, routes, and data flow are preserved; only the UI layer changes.

Working directory: /Users/sinanm/Documents/ChatGPT/AnyLearn
Integrity mode: benchmark

## Requirements

### R1. Design System & Tokens
Install Tailwind CSS v4 and Framer Motion fresh into the Next.js 15 project. Extract the Dei color palette (mint #CFF7D3, lavender #F1D3FA, butter #FBE8B0, sky #D5F1F7, pink #FF8FC7, black #0A0A0A, off-white #F7F7F7, grey #F0F0F0) and typography tokens (Outfit or Plus Jakarta Sans, bold geometric) into `tailwind.config` and `globals.css`. No hardcoded colors in components — all values must come from the token system.

### R2. App Shell (`layout.tsx`)
Black (~#0A0A0A) top bar with the "AnyLearn" wordmark, icon-only nav with a curved notch under the active item, and an avatar + dropdown on the right. Off-white (#F7F7F7) content panel with ~40px radius inside. Right-hand secondary panel in #F0F0F0. Floating bottom toolbar: black pill with colorful circular tool buttons (lavender, sky, pink, butter, mint, dark "+"). Fully responsive — sidebar collapses below `lg`, shell radius shrinks on mobile. All icon buttons have `aria-label`.

### R3. Page Redesigns (7 pages)
Redesign all 7 pages to match the Dei reference spec, preserving all existing logic, routing, and data flow:

1. `/` — Landing: black shell hero, giant headline with 3D emoji, pastel card collage (tilted, overlapping), black pill CTA.
2. `/goal` — Centered mint/lavender card with large textarea, emoji suggestion chips (🧬 Biology, 💻 Python, 🎸 Guitar), black CTA. Search-bar style input.
3. `/build` — Vertical stepper of pastel cards (Understanding goal 🎯 → Mapping concepts 🗺️ → Writing lessons 📝 → Building quizzes 🧠); active card is tilted with spinner, done cards show "Completed 👏" mint pill, pending are dashed-border.
4. `/roadmap` — Two-column: left SVG DAG with pastel card nodes linked by dashed green connectors (locked nodes get a lock icon, current node is the tilted lavender featured card, stat trio at top: Total / Completed / Upcoming); right "My Events"-style sidebar for node details and next tasks. Animate new node insertion with spring pop-in.
5. `/lesson/[id]` — Each block rendered as a pastel card by type (text=white, video=lavender+big play button, diagram=sky, tip=butter, key idea=mint). Progress pill + sidebar with mastery ring and next lesson.
6. `/quiz/[lessonId]` — One question per large card, option pills. Correct → mint + ✅, wrong → soft red + ❌ + butter explanation card. Confetti 🎉 result screen.
7. `/report/[lessonId]` — Split: report form left, DiffView right (red-tinted removed lines, mint-tinted added lines), animated "AI patching 🔧" pill, "Fixed ✨" badge on completion.

### R4. Component Library
Restyle and rebuild: MasteryRing (thick ring, pastel gradient, percent + emoji at 100%), ApiKeyModal (blurred backdrop, white rounded card, masked input, "Use Demo Mode 🚀" mint button, 🔒 helper text), RoadmapGraph, BlockRenderer, DiffView. Build new: pill status badges ("Completed 👏", "Upcoming ⏱️"), round icon buttons (52px), stat trio, avatar stacks, dashed-border empty cards. App shell design: black top bar with the "AnyLearn" wordmark, icon-only nav with a label on the active item, curved notch, avatar and dropdown on the right.

### R5. Motion & Polish
All animations via Framer Motion: hover lift on cards, spring transitions between states, tilted active card (~-4° rotate), card pop-in spring on new roadmap node insertion, confetti animation on quiz completion. Use 3D-style emojis (Microsoft Fluent Emoji via npm `@fluentui/react-emoji`, or SVG/PNG fallbacks in `/public/assets/`) in headings and badges: 🎓 🧠 🗺️ 🎯 🔒 ✅ ❌ 🎉 👏 ⏱️ 🔧 ✨ 🚀 📚 🧬 💡. Generate or source illustration assets (hero card collage, empty-state illustration, logo mark) and save to `/public/assets/`. List any assets that still need manual generation.

## Verification

An independent agent-as-judge reviews each of the 7 pages against this checklist:
- [ ] Black app shell present with curved notch under active nav item
- [ ] Off-white content panel with correct border radius
- [ ] All design tokens sourced from `tailwind.config` (no hardcoded hex values in component files)
- [ ] Pastel cards present on the page with correct color assignments per type
- [ ] Floating bottom toolbar (black pill + colorful buttons) rendered
- [ ] Pill status badges ("Completed 👏", "Upcoming ⏱️") present where applicable
- [ ] Framer Motion animations wired (hover lift, spring, tilt)
- [ ] Fully responsive (works at 375px and 1440px breakpoints)
- [ ] All icon buttons have `aria-label`
- [ ] `npm run build` passes with 0 errors
- [ ] `npm test` passes (all 80 existing logic tests green)

## Acceptance Criteria

### Build & Type Safety
- [ ] `npm run build` exits 0 with no TypeScript errors
- [ ] `npm test` — all 80 existing tests pass (logic unchanged)

### Design Fidelity (agent-as-judge)
- [ ] Every page passes the 11-point verification checklist above
- [ ] No hardcoded hex colors in component files
- [ ] Tailwind v4 + Framer Motion installed and used throughout
- [ ] 3D emoji assets present in headings and badges on all 7 pages

### Accessibility
- [ ] All interactive icon buttons have `aria-label`
- [ ] Focus rings visible in keyboard navigation
- [ ] Color contrast meets WCAG AA on all pastel backgrounds
