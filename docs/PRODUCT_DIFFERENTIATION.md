# Product Differentiation — The 4 Moats

Selection filter: (a) obvious in a demo, (b) *behaviorally* different from chatting with a model, (c) feasible in a hackathon.
Considered but demoted: "remembers what you completed" (table stakes once state exists), "curated resources" (folded into Moat 4), "gamification" (not defensible).

---

## Moat 1 — The Living Course (environment, not conversation)
**Problem:** Chat gives scattered answers; the learner must know what to ask. Structure decays as the thread grows.
**Solution:** A generated **concept graph** (prerequisite DAG) → modules → lessons → tasks → quizzes → resources, held as one versioned object and rendered as a roadmap map + lesson workspace.
**Why chat alone doesn't equal it:** A chat can *describe* a curriculum, but the curriculum isn't an object with state, links, and a UI that stays consistent across sessions. Here, a quiz result, a resource and a lesson edit all reference the same concept IDs.
**Why learners care:** They see where they are, what's next, what's skipped and why. Unknown-unknowns are surfaced by the graph.
**Demo:** Enter goal → map appears with prerequisites; click a node → full lesson workspace. Say: "Nothing here was typed as a prompt after the first sentence."

## Moat 2 — Mastery-Driven Adaptation (understanding as data)
**Problem:** Nothing distinguishes "was told" from "understands." Paths are one-size-fits-all.
**Solution:** Every question maps to a **concept**; every wrong option maps to a **misconception**. A small mastery model updates per answer; when thresholds trip, AI proposes a **RoadmapPatch** (insert remedial micro-lesson, add practice, mark skippable) and the UI shows a **"What changed & why" diff**.
**Why chat alone doesn't equal it:** A chat may respond to your last answer, but doesn't maintain a per-concept model or rewrite a persistent path with an auditable diff.
**Why learners care:** No re-studying what they know; no being stuck on what they don't.
**Demo:** Diagnostic (skips "Ohm's law"); then deliberately miss 2 questions on "ground planes" → roadmap gains a remedial lesson, node turns amber, diff panel explains.

## Moat 3 — Report / Fix: the Self-Improving Loop
**Problem:** Wrong/confusing lessons stay wrong; fixing requires the learner to notice, re-prompt, and hope.
**Solution:** One-click report per lesson → context bundle (goal, concept, lesson, mastery, quiz history, feedback) → AI **diagnosis** (root cause, scope) → **patch** → independent **verifier** → **propagation** to dependent lessons/questions → **changelog + undo**.
**Why chat alone doesn't equal it:** Chat re-answers; it doesn't patch a shared artifact, check its own patch, or update everything that depended on the faulty content.
**Why learners care:** They can trust the course to get better, and see it happen.
**Demo:** Report "I don't get what a ground plane is" as *missing prerequisite* → new prerequisite micro-lesson inserted, downstream lesson edited to reference it, changelog entry, verifier ✅. Then click **Undo** to show control.

## Moat 4 — Grounded & Verified Content (trust by construction)
**Problem:** LLM lessons can be wrong; LLM-generated links are often fake; videos are scattered.
**Solution:** (i) LLM emits *search queries*, never URLs; server fetches real results (YouTube Data API + web search), filters, link-checks, and attaches each with attribution and a "why this fits" line; (ii) lessons carry `sources[]` and a **confidence badge**; (iii) a verifier pass runs on fixes and on high-stakes claims (numbers, standards).
**Why chat alone doesn't equal it:** Chat can cite, but resource linking isn't a systematic step with link validation and per-lesson attachment.
**Why learners care:** Fewer dead ends and fewer confident errors; creators get credit.
**Demo:** Open a lesson → embedded video with channel credit and "why this fits: shows KiCad trace routing at the stage you're at"; hover a claim → source chip; show a broken link auto-replaced (or pre-seeded to show the check).

---

## How the four fit together (the pitch)
> **Build** (Living Course) → **Understand** (Mastery) → **Adapt** (Roadmap patches) → **Repair** (Report/Fix) → **Trust** (Grounded & Verified).
> One learner goal; one object; every interaction changes the same object.
