# UX Specification

**Design intent:** feels like a *learning product* (think a game-tech-tree meets a good docs site), never a chat window. Every AI action leaves a visible, explainable trace.

## Visual direction
- Dark-neutral canvas with one accent color; mastery colors: grey (untouched), blue (in progress), amber (weak), green (solid), dashed outline (skippable).
- Large type, generous spacing, projector-legible (min 16 px body, high contrast).
- Motion only where meaning changes: nodes growing in, patch insertion animation, mastery ring fill.

## Screens

### 1. Goal intake
Single large text field ("What do you want to learn?") + example chips (PCB design, options pricing, beekeeping). After submit: two chips (end-goal, hrs/week) and toggle "Quick 5-question calibration (recommended)".

### 2. Build screen
Pipeline stepper tied to **real** stages: *Understanding goal → Mapping concepts → Ordering prerequisites → Drafting modules → Finding sources*. Concept nodes pop into a mini-graph as they stream in.

### 3. Roadmap (home)
- Left: React Flow map (modules as clusters; lessons as nodes; prerequisite edges). Click node → side drawer preview.
- Right rail: **Next best action** card, overall progress, mastery rings per module, **Changelog** tab.
- Badges: `Skippable (you know this)`, `Added for you`, `Fixed`, confidence dot.
- "What changed & why" banner slides in after any patch → opens **DiffPanel**.

### 4. Lesson workspace
- Center: BlockRenderer (text, worked example stepper, callouts, Mermaid diagram, inline checkpoints with reveal).
- Right: **Resources** (video embed with creator credit + "why this fits"), **Sources** chips, **Task** card.
- Footer: `Take quiz` · `Explain differently` · **`Report / Fix this`** (always visible, accent-outlined).
- Each block has a hover "flag this block" icon that pre-fills `selectedBlockId`.

### 5. Quiz
One question per screen; after answer: correctness, explanation, and (if wrong) the named misconception ("Common confusion: schematic vs. layout"). Summary shows concept-level mastery bars moving.

### 6. Report / Fix dialog & result
Dialog: type chips (incorrect, confusing, missing prerequisite, poor example, outdated, too hard, too easy, broken resource, I don't understand) + optional text.
Result view (the demo climax): **Diagnosis** → **Before/After diff** → **Verifier ✅ (claims checked)** → **Also updated** (dependents) → **Undo**.

### 7. Completion
Capstone brief with success criteria + "what to learn next" suggestions (new goals that reuse mastered concepts).

## Interaction principles
1. Explain every change in one sentence naming the evidence.
2. Never change content silently; always changelog + Undo.
3. Loading states are progress, not spinners.
4. Errors degrade to partial content ("Resources unavailable — retry") without blocking learning.
5. Keyboard-friendly quiz (1–4 keys) for fast demo.

## Accessibility & polish (cheap wins)
Alt text on diagrams, focus rings, color + icon (not color alone) for mastery states, responsive down to tablet.
