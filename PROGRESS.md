# AnyLearn progress

## Phase 0 — Foundations (iOS)
- [x] Core Codable domain models and LLM-flat DTO validation
- [x] Deterministic mastery, DAG validation and patch engine
- [x] XCTest coverage for mastery and patch engine
- [x] Dark three-tab React/Next.js shell

## Phase 1 — Web Conversion (Next.js)
- [x] Scaffold Next.js 15 App Router project
- [x] Port data models to TypeScript interfaces (`models.ts`)
- [x] Port engines (`patchEngine.ts`, `dagValidator.ts`, `mastery.ts`)
- [x] Build Zustand state store with `localStorage` persistence
- [x] Implement Gemini REST client with caching and API Key modal
- [x] Build full UI (Goal, Build, Roadmap Graph, Lesson workspace, Quiz, Report)
- [x] Add Demo/Preview mode fixture for judges

## Known issues
- The project currently runs fully client-side and relies on the user providing a Gemini API key (or using the preview mode). For production, a backend proxy is needed to secure the API key.
