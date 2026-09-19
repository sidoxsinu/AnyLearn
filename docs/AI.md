# AI Architecture

## Principle
**AI proposes, the engine disposes.** Models generate content and patch *proposals* as schema-validated JSON. Deterministic code validates (Zod, DAG checks), applies whitelisted patch ops, computes mastery, and renders. Keys live in `localStorage` securely on the client side for the demo. In-memory/storage response cache keyed by `SHA256(prompt)` for demo speed and safe mode. The model never mutates state directly and never supplies URLs.

## Provider strategy
- Single `llmClient.ts` wrapper: `generate<T>(system: string, user: string, apiKey: string, options: LLMOptions): Promise<T>`.
- **Default:** Gemini Flash-class model via the **Google Generative AI REST API** (fast, generous free tier, native structured output).
- Strategy: *fast model* for roadmap/lessons/quizzes; *stronger model* (if available) for **Report/Fix + Verify**. Verifier ideally uses a **different model/temperature** than the fixer to reduce correlated errors.
- All calls: temperature 0.4 (generation), 0.1 (verify/diagnose); retry once on `JSON.parse` decode failure, passing the validation error back.

## Pipeline overview
```
Goal ─► [1 Calibrate] ─► [2 Course Gen] ─► [3 Resource Search] (async per lesson)
                              │
                       Learner opens lesson
                              ▼
                       [4 Lesson Gen] ─► [5 Quiz Gen]
                              │
                       Learner answers
                              ▼
                  Mastery Engine (deterministic)
                              │ threshold trips
                              ▼
                       [6 Adapt → RoadmapPatch] ─► Patch Engine ─► UI diff
                              
        Learner reports ─► [7 Diagnose+Fix → FixPlan] ─► [8 Verify] ─► Patch Engine ─► propagate ─► changelog
```

## Stage details

### 1. Calibrate
Input: goal text. Output: `GoalProfile` (topic, endArtifact, inferredLevel, constraints) + optional 5-question **diagnostic** spanning the *foundational concepts* of the topic. Diagnostic results seed `mastery` and let Course Gen skip known material.

### 2. Course generation
Two-step to keep latency low and quality high:
1. **Concept graph:** 20–35 atomic concepts with `prereqIds`, ordered by DAG (validate acyclic; auto-repair by dropping the lowest-confidence back-edge).
2. **Curriculum:** cluster into 4–6 modules; 3–5 lesson *stubs* each (title, objectives, conceptIds, `resourceQueries`, task idea); capstone project; "skippable" flags where diagnostic mastery ≥ 0.8.
Stream concept graph first via Gemini SDK streaming; curriculum second → canvas nodes "grow" on screen.

### 3. Lesson generation (lazy + prefetch next)
Block-based content (see schema). Rules: every lesson has objectives, ≥ 1 worked example, ≥ 1 checkpoint, common mistakes, and a hands-on task. Uses lesson stub + concept definitions + learner mastery to set depth ("you already know X, so we go fast").
Lazy-generate lessons on `LessonWorkspaceView` appear; prefetch next lesson + quiz + resources when a lesson opens.
Skeleton blocks appear with `.redacted(reason: .placeholder)` while streaming.
Demo **safe mode** with fixtures (see [SETUP.md](SETUP.md)).

### 4. Quiz generation
4–6 questions from *the lesson content just generated* (not from thin air). Each question has `conceptId`, `difficulty`, per-option `misconception` tags, and an `explanation` referencing the lesson block ID. At least one application question; one "transfer" question at a new context.

### 5. Adaptive learning
**Detection (deterministic):**
```
p_new = p_old + α·(score − p_old)     α = 0.5 (first 2 attempts on concept), else 0.3
score = 1 correct | 0 wrong | 0.5 partial;  wrong on hard question decays by 0.75×
weak: p < 0.5 · ok: 0.5–0.8 · solid: ≥ 0.8
```
Trigger `adapt` when: a concept is weak after ≥ 2 answers, OR a misconception repeats ≥ 2×, OR diagnostic marks ≥ 0.8.
**Proposal (AI):** given weak concepts, misconceptions, the current roadmap and prerequisites → returns `RoadmapPatch` (ops below) with a human-readable `reason` per op.
**Guardrails:** max 3 ops per patch; can't delete completed lessons; inserted lessons must reference existing or newly-added concepts; DAG re-validated.

### 6. Resource recommendation
1. Stub carries `resourceQueries` (2–4, diverse: "beginner visual", "official docs", "worked walkthrough").
2. Server → YouTube Data API `search.list` + `videos.list` (duration, channel) and a web search API (Tavily/Brave/Google CSE).
3. Filter: duration window, English (or learner language), de-dupe, drop shorts/clickbait heuristics.
4. **Link check:** HEAD/oEmbed; drop non-200.
5. LLM **rerank/annotate** from the *verified candidate list only* → picks 2–3 and writes `why` (constrained to candidate IDs → cannot invent links).
6. Attribution: channel/site, title, link; YouTube via official embed/player with credit.

### 7. Report / Fix
```
ReportInput { type, text?, lessonId, selectedBlockId? }
   ▼ context bundle: goal, concept graph slice, module, lesson JSON, mastery for lesson concepts,
                     quiz attempts on lesson, previous reports/changelog, resource list
   ▼ Diagnose+Fix (strong model) ─► FixPlan
   ▼ Verify (separate call)      ─► VerifyResult {verdict, issues[]}
        fail ─► one repair round (feed issues back) ─► verify again ─► else mark "needs review"
   ▼ Patch Engine (versioned; stores inverse for Undo)
   ▼ Propagate: find lessons/questions sharing conceptIds → AI flags & patches (only if impacted)
   ▼ Changelog entry + toast + diff view
```
Report types map to default *scopes*: `missing_prerequisite` → roadmap-level (insert lesson + concept edge); `incorrect/outdated` → block-level + web-check via grounding; `too_hard/too_easy` → lesson-level rewrite with mastery-informed depth; `broken_resource` → re-run resource search; `dont_understand` → alternate explanation block + optional micro-checkpoint.

### 8. Learner assistance ("Explain differently")
Lesson-scoped tutor: context limited to current lesson + mastery; may produce an `alt_explanation` block that can be **pinned** to the lesson. It is *not* the primary UI.

## Structured output schemas (TypeScript / Zod-shaped)
```ts
type Id = string;

interface Concept { id: Id; name: string; summary: string; prereqIds: Id[] }

type Block =
  | { id: Id; type: "markdown"; md: string }
  | { id: Id; type: "worked_example"; title: string; steps: { text: string; why: string }[] }
  | { id: Id; type: "callout"; kind: "mistake" | "tip" | "warning"; md: string }
  | { id: Id; type: "checkpoint"; conceptId: Id; question: string; answer: string; hint?: string }
  | { id: Id; type: "diagram"; mermaid: string; caption: string };

interface Lesson {
  id: Id; moduleId: Id; title: string; conceptIds: Id[]; objectives: string[];
  status: "stub" | "ready"; skippable?: { reason: string };
  blocks: Block[]; task?: { title: string; instructions: string[]; successCriteria: string[] };
  resourceQueries: string[]; resources: Resource[];
  sources: { title: string; url: string }[]; unsourced?: boolean;
  confidence: "high" | "medium" | "low"; version: number;
}

interface Question {
  id: Id; conceptId: Id; type: "mcq"; difficulty: 1 | 2 | 3; prompt: string;
  options: { id: Id; text: string; misconception?: string }[]; correctOptionId: Id;
  explanation: string; refBlockId?: Id;
}

interface Resource { id: Id; kind: "video" | "article" | "docs"; title: string; url: string;
  creator: string; durationMin?: number; why: string; verifiedAt: string }

type PatchOp =
  | { op: "insert_lesson"; afterLessonId: Id; lesson: Pick<Lesson,"title"|"conceptIds"|"objectives"|"resourceQueries">; reason: string }
  | { op: "add_concept"; concept: Concept; reason: string }
  | { op: "replace_block"; lessonId: Id; blockId: Id; block: Block; reason: string }
  | { op: "insert_block"; lessonId: Id; afterBlockId: Id | null; block: Block; reason: string }
  | { op: "add_practice"; lessonId: Id; task: Lesson["task"]; reason: string }
  | { op: "mark_skippable"; lessonId: Id; reason: string }
  | { op: "reorder"; moduleId: Id; lessonIds: Id[]; reason: string }
  | { op: "replace_question"; lessonId: Id; questionId: Id; question: Question; reason: string }
  | { op: "refresh_resources"; lessonId: Id; queries: string[]; reason: string };

interface RoadmapPatch { summary: string; ops: PatchOp[] }          // ≤ 3 ops

interface FixPlan {
  diagnosis: { rootCause: string; category: string; confidence: number };
  scope: "block" | "lesson" | "roadmap";
  learnerFacingMessage: string;           // shown in UI
  patch: RoadmapPatch;
  propagationHints: { conceptId: Id; why: string }[];
}
interface VerifyResult { verdict: "pass" | "fail"; issues: { severity: "high"|"low"; detail: string }[]; factualClaimsChecked: string[] }
```

## Trust layer summary
- No model-authored URLs · link checks · `sources[]` + confidence badge · verifier on fixes · API keys in `.env.local` (gitignored); no PII stored; `localStorage` only; no backend server required for demo. Auth/DB explicitly out of scope for MVP. Low-confidence topics get wider prerequisites and explicit "unsourced" flags instead of bluffing.

## Failure handling
`TypeScript` decode failure → retry once with error message; second failure → fall back to cached/safe fixture (demo) or show "Regenerate" button (prod). Timeouts: 25 s hard cap per call; UI shows skeleton + partial results via `Task` cancellation.
