# Setup

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | v20+ | [nodejs.org](https://nodejs.org) |
| NPM | 10+ | Included with Node.js |
| Web Browser | Chrome / Safari | Standard install |
| API Keys | Gemini API Key | Google AI Studio |

API keys needed: **Google AI Studio** (Gemini).

---

## Clone & run

```bash
git clone <repo-url> anylearn-web
cd anylearn-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## API keys (`localStorage`)

You don't need a `.env` file! When you first launch the app at `http://localhost:3000`, a modal will prompt you to enter your **Gemini API Key**.

This key is stored securely in your browser's `localStorage` and is never sent to any server other than Google's Gemini API endpoint directly from your browser.

> Check current Gemini model IDs at [ai.google.dev](https://ai.google.dev).

---

## Run in Preview/Demo Mode

If you don't have an API key, you can still test the app!

1. Run `npm run dev` and open `http://localhost:3000`.
2. When the API Key modal appears, click the **"Preview with PCB Design demo"** button.
3. This will instantly load a pre-generated course into your `localStorage`.
4. You can explore the roadmap, view lessons, take quizzes, and see mastery updates without making any network calls!

---

## NPM dependencies

| Package | Purpose |
|---|---|
| `next` | React meta-framework |
| `zustand` | State management and local persistence |
| `react-markdown` | Rendering lesson content safely |
| `mermaid` | Rendering system diagrams |

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| JSON parse failure on AI response | Lower temperature in `llmClient.ts`; check schema hints in `models.ts` |
| Video embeds blocked | Browser autoplay/iframe policies might be blocking them |
| Mermaid render errors | Reload the page; check the markdown syntax outputted by the LLM |
| React hydration errors | Ignore in development, usually caused by browser extensions or `localStorage` mismatch |
