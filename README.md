# AnyLearn Web

AnyLearn is a system that builds and maintains a personalized learning environment for ONE learner and ONE goal. Powered by Gemini Flash, it generates adaptive roadmaps, content, and quizzes on the fly. 

This repository contains the Next.js web application port of AnyLearn.

## Features
- **Dynamic Curriculum:** Provide a goal, and AnyLearn will generate a concept DAG and a structured curriculum.
- **Mastery Engine:** Tracks your understanding of atomic concepts. Adaptive updates patch the roadmap dynamically if you struggle.
- **Report & Fix:** Find an error in the content? Report it, and a stronger AI will diagnose, patch, and verify the fix in real time.
- **100% Client-Side API Key:** Enter your Gemini API key securely in the browser. It is stored in `localStorage` and never touches a backend.
- **Preview Mode:** A built-in PCB Design course fixture allows judges to test the UI/UX without needing an API key.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## Tech Stack
- Framework: Next.js 15 (App Router)
- Language: TypeScript
- State Management: Zustand (with `localStorage` persistence)
- Styling: Pure CSS (`src/styles/globals.css`)
- Rendering: `react-markdown` + `mermaid`
- AI: Google Gemini API (REST, client-side only)
