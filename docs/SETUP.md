# AnyLearn — Setup & Running Guide

## 1. Prerequisites

| Tool | Recommended Version | Download / Source |
|---|---|---|
| **Node.js** | v20.0+ | [nodejs.org](https://nodejs.org) |
| **NPM** | 10.0+ | Bundled with Node.js |
| **Web Browser** | Chrome, Edge, Safari, Firefox | Standard install |
| **Gemini API Key** *(Optional)* | Google AI Studio | [ai.google.dev](https://ai.google.dev) |

> **Note**: An API key is **optional** for exploring the application! AnyLearn includes pre-packaged demo fixtures (*Medical Terminology & Clinical Basics* and *PCB Design from Zero*) that allow complete offline exploration of roadmaps, lessons, quizzes, and mastery tracking with zero setup.

---

## 2. Quick Start

### 1. Clone the repository
```bash
git clone <repo-url> AnyLearn
cd AnyLearn
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 3. Running Automated Tests

AnyLearn includes a comprehensive 80-test automated test suite covering graph validation, Bayesian mastery calculations, atomic patch engines, Zustand store immutability, and end-to-end user workflows.

To run all tests:
```bash
npm test
```

To run an isolated test suite:
```bash
node --experimental-strip-types --loader ./tests/loader.mjs --test tests/mastery.test.ts
```

---

## 4. Production Build

To verify that all static and dynamic routes compile cleanly with zero TypeScript or Webpack errors:

```bash
npm run build
```

To start the optimized production server:
```bash
npm start
```

---

## 5. API Key Configuration & Client-Side Privacy

When generating custom courses outside the built-in fixtures, AnyLearn requires a **Google Gemini API Key**:

1. On first launch, or by clicking the **⚙️ Settings** button in the top navigation bar, enter your Gemini API key.
2. The key is saved strictly in your browser's `localStorage` (`anylearn-api-key`).
3. The key is transmitted directly from your client browser to Google's Generative AI REST endpoint over HTTPS. It is never logged, stored on an intermediate server, or shared.
4. You can clear or update the key at any time directly through the Settings modal.

---

## 6. Offline Demo Fixtures

If you do not have a Gemini API key or wish to explore the application immediately:
1. When visiting `http://localhost:3000/roadmap`, the application automatically loads the rich **Medical Terminology & Clinical Basics** curriculum fixture.
2. Open the **⚙️ Settings** modal in the top right to toggle between:
   - **Medical Terminology & Clinical Basics**: Healthcare vocabulary, pharmacology basics, and clinical pathophysiology.
   - **PCB Design from Zero**: Schematic capture, footprint assignment, ground plane theory, and routing.
3. You can explore lessons, take interactive quizzes, test mastery updates, and simulate diagnostic reports without making any external API calls.
