# E2E Test Infra: AnyLearn Web

## Test Philosophy
- Opaque-box and unit/integration requirement-driven testing.
- Methodology: Category-Partition + Boundary Value Analysis (BVA) + Pairwise Interaction Testing + Real-World Workload Testing.
- Execution Environment: Node.js test runner with zero-dependency execution.

## Feature Inventory & Test Mapping
| # | Feature | Source | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Interaction) | Tier 4 (Scenario) |
|---|---------|--------|:----------------:|:-----------------:|:--------------------:|:-----------------:|
| 1 | FEAT-01: Goal Intake & Calibration | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 2 | FEAT-02: API Key Management | ORIGINAL_REQUEST R2, PRD §6 | 5 | 5 | ✓ | ✓ |
| 3 | FEAT-03: Preview & Demo Mode | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 4 | FEAT-04: Course Generation Pipeline | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 5 | FEAT-05: Interactive Roadmap Graph | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 6 | FEAT-06: Progress & Mastery Dashboard | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 7 | FEAT-07: Course Changelog & Undo | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 8 | FEAT-08: Lazy Lesson Content Generation | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 9 | FEAT-09: Block-Based Lesson Workspace | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 10 | FEAT-10: Lesson Mark Complete | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 11 | FEAT-11: Concept-Tagged Quizzes | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 12 | FEAT-12: Mastery Engine | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 13 | FEAT-13: Adaptive Roadmap Engine | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 14 | FEAT-14: Report & Fix Diagnosis & Patch | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 15 | FEAT-15: Independent Verifier Loop | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 16 | FEAT-16: Capstone Project Display | ORIGINAL_REQUEST R2, PRD §8 | 5 | 5 | ✓ | ✓ |
| 17 | FEAT-17: Test Infrastructure & Harness | Acceptance Criteria | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Runner**: Node.js test runner / npm test script.
- **Directory Layout**:
  - `tests/unit/`: Pure algorithmic unit tests (`mastery.test.ts`, `dagValidator.test.ts`, `patchEngine.test.ts`, `store.test.ts`).
  - `tests/integration/`: Component logic, storage serialization, demo flow tests (`demoFlow.test.ts`, `adaptiveFlow.test.ts`).
  - `tests/regression/`: Regression tests specifically verifying all 15 identified bugs (`bugFixes.test.ts`).
- **Pass/Fail Semantics**: All test suites must execute and terminate with exit code 0.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Target Behavior |
|---|----------|--------------------|-----------------|
| 1 | Demo Mode Evaluation Walkthrough | FEAT-01, FEAT-02, FEAT-03, FEAT-05, FEAT-06, FEAT-08, FEAT-16 | User launches demo without API key, navigates to roadmap, inspects modules, views capstone, opens ready lesson without redirects |
| 2 | Mastery Progression & Quiz Feedback | FEAT-06, FEAT-10, FEAT-11, FEAT-12 | User completes lesson, takes quiz, submits correct and incorrect answers, verifies Bayesian mastery updates |
| 3 | Adaptive Course Remediation (Moat 2) | FEAT-11, FEAT-12, FEAT-13, FEAT-05, FEAT-07 | User struggles on concept quiz, triggers adaptive patch, inserts remedial lesson, verifies roadmap DAG validity |
| 4 | Independent Report, Patch & Verifier (Moat 3) | FEAT-09, FEAT-14, FEAT-15, FEAT-07 | User flags lesson error, generates diagnostic patch, compares patched lesson vs original lesson, verifies patch and tests undo |
| 5 | Storage Persistence & SSR Safety | FEAT-01, FEAT-02, FEAT-03, FEAT-06 | Verifies store hydrates safely, no window/sessionStorage crashes, fallback handling for offline storage |
