# Technical Architecture

## Stack (chosen for speed + fit)
| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | One repo: UI + API routes; fast deploy on Vercel |
| UI | Tailwind CSS + shadcn/ui + Framer Motion | Polished quickly; motion sells the "adaptation" moments |
| Roadmap map | **React Flow** (`@xyflow/react`) | Interactive concept/roadmap graph = the visual hook |
| State | **Zustand** with `persist` (localStorage) | No DB needed; instant resume |
| AI | Vercel AI SDK (`generateObject`, streaming) + Zod | Schema-validated JSON across providers |
| LLM | Gemini Flash-class (default), Claude Sonnet-class (fix/verify, optional) | Speed/free tier vs. quality; abstracted behind `llm.ts` |
| Resources | YouTube Data API v3 + Tavily (or Brave) search | Real links, real metadata |
| Diagrams | Mermaid (client render) | LLM-authored diagrams cheaply |
| Diffs | `diff` / custom before-after component | The Report/Fix "wow" |
| Deploy | Vercel (or local for demo) | Zero infra |

Optional later: Supabase (Postgres) for accounts and shared verified courses.

## Repo layout
```
anylearn/
├── docs/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Goal intake
│   │   ├── course/[id]/page.tsx      # Roadmap map + progress
│   │   ├── course/[id]/lesson/[lessonId]/page.tsx
│   │   └── api/
│   │       ├── calibrate/route.ts    # diagnostic generation
│   │       ├── course/route.ts       # SSE: concept graph -> curriculum
│   │       ├── lesson/route.ts       # lesson + quiz
│   │       ├── resources/route.ts    # search -> link check -> rerank
│   │       ├── adapt/route.ts        # RoadmapPatch
│   │       ├── report/route.ts       # diagnose/fix -> verify -> propagate
│   │       └── tutor/route.ts
│   ├── lib/
│   │   ├── llm.ts                    # provider wrapper + retry
│   │   ├── schemas.ts                # Zod schemas (see AI.md)
│   │   ├── prompts.ts                # from PROMPTS.md
│   │   ├── mastery.ts                # update + trigger detection
│   │   ├── patch.ts                  # applyPatch / invertPatch / validateDag
│   │   ├── resources.ts              # youtube, search, linkcheck
│   │   └── fixtures/                 # safe-mode course + cached AI responses
│   ├── store/course.ts               # Zustand store
│   └── components/                   # RoadmapMap, LessonView, BlockRenderer, QuizCard,
│                                     # MasteryRing, DiffPanel, ReportDialog, Changelog, PipelineProgress
└── .env.local
```

## Data model (client-held, JSON)
```ts
interface Course {
  id: string; goal: string; profile: GoalProfile; version: number;
  concepts: Concept[]; modules: Module[]; lessons: Record<Id, Lesson>;
  quizzes: Record<Id /*lessonId*/, Question[]>; capstone: Capstone;
  changelog: ChangeEntry[];
}
interface LearnerState {
  mastery: Record<Id /*conceptId*/, { p: number; attempts: number; misconceptions: Record<string, number> }>;
  completedLessonIds: Id[]; attempts: Attempt[];   // {questionId, optionId, correct, ts}
}
interface ChangeEntry {
  id: Id; ts: string; source: "adapt" | "report" | "propagate";
  summary: string; reason: string; ops: PatchOp[]; inverseOps: PatchOp[];
  verify?: VerifyResult; reportText?: string; undone?: boolean;
}
```
`inverseOps` are computed by `applyPatch` (snapshot of replaced entities) → one-click **Undo**.

## API contracts
| Route | Request | Response |
|---|---|---|
| `POST /api/calibrate` | `{goal}` | `{profile, diagnostic: Question[]}` |
| `POST /api/course` (SSE) | `{goal, profile, mastery}` | events: `step`, `concepts`, `curriculum`, `done` |
| `POST /api/lesson` | `{course slice, lessonId, mastery}` | `{lesson, quiz}` |
| `POST /api/resources` | `{lessonId, queries, objectives, level}` | `{resources: Resource[]}` |
| `POST /api/adapt` | `{roadmap, concepts, mastery, trigger, attempts}` | `{patch: RoadmapPatch}` |
| `POST /api/report` | `{report, lesson, context}` | `{fixPlan, verify, propagation: PatchOp[]}` |
| `POST /api/tutor` | `{lesson, mastery, question}` | `{answer, altExplanationBlock, suggestReport}` |

Keys stay server-side (env). Simple in-memory cache keyed by hash(prompt) for demo speed and safe mode.

## Core engines (deterministic, unit-testable)
- **`mastery.ts`**: `updateMastery(state, question, option)`, `detectTriggers(state, course)` → the exact formulas in [AI.md](AI.md).
- **`patch.ts`**: `validate(patch)` (whitelist ops, ≤ 3 ops, IDs exist, DAG acyclic, no deleting completed lessons), `apply(course, patch) → {course, inverse}`, `undo(course, entry)`.
- **`resources.ts`**: `search → linkCheck (HEAD, 3 s timeout) → rerank`; never returns unverified URLs.

## Latency & UX tactics
- Stream concept graph first, curriculum second → map "grows" on screen.
- Lazy-generate lessons; prefetch next lesson + quiz + resources when a lesson opens.
- Skeleton blocks stream in as they arrive.
- Demo **safe mode** with fixtures (see [SETUP.md](SETUP.md)).

## Security & privacy (minimal, intentional)
API keys server-side only; no PII stored; localStorage only; basic rate limit per IP on API routes. Auth/DB explicitly out of scope for MVP.

## Build plan (scale to your hackathon length; hours assume ~24 h)
| Phase | Hours | Deliverable | Cut line |
|---|---|---|---|
| 0 | 0–2 | Scaffold, Zod schemas, `llm.ts`, store | — |
| 1 | 2–6 | Goal intake → course gen (SSE) → React Flow roadmap | **Must** |
| 2 | 6–10 | Lesson gen + BlockRenderer + resources (YouTube + link check) | **Must** |
| 3 | 10–14 | Quiz + mastery + adapt patch + diff panel | **Must** |
| 4 | 14–18 | Report/Fix + verify + changelog + Undo | **Must** |
| 5 | 18–21 | Diagnostic/skip, progress dashboard, confidence badges | Should |
| 6 | 21–24 | Fixtures/safe mode, polish, demo rehearsal x3 | **Must** |
Drop first if behind: tutor, capstone view, propagation step (keep a stub), diagnostic (seed mastery manually for the demo).

## Testing checklist
Unit-test `mastery.ts` and `patch.ts` (they carry the demo). Run the full demo path 5× on the venue Wi-Fi and once offline in safe mode.
