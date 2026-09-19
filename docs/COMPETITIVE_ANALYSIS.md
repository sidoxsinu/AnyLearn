# Competitive Analysis

> Positioning, not benchmarks. Products change quickly — general assistants have been adding study/guided-learning modes. **Verify current features before pitching**, and never claim a competitor "can't" do something; claim what AnyLearn does *by default, by design*.

## Summary matrix (default experience)

| | Structured course object | Tracks concept mastery | Adapts path | Repair loop w/ verification | Grounded, linked resources | Any topic |
|---|---|---|---|---|---|---|
| ChatGPT / Claude / Gemini | Via prompting; lives in chat | Limited/implicit | Conversationally | Manual re-prompting | Varies; not per-lesson | Yes |
| Perplexity | No | No | No | No | Strong citations | Yes |
| YouTube | Playlists only | No | No | No | Is the resource | Mostly popular |
| Coursera / Udemy | Yes (human-made) | Coarse (quiz scores) | Mostly no | Instructor updates, slow | Own content | Popular topics |
| Traditional LMS | Container | Grades | No | N/A | Uploaded | Depends on admin |
| **AnyLearn** | **Yes, generated + versioned** | **Per concept + misconception** | **Roadmap patches w/ diff** | **Yes** | **Search-sourced, link-checked** | **Yes** |

> AnyLearn is a **native Next.js web application** — a purpose-built learning environment, not a conversational chat interface.

## Per-competitor

### ChatGPT / Claude / Gemini
- **Good at:** breadth, flexible explanation, Socratic dialogue, code help, memory/projects features, canvases/artifacts.
- **Gaps for self-directed learning:** the *unit of interaction is a message*. The learner must steer; structure exists only as long as they maintain it. Progress and mastery are not first-class objects. Bad lessons are fixed by re-asking, with no changelog or verification. Resources are typically not tied to a specific lesson with checks.
- **AnyLearn stance:** use them as engines (we do); own the *state, structure, and loop* around them.

### Perplexity
- **Good at:** cited, current answers to questions.
- **Gap:** optimized for answering, not sequencing or teaching over weeks.
- **AnyLearn stance:** borrow the citation discipline; apply it per lesson and to resource curation.

### YouTube
- **Good at:** rich demonstrations, free, huge creator base.
- **Gaps:** no personal sequence; prerequisite gaps discovered by frustration; quality variance; no practice/assessment; algorithm optimizes watch time.
- **AnyLearn stance:** treat YouTube as a **resource layer** — attach the right video to the right lesson, with attribution and a "why this fits" line.

### Coursera / Udemy
- **Good at:** expert-authored, polished, credentials, community.
- **Gaps:** fixed for the average learner; exist mainly for popular topics; long-form commitments; update cycles are slow; hard to say "I already know 40% of this."
- **AnyLearn stance:** long-tail topics and personalized goals ("design *my* PCB"), not credentials.

### Traditional LMS (Moodle, Canvas, Google Classroom)
- **Good at:** administration, cohorts, grading, compliance.
- **Gaps:** content must be authored elsewhere; no generation, no adaptation.
- **AnyLearn stance:** a *content-and-adaptation layer* an LMS could embed later.

## Where AnyLearn must be different (and is)
1. **Environment, not conversation** — persistent course object rendered as a native Web UI.
2. **Understanding as data** — concept mastery + misconception tracking.
3. **Self-repair** — Report/Fix with verification, diff, undo, propagation.
4. **Trust by construction** — grounded sources, no hallucinated links, confidence badges.
5. **Native Web** — full React/Next.js app; feels like a premium product, not a generic chat window.

## Honest weaknesses to own
- Content quality ≤ underlying model quality + retrieved sources; we reduce and expose risk rather than eliminate it.
- No human expert review in MVP (future: community-verified layer).
- Cold-start for very obscure topics depends on web coverage; we show low-confidence badges and widen prerequisites instead of bluffing.
