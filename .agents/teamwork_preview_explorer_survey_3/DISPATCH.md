# Dispatch for Explorer 3: Test Infrastructure Auditor

**Objective**: Audit the existing test suites, runners, coverage, and identify test gaps and infrastructure requirements for bug verification.
**Working Directory**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_3
**Original Request**: /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md
**Project Root**: /Users/sinanm/Documents/ChatGPT/AnyLearn

## 2026-09-19T20:55:36Z

Survey the test infrastructure, test suites, and test coverage in AnyLearn, running existing tests and defining the requirements for comprehensive test verification and regression test suites.

Specific instructions:
1. Read /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/ORIGINAL_REQUEST.md.
2. Inspect test configurations and tools in the repository (e.g. Jest, Vitest, React Testing Library, Playwright, Cypress, etc.).
3. Run existing test suites (e.g. `npm test`, `npm run test:e2e`, etc.) via command execution. Record exact commands run, outputs, pass/fail status, execution time, and any broken/flaky tests.
4. Assess test coverage across all features:
   - What features/components have unit or integration tests?
   - What features have zero test coverage?
5. Outline the test architecture needed to satisfy Acceptance Criteria:
   - "Existing test suites pass successfully."
   - "New tests are added for the identified and fixed bugs, and they pass."
   - 4-Tier test strategy: Tier 1 (feature coverage), Tier 2 (boundary & edge cases), Tier 3 (interactions), Tier 4 (real-world workflows).
6. Provide concrete recommendations for test runner setup, npm scripts, and test file locations.
7. Produce a detailed survey report at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_3/survey_report.md
   and write your standard handoff at:
   /Users/sinanm/Documents/ChatGPT/AnyLearn/.agents/teamwork_preview_explorer_survey_3/handoff.md
8. Update progress.md with timestamps for liveness.
9. When complete, send a message to parent (ID: 291951c3-b3bc-4196-8548-b9bf845d3adc) referencing your report paths.
