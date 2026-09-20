# UX Specification — Neo-Brutalist Design System

## 1. Design Intent & Aesthetic Philosophy

**AnyLearn** adopts an authentic **Neo-Brutalist** aesthetic engineered for clarity, readability, and tactile engagement:
- **No Clutter & No Synthetic Noise:** Every element corresponds to live learner data. No placeholder activity graphs, fake friends, or mock metrics.
- **High-Contrast Readability:** Pure black typography (`#000000`) over clean white cards (`#FFFFFF`) and a warm paper base (`#F4F0EA`) guarantees optimal legibility and eliminates eye fatigue.
- **Tactile & Responsive Interaction:** Heavy strokes, crisp hard-edge drop shadows, and responsive button depression give the application a physical, notebook-like feel.
- **Natural Document Flow:** Elimination of rigid viewport clipping (`overflow-hidden`) allows pages to scroll naturally across desktop, tablet, and mobile screens.

---

## 2. Color Palette & Design Tokens

```
Base Backdrop:     #F4F0EA  (Warm Paper Neutral)
Card Canvas:       #FFFFFF  (Crisp White)
Primary Accent:    #FFE600  (Electric Yellow — Hero cards, active tabs, star emblem)
Success / Mastery: #00F59B  (Acid Mint — Completed lessons, solid mastery >= 0.8)
Knowledge / Info:  #38BDF8  (Sky Blue — Concept tags, learning objectives)
Secondary Pill:    #DDD6FE  (Electric Violet — Adaptive updates, capstones)
Critical / Alert:  #FF5A36  (Hot Coral — Diagnostic reports, weak concepts < 0.5)
Text & Borders:    #000000  (100% Pure Black — Zero faded grays)
```

### Strokes & Shadows:
- **Major Cards & Buttons**: `border: 3px solid #000000; box-shadow: 4px 4px 0px #000000; border-radius: 8px;`
- **Hero Banners**: `border: 3px solid #000000; box-shadow: 6px 6px 0px #000000; border-radius: 10px;`
- **Badges & Small Controls**: `border: 2px solid #000000; box-shadow: 2px 2px 0px #000000; border-radius: 4px;`
- **Hover Micro-Interaction**: `transform: translate(-2px, -2px); box-shadow: 6px 6px 0px #000000;`
- **Active / Click Depression**: `transform: translate(2px, 2px); box-shadow: 1px 1px 0px #000000;`

---

## 3. Core Screen Architecture

```
App Shell (Sticky Navigation Header)
├── 🗺️ Roadmap (/roadmap)           ── Default Home Dashboard
│   ├── Curriculum List View        ── Module cards, lesson stubs, skippable badges
│   └── SVG Concept Graph (DAG)     ── Interactive node map & dependency connectors
├── 🎯 Goal Intake (/goal)          ── Learning goal input, milestone artifacts, weekly hours
├── ⚡ Build Pipeline (/build)       ── Real-time stepper displaying curriculum construction
├── 📖 Lesson Workspace (/lesson/[id]) ── Block-based modular lesson reader & tasks
├── ⚡ Quiz Runner (/quiz/[lessonId]) ── Formative assessment with misconception feedback
└── 📊 Report Engine (/report/[lessonId]) ── In-browser diagnostic & patch repair
```

---

## 4. Screen Specifications

### 4.1 Top Navigation Bar (`AppShell.tsx`)
- **Brand Emblem**: 42×42px square in Electric Yellow (`#FFE600`) with bold 3px black border and `★` symbol, paired with bold "AnyLearn" wordmark and "Adaptive LMS" subtitle.
- **Navigation Tabs**: Pill buttons (`🗺️ Roadmap`, `📖 Lesson`, `⚡ Quiz`, `📊 Report`, `🎯 New Goal`) with active state highlighting in `#FFE600`.
- **Live Progress Metric**: Acid Mint pill (`✓ X/Y (Z%)`) reflecting actual completed lesson counts from the Zustand store.
- **Settings Action**: Quick access to Gemini API key management, demo course switcher, and store reset.

### 4.2 Living Roadmap (`/roadmap`)
- **Hero Card**: Vibrant `#FFE600` background, high-contrast black heading displaying active course topic, "Continue Learning →" CTA, and active lesson quick-link card.
- **Live Stats Row**: 4-column responsive grid (`.brutal-grid-4`) displaying Total Lessons, Completed Lessons, Concepts Mastered, and Adaptive Updates.
- **Curriculum Controls**: Real-time search filter and instant toggle between Curriculum List and SVG Concept Graph.
- **Interactive SVG DAG**: Visual rendering of concept clusters, dependency arrowheads, completion checkmarks, and skippable indicators.

### 4.3 Lesson Workspace (`/lesson/[id]`)
- **Header**: Back to roadmap link, module context, lesson title, and estimated completion time.
- **Content Blocks**: Discriminated union rendering via `BlockRenderer`:
  - *Objectives*: Blue-accented container with actionable bullet points.
  - *Markdown Text*: High-contrast typographic blocks with code formatting.
  - *Worked Examples*: Expandable step-by-step walk-throughs explaining both *what* and *why*.
  - *Interactive Checkpoints*: Inline question cards with revealable explanations and hints.
  - *Callouts*: Yellow (warning), blue (tip), and red (common mistake) bordered containers.
  - *Practice Tasks*: Hands-on application projects tying concepts to the learner's milestone artifact.
- **Sticky Action Bar**: "Complete & Take Quiz →" and "⚑ Report Issue" buttons pinned to the viewport bottom.

### 4.4 Quiz Runner (`/quiz/[lessonId]`)
- **Formative Questions**: Generated directly from lesson material.
- **Misconception Tagging**: Each incorrect distractor is tied to a specific misconception. Upon selection, the card highlights red, displaying the exact misconception and remedial explanation.
- **Mastery Feedback**: Concept mastery bars update dynamically with Bayesian probability increases or decreases.

### 4.5 In-Browser Diagnostic & Patch Engine (`/report/[lessonId]`)
- **Targeted Feedback**: Learners can report issues at the lesson or specific block level across categories (missing prerequisite, confusing explanation, incorrect fact, broken resource).
- **Dual-Model Repair**: AI diagnoses the root cause, generates an atomic patch, verifies the fix, and updates the curriculum in ~15 seconds with full undo history.
