# AnyLearn — Product Requirements Document

## 1. Vision
AnyLearn turns a single sentence ("I want to learn PCB design from zero and eventually design my own board") into a **persistent, structured learning environment** built around that learner's goal — and then **adapts and repairs that environment** as the learner studies.

Not "ChatGPT that generates courses." A **living course**: a typed, versioned object (concept graph → modules → lessons → quizzes → projects → resources) that is rendered as a product UI, updated by learner performance, and patched when learners report problems.

## 2. Problem
Self-directed learners of arbitrary topics face:
1. **No structure** — chat answers are isolated; the learner must know what to ask next. Unknown-unknowns stay unknown.
2. **No memory of understanding** — nothing tracks what they actually grasp vs. what they were told.
3. **No trust signal** — LLM content may be wrong or stale; a wrong lesson silently stays wrong.
4. **Fragmentation** — explanations in one tab, videos in another, practice nowhere, progress nowhere.
5. **Static courses** — Coursera/Udemy/LMS courses exist for popular topics only, and never adapt to the individual.

## 3. Existing alternatives
See [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md). Summary: general assistants are conversation-first and flexible but stateless-by-default at the *course* level; video/course platforms are curated but static and limited to popular topics; LMSs are containers, not content generators.

## 4. Differentiation (summary)
1. **Living Course** — goal-specific concept graph rendered as a real product (map, lessons, quizzes, projects, resources all linked).
2. **Concept-level Mastery + Adaptive Roadmap** — every quiz item is tagged to a concept and (for distractors) a *misconception*; performance rewrites the roadmap with a visible diff.
3. **Report / Fix loop** — scoped diagnosis → patch → independent verification → propagation → changelog. Course quality improves with use.
4. **Grounded & Verified Content** — the LLM never invents URLs; resources come from real search APIs and are link-checked; lessons carry citations and a verifier pass.

Details: [PRODUCT_DIFFERENTIATION.md](PRODUCT_DIFFERENTIATION.md).

## 5. Target users
- **Primary:** Motivated self-learners (students, career switchers, makers) picking up a *specific* skill with an end goal ("design my own PCB", "build a RAG app", "understand options pricing").
- **Secondary:** Students filling gaps beside a formal curriculum; community/club workshop leaders needing quick structured material.
- **Demo persona:** Software developer with little electronics background who wants to design and order a first PCB.

## 6. Goals / Non-goals
**Goals (MVP)**
- Any topic → personalized roadmap in < 20 s.
- Lessons rendered from structured JSON (no chat UI as the primary surface).
- Concept mastery tracking with visible adaptation.
- Report/Fix with visible diff + verification.
- Real, verified resources attached per lesson.
- A flawless 4–5 minute live demo.

**Non-goals (MVP)**
- Auth, payments, multi-user, real DB, scalability, moderation, mobile apps.
- Human-expert review, certification, spaced-repetition scheduling (future).
- Guaranteeing factual perfection — we provide *detection, citation and repair*, not infallibility.

## 7. User journey
1. **Goal** — types goal in one text box.
2. **Calibrate** — 2 quick chips (end-goal artifact, hours/week) + optional 5-question diagnostic generated for *that* topic.
3. **Build** — visible generation pipeline (real steps: mapping concepts → ordering prerequisites → drafting modules → sourcing resources).
4. **Roadmap** — interactive concept/roadmap map; skipped-because-known nodes are marked.
5. **Learn** — open a lesson: blocks, worked example, inline checkpoints, resources, hands-on task.
6. **Quiz** — concept-tagged questions with misconception-aware feedback.
7. **Adapt** — mastery updates; roadmap patches with a "What changed & why" diff.
8. **Report / Fix** — learner flags an issue; AI diagnoses, patches, verifies; changelog updated.
9. **Next steps** — capstone project + suggested follow-on goals.

## 8. Features (priority)
| ID | Feature | Priority |
|---|---|---|
| F1 | Goal intake + calibration | P0 |
| F2 | Course generation (concept graph, modules, roadmap) | P0 |
| F3 | Roadmap map view with mastery colors | P0 |
| F4 | Lazy lesson generation + block renderer | P0 |
| F5 | Quiz generation (concept + misconception tagged) | P0 |
| F6 | Mastery engine + adaptive roadmap patches + diff view | P0 |
| F7 | Report / Fix with diagnosis, patch, verify, propagate, changelog | P0 |
| F8 | Grounded resources (YouTube + web) with attribution & link check | P0 |
| F9 | Progress dashboard (mastery, completion, next best action) | P1 |
| F10 | In-lesson "Explain differently" tutor (scoped to lesson) | P1 |
| F11 | Capstone project + rubric | P1 |
| F12 | Course export (Markdown/JSON), import | P2 |
| F13 | Confidence badges on lessons | P1 |
| F14 | Safe demo mode (cached fixtures) | P0 |

## 9. User stories
- As a learner, I enter a goal and get a personalized path so I don't have to know what to ask.
- As a learner, I take a short diagnostic so I don't re-study what I know.
- As a learner, I see which concepts I've mastered so I know where I stand.
- As a learner, when I fail a concept, the roadmap adds a fix so I'm not stuck.
- As a learner, I report a confusing/wrong lesson and see it get repaired, so I trust the course.
- As a learner, I see sources and can open real videos/articles tied to the exact lesson.
- As a learner, I finish with a real project so the goal is concrete.
- As a judge, I can see *why* this isn't a chatbot in under 60 seconds.

## 10. Functional requirements
**FR-1 Intake:** Accept free text goal (≤ 300 chars); infer topic, end-goal artifact, level; ask ≤ 2 clarifiers.
**FR-2 Course generation:** Produce a Course JSON (schema in [AI.md](AI.md)) with 5–9 concepts-clusters → 4–6 modules → 3–5 lessons each (stubs), prerequisites DAG (validated acyclic), capstone.
**FR-3 Lesson generation:** On open, generate lesson blocks (≥ 1 worked example, ≥ 1 checkpoint, common mistakes, task). Prefetch next lesson.
**FR-4 Quizzes:** 4–6 questions/lesson; each tagged with `conceptId`, difficulty; each wrong option tagged with `misconception`.
**FR-5 Mastery:** Maintain `mastery[conceptId] ∈ [0,1]`; update after each answer; thresholds weak < 0.5, solid ≥ 0.8.
**FR-6 Adaptation:** When any concept < 0.5 after a quiz (or diagnostic shows ≥ 0.8), request a `RoadmapPatch`; apply deterministically; show diff.
**FR-7 Report/Fix:** Report types (§11); build context bundle; get `FixPlan`; run verifier; apply patch; propagate to dependents; append changelog; allow **undo**.
**FR-8 Resources:** LLM emits search queries only; server fetches from YouTube Data API/web search; filter, dedupe, link-check; each resource shows title, creator, source, and "why this fits this lesson".
**FR-9 Progress:** Persist state in localStorage; resume on reload.
**FR-10 Safe mode:** `?demo=safe` loads pre-generated course and cached AI responses for the demo topic.

## 11. Report / Fix taxonomy
`incorrect` · `confusing` · `missing_prerequisite` · `poor_example` · `outdated` · `too_hard` · `too_easy` · `broken_resource` · `dont_understand` (free text always allowed).

## 12. AI requirements
- All AI calls return **schema-validated JSON** (Zod); auto-retry once with the validation error.
- AI **proposes**; a deterministic patch engine **applies** (whitelisted ops only).
- No model-invented URLs, ever.
- Every generated lesson includes `sources[]` (from grounding/search) or an explicit `unsourced: true` flag shown as a badge.
- Verifier pass on every Report/Fix output.
- Latency budgets: roadmap ≤ 20 s, lesson ≤ 12 s, adapt ≤ 8 s, fix ≤ 15 s (incl. verify).

## 13. UX requirements
See [UX.md](UX.md). Key: no chat as primary surface; roadmap map is the home screen; every AI change is *visible* (diffs, toasts, changelog); generation progress reflects real pipeline steps; works on projector resolution.

## 14. MVP scope
In: F1–F8, F14, plus F9/F13 minimal. Out: auth, DB, export, spaced repetition, multi-course library (single active course + list from localStorage acceptable).

## 15. Future scope
Spaced repetition; teacher/community-vetted "verified" course layer where fixes from many learners merge; course sharing/forking; offline packs; voice tutor; project review (upload PCB Gerber → AI feedback); calendar planning; multi-language.

## 16. Acceptance criteria
- AC-1: Entering "learn PCB design from zero" yields a roadmap with ≥ 4 modules and valid prerequisite DAG in ≤ 20 s.
- AC-2: Opening a lesson renders ≥ 5 typed blocks, ≥ 1 checkpoint, ≥ 2 verified resources.
- AC-3: Failing 2+ questions on one concept produces a visible patch (inserted remedial lesson or added practice) and updates the map.
- AC-4: Passing the diagnostic on a concept marks its lessons "Skippable" with reason.
- AC-5: Submitting a Report shows: diagnosis, before/after diff, verifier status, affected downstream items, changelog entry; **Undo** restores the previous version.
- AC-6: No resource URL in the UI fails a link check at render time (broken ones hidden/replaced).
- AC-7: Reload preserves progress.
- AC-8: Safe mode completes the full demo path with no network AI calls.

## 17. Success metrics
**Hackathon:** judges can state the 4 differentiators after the demo; zero demo-breaking failures; ≥ 1 live Report/Fix visibly improves content.
**Product (post-hackathon):** goal→first lesson completion rate; quiz-driven adaptation acceptance; % reports resolved and verified; concept mastery gain per hour; 7-day return rate; report-repeat rate on same lesson (should fall).
