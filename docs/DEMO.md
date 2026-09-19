# Demo Script (4:30) — Web Browser

## Choice of topic: **"Learn PCB design from zero and design my own PCB."**
Why it works: (1) hidden prerequisites (electronics basics, schematic vs. layout, ground planes) make *adaptation* meaningful; (2) technical accuracy matters, so *verification* has stakes; (3) visual/tool-based resources show *grounding*; (4) has a tangible end artifact.
Backup topics (pre-cached preview mode): `"Prompt engineering for RAG apps"`, `"Beekeeping basics"`.

---

## Pre-demo setup (10 min before)

1. **Start Dev Server:** In terminal, run `npm run dev`.
2. **Open Browser:** Open `http://localhost:3000` in Chrome/Safari. Let it fully boot.
3. **Set scheme to Preview Mode:** When the API Key modal appears, click **"Preview with PCB Design demo"**. Confirm the fixture loads (roadmap should appear instantly).
4. **Switch to Live Mode** for the actual demo: Clear your `localStorage` (Application tab in DevTools), refresh, and enter your real Gemini API key. Have preview mode as the fallback.
5. **Mirror Browser to presentation screen:** Ensure your web browser is visible. Zoom in to 110-125% if needed for legibility.
6. **Pre-plan two "stumbles":** on quiz Q3–Q4 tap the ground-plane misconception options.
7. **Stage the Report text:** `"I don't understand what a ground plane is or why it matters."` (type: missing prerequisite).
8. **Hotspot ready:** phone hotspot as Wi-Fi backup. Live mode tested on venue Wi-Fi at least once.

---

## Timeline

| Time | Screen | Say | Shows |
|---|---|---|---|
| 0:00–0:25 | Browser home / landing | "Ask ChatGPT how to learn PCB design and you get a great essay. Then *you* have to run the course. AnyLearn builds the course *and runs the loop around you*." | Problem framing |
| 0:25–0:55 | Goal Intake | Type the goal. Tap chips: *design & order my first board*, *5 h/week*. Tap calibration toggle; answer 5 questions quickly (know Ohm's law; unsure on ground planes). | Personalization inputs |
| 0:55–1:30 | Build Screen → Roadmap | "Watch — concepts stream in, prerequisites wire up, modules form." Nodes spring onto the canvas. "Notice *Basic circuits* is marked **Skippable — you know this**." | Moat 1 + diagnostic |
| 1:30–2:10 | Lesson workspace | Tap "Schematics vs. layout" node → navigate to lesson. Scroll through blocks: worked example stepper, inline checkpoint, **embedded YouTube video with creator credit and 'why this fits'**. "Every link is real and link-checked; the model never writes URLs." | Moat 4 |
| 2:10–2:50 | Quiz | Tap through 5 questions; deliberately miss the two ground-plane items. After each wrong answer: misconception label animates in — "Common confusion: *treats ground as just another trace*." | Misconception tagging |
| 2:50–3:20 | Roadmap — Adapt | Banner appears: **"Roadmap updated."** Tap it → `DiffView` sheet: + "Ground planes & return paths (10 min)" node springs into the canvas; downstream lesson gets a prerequisite badge; mastery ring turns amber. "It cites my evidence — *you chose X twice*." | Moat 2 |
| 3:20–4:05 | Report / Fix | Open "Routing your first board" lesson → tap **Report / Fix ⚑** in footer. Choose *missing prerequisite* chip + type the staged text. Show the result scroll: **Diagnosis → Before/After diff → Verifier ✅ (claims checked: …) → Also updated: 1 quiz question → Changelog entry**. Tap **Undo** → node disappears. Tap **Redo** → node springs back. | Moat 3 |
| 4:05–4:30 | Capstone + wrap | Scroll to Capstone card. "One sentence in. A living course out — built, adapted, repaired. **The AI is the engine; the product is the learning system.**" | Close |

---

## Optional 15-second closer
Show a real ChatGPT/Claude screenshot of the same prompt (a long text answer, no state, no map). Say: "Same model class. Different product." Mirror the Browser alongside it for contrast.

---

## If the judge names a topic
Say: "Great — live." Clear `localStorage`, paste API key, and narrate the pipeline steps during generation (~15 s). If generation stalls > 25 s, switch: "Here's one I prepared" — clear `localStorage` and click Preview Mode. Never apologize; narrate.

---

## Failure playbook

| Failure | Response |
|---|---|
| AI timeout / network error | Reload and click Preview Mode; keep narrating the pipeline |
| Video embed blocked in iframe | Link card fallback is already built — show attribution + why |
| Verifier returns fail verdict | Show the "needs review" state — a strength: "it doesn't ship unverified fixes" |
| Browser crashes | Refresh page — `localStorage` persists state across launches |
| Browser too small on projector | `⌘+` to zoom in the browser |
| Next.js build fails | Ensure you ran `npm install` and are using Node 20+. The app runs fine on the dev server. |

---

## Rehearsal checklist

- [ ] Full run under 4:30 ×3
- [ ] Offline safe-mode run (Wi-Fi off) using Preview Mode
- [ ] Undo / Redo works correctly
- [ ] All three moats named out loud at least once
- [ ] Browser zoom level confirmed on presentation display
- [ ] One teammate role-plays a hostile judge with the questions in [JUDGE_DEFENSE.md](JUDGE_DEFENSE.md)
