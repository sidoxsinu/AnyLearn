# Technical Architecture

## 1. Architectural Principles

AnyLearn is engineered around a strict boundary:
> **"AI proposes, the engine disposes."**

Generative models output schema-validated JSON proposals. All state mutations, topological ordering, Bayesian calculations, and course rollbacks are executed by pure, deterministic TypeScript engines.

```
                      ┌────────────────────────────────────────┐
                      │            Generative AI               │
                      │  (Gemini REST API via llmClient.ts)   │
                      └──────────────────┬─────────────────────┘
                                         │ JSON Proposal
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        Deterministic Engine Layer                            │
│  ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────┐  │
│  │   dagValidator.ts     │  │      mastery.ts       │  │  patchEngine.ts  │  │
│  │ • Kahn's algorithm    │  │ • Bayesian update     │  │ • 8 atomic ops   │  │
│  │ • Cycle detection     │  │ • Dynamic alpha       │  │ • Exact inverses │  │
│  │ • Acyclic DAG repair  │  │ • Misconception audit │  │ • Versioning     │  │
│  └───────────────────────┘  └───────────────────────┘  └──────────────────┘  │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Verified State Mutation
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                             State & UI Layer                                 │
│  • Zustand State Store with localStorage persistence (store.ts)              │
│  • Next.js 16 App Router (React 19, TypeScript)                              │
│  • Neo-Brutalist Design System (globals.css)                                 │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | High-performance React 19 server/client components, streaming SSR, and zero-config static routing. |
| **Language** | TypeScript 5+ | Strict compile-time type safety across domain models and discriminated unions. |
| **State Management** | Zustand (`src/lib/store.ts`) | Lightweight, un-opinionated state machine with `localStorage` persistence and hydration safety. |
| **Design System** | Custom Neo-Brutalist CSS (`src/app/globals.css`) | High contrast, bold 3px strokes, hard 4px/6px drop shadows, pure black text, and zero clipping. |
| **Graph Visualization** | Custom SVG Canvas (`RoadmapGraph.tsx`) | Deterministic layout rendering concept clusters, prerequisite edges, and status markers. |
| **AI Integration** | Google Generative AI REST API | Client-side direct execution with strict JSON schema enforcement and prompt caching. |
| **Testing** | Node.js Native Runner (`node:test`) | Ultra-fast (<500ms), zero external dependency test execution. |

---

## 3. Project Directory Structure

```
AnyLearn/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root HTML layout and AppShell wrapper
│   │   ├── globals.css             # Neo-Brutalist design tokens and layout classes
│   │   ├── page.tsx                # Client router redirect
│   │   ├── goal/page.tsx           # Goal intake and calibration
│   │   ├── build/page.tsx          # Real-time course generation pipeline
│   │   ├── roadmap/page.tsx        # Curriculum list view and interactive DAG graph
│   │   ├── lesson/[id]/page.tsx    # Block-based lesson workspace
│   │   ├── quiz/[lessonId]/page.tsx# Formative quiz runner
│   │   ├── report/page.tsx         # Fallback report redirect
│   │   └── report/[lessonId]/page.tsx # Diagnostic and patch engine interface
│   ├── components/
│   │   ├── AppShell/               # Top navigation bar, brand star, and settings modal
│   │   ├── ApiKeyModal.tsx         # Modal for Gemini API key setup and demo loading
│   │   ├── BlockRenderer.tsx       # Discriminated union renderer for lesson blocks
│   │   ├── MasteryRing.tsx         # SVG circular mastery ring and progress bars
│   │   └── RoadmapGraph.tsx        # Interactive SVG DAG graph component
│   └── lib/
│       ├── models.ts               # Core domain models and schema definitions
│       ├── dagValidator.ts         # Topological sorting and cycle resolution
│       ├── mastery.ts              # Bayesian Knowledge Tracing engine
│       ├── patchEngine.ts          # Atomic course mutation engine
│       ├── llmClient.ts            # Client-side LLM REST client with caching
│       ├── prompts.ts              # Zero-shot / few-shot prompts with schemas
│       ├── store.ts                # Zustand store with persistent storage
│       └── fixture.ts              # Medical and PCB course demo fixtures
├── tests/                          # 80-test 4-tier automated test suite
├── public/                         # Static assets and icons
├── package.json                    # Dependencies and scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## 4. Deterministic Engines

### 4.1 Graph Validation (`src/lib/dagValidator.ts`)
Concepts form a Directed Acyclic Graph (DAG) where edges represent prerequisite dependencies. The validator implements Kahn's algorithm:
1. Calculates in-degrees for all nodes.
2. Identifies source nodes (in-degree = 0).
3. Iteratively peels visited nodes, detecting any back-edges or circular dependencies.
4. Auto-repairs cycles during AI course generation by dropping the lowest-confidence prerequisite edge.

### 4.2 Bayesian Mastery Engine (`src/lib/mastery.ts`)
Learner comprehension is tracked per atomic concept ID:
$$p_{\text{new}} = p_{\text{old}} + \alpha \cdot (\text{score} - p_{\text{old}})$$
- Score assignments: Correct = $1.0$, Incorrect = $0.0$, Partial = $0.5$.
- Dynamic learning rate: $\alpha = 0.5$ for the first two attempts, $\alpha = 0.3$ thereafter.
- Difficulty penalty: Misses on advanced questions incur a $0.75\times$ score attenuation.
- Misconception clustering: Repetitive selection of the same distractor misconception flags a targeted knowledge gap.

### 4.3 Atomic Patch Engine (`src/lib/patchEngine.ts`)
All course mutations are executed through 8 versioned, atomic operations:
1. `addConcept`: Inserts an atomic concept into the knowledge graph.
2. `insertLesson`: Places a new lesson into a module with prerequisite linking.
3. `replaceBlock`: Updates a single content block inside an existing lesson.
4. `insertBlock`: Appends or injects a worked example or checkpoint.
5. `addPractice`: Updates hands-on application tasks.
6. `markSkippable`: Bypasses lessons when prior diagnostic mastery exceeds $0.8$.
7. `reorder`: Reorganizes lesson sequences inside a module.
8. `replaceQuestion`: Modifies quiz questions to reflect updated content.

**Invariants Enforced:**
- Maximum of 3 operations per patch transaction.
- Completed lessons cannot be deleted or disrupted.
- Every patch calculates its exact mathematical inverse, enabling lossless **Undo** and **Redo**.
