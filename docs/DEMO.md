# Demo Script (4:30)

## Choice of topic: **"Learn PCB design from zero and design my own PCB."**
Why it works: (1) hidden prerequisites (electronics basics, schematic vs. layout, ground planes) make *adaptation* meaningful; (2) technical accuracy matters, so *verification* has stakes; (3) visual/tool-based resources show *grounding*; (4) has a tangible end artifact.
Backup topics (pre-cached): "Prompt engineering for RAG apps", "Beekeeping basics".

## Pre-demo setup (5 min before)
- `?demo=safe` course pre-generated; live mode **also** tested. Fresh localStorage. Wi-Fi + phone hotspot.
- Pre-plan the two "stumbles": on quiz Q3–Q4 you'll pick the ground-plane misconception options.
- Have the Report text ready: **"I don't understand what a ground plane is or why it matters."** (type: missing prerequisite)

## Timeline

| Time | Screen | Say | Shows |
|---|---|---|---|
| 0:00–0:25 | Slide/landing | "Ask ChatGPT how to learn PCB design and you get a great essay. Then *you* have to run the course. AnyLearn builds the course *and runs the loop around you*." | Problem framing |
| 0:25–0:55 | Intake | Type the goal. Chips: *end goal = design & order my first board*, *5 h/week*. Click 5-Q calibration; answer quickly (know Ohm's law; unsure on ground planes). | Personalization inputs |
| 0:55–1:30 | Build screen → Roadmap | "Watch: concepts → prerequisites → modules." Map grows. "Notice *Basic circuits* is marked **Skippable — you know this**." | Moat 1 + diagnostic |
| 1:30–2:10 | Lesson | Open "Schematics vs. layout". Point to worked example, checkpoint, **video with creator credit and 'why this fits'**, source chips. "Every link is real and link-checked; the model never writes URLs." | Moat 4 |
| 2:10–2:50 | Quiz | Answer 5 Qs; miss the two ground-plane items. Feedback: "Common confusion: *treats ground as just another trace*." | Misconception tagging |
| 2:50–3:20 | Adapt | Banner: **"Roadmap updated."** DiffPanel: + "Ground planes & return paths (10 min)" inserted; downstream lesson marked with a prerequisite; mastery ring amber. "It cites my evidence — *you chose X twice*." | Moat 2 |
| 3:20–4:05 | Report/Fix | Open the downstream lesson "Routing your first board". Click **Report/Fix** → type *"I don't understand what a ground plane is"*. Show: Diagnosis → Before/After diff → **Verifier ✅ (claims checked: …)** → *Also updated: 1 quiz question* → Changelog. Click **Undo** then **Redo**. | Moat 3 |
| 4:05–4:30 | Wrap | Capstone + next steps. "One sentence in. A living course out — built, adapted, repaired. **The AI is the engine; the product is the learning system.**" | Close |

## Optional 15-second closer
Show a real ChatGPT/Claude screenshot of the same prompt: a long answer, no state. Say: "Same model class. Different product." (Use a real capture; don't stage one.)

## If the judge names a topic
Say: "Great — live." Run live generation (≈ 15 s) while narrating the pipeline steps. If it stalls > 25 s, switch: "Here's one I prepared" (safe mode). Never apologize; narrate.

## Failure playbook
| Failure | Response |
|---|---|
| API timeout | Auto-fall back to cached fixture; keep talking through the pipeline |
| Video embed blocked | Show link card (still has attribution + why) |
| Verifier fails | Show "needs review" state — actually a strength: "it doesn't ship unverified fixes" |
| Projector low-res | 125% browser zoom; map defaults to focus mode |

## Rehearsal checklist
- [ ] Full run under 4:30 ×3 · [ ] offline safe-mode run · [ ] Undo/Redo works · [ ] All three moats named out loud once · [ ] One teammate role-plays a hostile judge with the Q's in JUDGE_DEFENSE.md
