# Technical Architecture

## Stack (chosen for speed + native Web fit)

| Layer | Choice | Why |
|---|---|---|
| Language | **TypeScript 5.10** | Type-safe, built-in schema validation |
| UI Framework | **React/Next.js 15** | Declarative, smooth animations, App Router |
| Roadmap graph | **Custom React SVG Canvas** | Interactive DAG map; animates node insertion |
| State | **Zustand + `localStorage`** | No DB needed; instant resume on relaunch |
| AI | **Google Generative AI REST API** | Schema-validated JSON across providers |
| LLM | Gemini Flash-class (default) | Speed/free tier vs. quality; abstracted behind `llmClient.ts` |
| Resources | YouTube Data API v3 + Web Search | Real links, real metadata |
| Diagrams | Mermaid via `react-markdown` | LLM-authored diagrams cheaply |
| Diffs | Custom React `DiffView` | The Report/Fix "wow" moment |
| Demo | **Desktop Web Browser** | Judge-visible, runs locally |

Optional later: Supabase or Firebase for accounts and shared verified courses.

---

## Next.js project layout

```
anylearn-web/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout & navigation
│   │   ├── page.tsx                # Landing page
│   │   ├── goal/page.tsx           # Goal Intake View
│   │   ├── build/page.tsx          # Pipeline stepper
│   │   ├── roadmap/page.tsx        # React SVG graph + sidebar
│   │   ├── lesson/[id]/page.tsx    # Lesson Workspace & Blocks
│   │   ├── quiz/[lessonId]/page.tsx# Quiz Interface
│   │   └── report/[lessonId]/page.tsx # Report/Fix Interface
│   ├── components/
│   │   ├── BlockRenderer.tsx       # Renders typed Block array
│   │   ├── RoadmapGraph.tsx        # SVG DAG renderer
│   │   ├── MasteryRing.tsx         # Circular progress indicator
│   │   └── ApiKeyModal.tsx         # Secure key entry & Demo mode
│   ├── lib/
│   │   ├── llmClient.ts            # Gemini REST wrapper + retry
│   │   ├── prompts.ts              # System prompts
│   │   ├── models.ts               # TypeScript schemas
│   │   ├── mastery.ts              # updateMastery / detectTriggers
│   │   ├── patchEngine.ts          # apply / undo / validateDAG
│   │   ├── store.ts                # Zustand store + localStorage
│   │   └── fixture.ts              # Safe-mode fixture (committed)
│   └── styles/
│       └── globals.css             # Global CSS variables & layout
├── public/                         # Static assets
├── .env.local                      # API keys (gitignored)
├── next.config.ts                  # Next.js configuration
├── package.json                    # NPM dependencies
└── tsconfig.json                   # TypeScript config
```

---

## Data model (held in `store.ts`, persisted via `localStorage` as JSON)

```typescript
export interface Course {
  id: string;
  goal: string;
  profile: GoalProfile;
  version: number;
  concepts: Concept[];
  modules: Module[];
  lessons: Record<string, Lesson>;
  quizzes: Record<string, Question[]>;
  capstone?: any;
  changelog: ChangeEntry[];
}

export interface LearnerState {
  mastery: Record<string, MasteryRecord>;
  completedLessonIds: string[];
}

export interface MasteryRecord {
  p: number;
  attempts: number;
  misconceptions: Record<string, number>;
}
```

`inverseOps` are computed by `patchEngine.ts` → one-tap **Undo**.

---

## API contracts (called from `llmClient.ts` via `fetch`)

| Endpoint / Call | Input | Output |
|---|---|---|
| `calibrate()` | `goal: string` | `GoalProfile + [Question]` |
| `generateCourse()` | `goal, profile, mastery` | `concepts`, `curriculum` |
| `generateLesson()` | `courseSlice, lessonId, mastery` | `Lesson + [Question]` |
| `adapt()` | `roadmap, concepts, mastery, trigger, attempts` | `RoadmapPatch` |
| `reportFix()` | `report, lesson, context` | `FixPlan + VerifyResult + [PatchOp]` |

API keys live in `localStorage` for the demo. They are entered via the `ApiKeyModal` on the first visit.

---

## Core engines (deterministic, functional)

- **`mastery.ts`**: `updateMastery(state, question, option)`, `detectTriggers(state, course)`.
- **`patchEngine.ts`**: `applyPatch()`, `undoPatch()`, `validateDAG()`.

---

## Streaming & UX tactics

- UI updates eagerly where possible.
- **Safe mode**: load `fixture.ts` which populates the store instantly; mock `llmClient` returns cached responses. No API key needed.

---

## Security & privacy (minimal, intentional)

API keys in `localStorage` only; no backend server required for demo. Auth/DB explicitly out of scope for MVP.
