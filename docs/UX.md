# UX Specification (Web — React/Next.js)

**Design intent:** feels like a *learning product* (think a game skill-tree meets a great reading app), never a chat window. Every AI action leaves a visible, explainable trace. Native Web controls; smooth, meaningful animations; readable on desktop and mobile.

---

## Visual direction

- **Color:** dark canvas (glassmorphic aesthetic) with one accent color (blue/indigo). Mastery tints: grey (untouched), blue (in progress), amber (weak), green (solid).
- **Typography:** Inter or system sans-serif — large title for screen headers, body for lesson text, monospaced for code blocks. Minimum 16px body. High contrast.
- **Motion:** only where meaning changes — nodes growing onto the canvas, mastery ring fill animation. No decorative loops.
- **Demo target:** Desktop Web Browser. Key information visible without scroll on launch.

---

## Navigation structure

```
App Router
├── /goal                  (root on first launch)
├── /build                 (redirected after goal submitted)
└── /roadmap               (redirected after build; becomes persistent home)
    ├── /lesson/[id]       (linked from node tap)
    │   └── /quiz/[id]     (linked from lesson footer)
    └── /report/[id]       (linked from lesson footer button)
```

---

## Screens

### 1. Goal Intake (`/goal`)
- Single large Text Input ("What do you want to learn?") with placeholder.
- Example chips below: *PCB design*, *Options pricing*, *Beekeeping* — tap to fill.
- Primary button: **"Build my course →"** (full-width, accent color).

### 2. Build Screen (`/build`)
- Loading pipeline stepper tied to streaming stages:
  - *Understanding goal → Mapping concepts → Ordering prerequisites → Drafting modules → Finding sources*
- Progress is deterministic steps, not a spinner.

### 3. Roadmap (`/roadmap` - home)
- **Top area:** React SVG Canvas rendering modules as clusters; lessons as rounded-rect nodes; prerequisite edges as directional lines.
  - Tap a node → navigates to the lesson.
- **Persistent bottom rail:** *Next Best Action* card, overall progress bar, mastery rings per module.
- **Badges on nodes:** `Skippable (you know this)`, `Added for you`, `Fixed`.

### 4. Lesson Workspace (`/lesson/[id]`)
- Rendered markdown page with `BlockRenderer`.
- **Embedded YouTube player** (with creator credit + "why this fits").
- **Sticky footer:**
  - `Take quiz` · `Explain differently` · **`Report / Fix ⚑`** (accent-outlined, always visible).

### 5. Quiz (`/quiz/[id]`)
- One question per screen.
- After answer: correctness badge appears; explanation + (if wrong) the named misconception ("Common confusion: *schematic vs. layout*").
- Final summary screen: concept-level mastery bars update.

### 6. Report / Fix Page (`/report/[id]`)
- Type chips (incorrect, confusing, missing prerequisite, poor example, outdated, too hard, too easy, broken resource, I don't understand) + free-text input.
- **Result view (demo climax)** — page updates to show:
  1. **Diagnosis** — root cause card
  2. **Before / After diff** — side-by-side blocks
  3. **Verifier ✅** — claims checked list

---

## Interaction principles

1. Explain every roadmap change in one sentence naming the evidence.
2. Never change content silently — always changelog entry + Undo available.
3. Loading states show real pipeline progress, not generic spinners.
4. Errors degrade to partial content ("Resources unavailable — retry") without blocking learning.

---

## Accessibility & polish

- Color + icon (never color alone) for mastery states — meets WCAG AA contrast.
- Semantic HTML tags for screen readers.
- Keyboard-friendly navigation.
