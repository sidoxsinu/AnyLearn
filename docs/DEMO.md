# AnyLearn — Live Demonstration Guide (4:30 Walkthrough)

## 1. Demo Overview

This walkthrough demonstrates how AnyLearn transforms an ambitious learning goal into a living, adaptive learning path with continuous real-time self-healing.

- **Primary Demo Track**: *Medical Terminology & Clinical Basics* (pre-loaded out-of-the-box for instant exploration).
- **Secondary Demo Track**: *PCB Design from Zero* (available via Settings modal).
- **Live Generation Track**: Custom goal synthesis using client-side Gemini API keys.

---

## 2. Pre-Demo Checklist (2 Minutes Before)

1. **Start Local Server**: In your terminal, run `npm run dev`.
2. **Open Browser**: Navigate to `http://localhost:3000`. The app will redirect to `/roadmap` with the pre-loaded Medical Terminology course.
3. **Verify DevTools**: Open browser console to ensure zero errors and clean React 19 hydration.
4. **Zoom / Legibility**: Set browser zoom to 100% or 110% for clear projection of Neo-Brutalist cards and borders.

---

## 3. Demonstration Script & Timeline

| Time | Screen & Focus | Narrative & Actions | Key Takeaway Demonstrated |
|:---|:---|:---|:---|
| **0:00 – 0:30** | **Roadmap Dashboard** (`/roadmap`) | "Traditional online courses are static playlists, while AI chatbots are isolated conversations. AnyLearn builds a persistent, adaptive learning system around ONE learner and ONE goal." Point out the **Electric Yellow Hero Card**, the **Live Progress Badge**, and the **4-stat card row**. | Clean Neo-Brutalist design, zero synthetic mock data, and live store metrics. |
| **0:30 – 1:15** | **Curriculum List & DAG Graph** (`/roadmap`) | Toggle from **List View** to **SVG Graph View**. Show how lessons form an acyclic dependency graph with module clusters and prerequisite edges. Point out the `skip ✓` indicator on foundational concepts that were marked skippable. | Acyclic graph invariants (`dagValidator.ts`) and clear visual progression. |
| **1:15 – 2:00** | **Lesson Workspace** (`/lesson/med-1`) | Click **"Continue Learning →"** or **"Open Lesson ↗"**. Walk through the structured blocks: learning objectives, high-contrast text, step-by-step worked examples, and the interactive checkpoint card. Click **"Reveal Answer"** on the checkpoint. | Structured modular lessons (`BlockRenderer.tsx`) designed for deep comprehension, not chat wall-of-text. |
| **2:00 – 2:50** | **Misconception Quiz** (`/quiz/med-1`) | Click **"Complete & Take Quiz →"**. Answer questions. Deliberately select a distractor option. Show the card turn red with the explicit misconception explanation tagged by the authoring model. Complete the quiz and highlight the updated concept mastery bars. | Formative assessment and Bayesian Knowledge Tracing (`mastery.ts`). |
| **2:50 – 3:40** | **Adaptive Patch & Diagnosis** (`/report/med-1`) | From the lesson footer, click **"⚑ Report Issue"**. Select *Missing Prerequisite* or *Confusing Explanation*, enter a brief clarification request, and click **"Diagnose & Fix →"**. Explain how the dual-model pipeline diagnoses the issue, creates a patch, verifies the fix, and updates the course changelog. | Autonomous self-healing patch engine (`patchEngine.ts`) with undo capability. |
| **3:40 – 4:15** | **Goal Intake & Custom Generation** (`/goal`) | Navigate to **"🎯 New Goal"**. Type a new learning ambition (e.g., *"Options pricing from scratch for quantitative finance"*). Show the milestone artifact selector and weekly commitment buttons. Explain how the adaptive engine decomposes goals into atomic concept DAGs. | Goal-oriented calibration and tailored scope control. |
| **4:15 – 4:30** | **Summary & Conclusion** | "One sentence in. A living course out—built, adapted, and repaired around the learner. **The AI proposes; our engine disposes.**" | Deterministic safety, client-side privacy, and proven software engineering. |

---

## 4. Contingency & Fallback Playbook

| Scenario | Contingency Action |
|:---|:---|
| **Network or Wi-Fi Disruption** | Rely entirely on the pre-bundled offline fixtures (*Medical Terminology* or *PCB Design*). Every core feature (roadmap, SVG graph, lesson reader, quiz runner, and mastery updates) operates 100% locally in browser memory with zero network dependencies. |
| **API Key Missing or Expired** | Click the **⚙️ Settings** icon in the top right, select **"Load PCB Design Demo"** or **"Load Medical Basics Demo"**, and resume the demonstration without hesitation. |
| **Accidental State Corruption** | In the Settings modal, click **"Reset Course & Learner State"** to restore pristine default data instantly. |
| **Small Display / Projector** | The Neo-Brutalist layout uses pure CSS responsive grids (`.brutal-grid-4` to `.brutal-grid-2` to single column) and natural vertical scrolling, ensuring sharp visibility at any screen resolution. |
