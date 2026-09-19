// AnyLearn — Prompts (ported from PROMPTS.md)

const SYSTEM_PREAMBLE = `You are the content engine of AnyLearn, a system that builds and maintains a personalized learning environment for ONE learner and ONE goal.
Rules:
- Output ONLY valid JSON matching the provided schema. No prose outside JSON.
- Be accurate. If unsure about a factual claim, prefer a hedged statement and set confidence to "low"; never fabricate numbers, standards, citations or URLs.
- NEVER output URLs unless they are given to you in the input. For resources, output search queries only.
- Teach for understanding: prerequisites before dependents, concrete examples before abstractions, one idea per lesson.
- Tailor depth to the learner's mastery map; do not re-teach concepts with mastery >= 0.8 beyond a one-line recap.
- Use stable ids given in the input; when creating new ids use short kebab-case slugs prefixed by type (c-, l-, b-, q-).`;

export interface PromptPair {
  system: string;
  user: string;
}

export const Prompts = {
  systemPreamble: SYSTEM_PREAMBLE,

  calibrate(goal: string): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Calibrate learner goal and generate an optional diagnostic.
GOAL: ${goal}

1. Infer: topic, endArtifact (what they want to be able to build/do), level (beginner/intermediate/advanced), constraints.
2. Generate 5 diagnostic multiple-choice questions spanning foundation concepts. Each question must have conceptId, difficulty (1-3), prompt, 4 options (1 correct). Each wrong option must have a misconception label. Add a "not sure" option (id ending in "-ns", counts as 0, no misconception). Order easy → hard.

Return JSON: { profile: { topic, endArtifact, level, hoursPerWeek: 5 }, diagnostic: [Question...] }`,
    };
  },

  conceptGraph(goal: string, profile: object, diagnosticMastery: object): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Build the concept graph for this learner goal.
GOAL: ${goal}
PROFILE: ${JSON.stringify(profile)}
DIAGNOSTIC MASTERY (conceptName → mastery 0..1): ${JSON.stringify(diagnosticMastery)}

Produce 20-35 atomic concepts. Each: id (c- prefix), name, one-sentence summary, prereqIDs (must form a DAG — no cycles).
Include (a) foundational prerequisites the learner may not know they need, (b) core skills, (c) practice/workflow skills needed for the END ARTIFACT.
Order by valid topological order. Do not include concepts irrelevant to the end artifact.

Return JSON: { concepts: [{ id, name, summary, prereqIDs }] }`,
    };
  },

  curriculum(goal: string, profile: object, concepts: object, mastery: object): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Turn the concept graph into a curriculum.
GOAL: ${goal}
PROFILE: ${JSON.stringify(profile)}
CONCEPTS: ${JSON.stringify(concepts)}
MASTERY: ${JSON.stringify(mastery)}

Produce: 4-6 modules (id with m- prefix, title, outcome sentence), each with 3-5 lesson STUBS:
{ id (l- prefix), moduleID, title, objectives[2-3 measurable], conceptIDs[1-3], resourceQueries[2-4 search queries], skippable?{reason} (only if all concepts have mastery >= 0.8) }
Also produce: capstone { title, description, successCriteria[3-5] }.
Constraints: no lesson depends on a concept taught later; each lesson covers <= 3 concepts; the final module builds toward the END ARTIFACT.

Return JSON: { modules: [{ id, title, outcome, lessonIDs }], lessons: { [id]: Lesson }, capstone: { title, description, successCriteria } }`,
    };
  },

  lesson(
    goal: string,
    profile: object,
    module: object,
    lessonStub: object,
    concepts: object,
    priorLessons: object,
    mastery: object
  ): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Write the full lesson content.
GOAL: ${goal}
PROFILE: ${JSON.stringify(profile)}
MODULE: ${JSON.stringify(module)}
LESSON STUB: ${JSON.stringify(lessonStub)}
CONCEPTS (with summaries): ${JSON.stringify(concepts)}
PRIOR LESSONS (titles + conceptIDs already taught): ${JSON.stringify(priorLessons)}
MASTERY FOR THESE CONCEPTS: ${JSON.stringify(mastery)}

Return blocks in this order:
1. markdown (id: b-hook-{lessonId}): hook + why it matters <= 120 words
2. markdown (id: b-core-{lessonId}): core explanation, plain language, define terms
3. workedExample (id: b-example-{lessonId}): step-by-step with "why" per step, realistic scenario tied to end artifact. steps: [{text, why}]
4. callout (id: b-mistakes-{lessonId}, kind: "mistake"): 2-3 common mistakes
5. checkpoint (id: b-check-{lessonId}): quick recall question with answer and optional hint
6. markdown (id: b-recap-{lessonId}): recap in 3 bullets

Also return:
- task: { title, instructions[3-6], successCriteria[2-4] }
- confidence: "high"|"medium"|"low"
- sources: [] (empty, set unsourced: true for now)

Return JSON: { blocks: [Block...], task: TaskCard, confidence, sources: [], unsourced: true }`,
    };
  },

  quiz(lessonBlocks: object, conceptIDs: string[]): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Write a quiz that tests THIS lesson.
LESSON BLOCKS: ${JSON.stringify(lessonBlocks)}
CONCEPT IDS: ${JSON.stringify(conceptIDs)}

Create 5 multiple-choice questions (id: q- prefix):
- Each: conceptID (from the list), difficulty 1-3, prompt, 4 options (1 correct, id: opt- prefix).
- Each WRONG option must have a specific misconception label.
- Include: 2 recall, 2 application (small scenario), 1 transfer (new context not in the lesson).
- explanation: why the answer is right AND why top distractor is tempting. refBlockID: the block id that teaches it.
- Do not test anything not taught in the lesson.

Return JSON: { questions: [{ id, conceptID, difficulty, prompt, options: [{id, text, misconception?}], correctOptionID, explanation, refBlockID }] }`,
    };
  },

  adapt(goal: string, roadmap: object, concepts: object, mastery: object, trigger: object, attempts: object): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Propose a RoadmapPatch to help this learner.
GOAL: ${goal}
CURRENT ROADMAP: ${JSON.stringify(roadmap)}
CONCEPT GRAPH: ${JSON.stringify(concepts)}
MASTERY MAP: ${JSON.stringify(mastery)}
TRIGGER: ${JSON.stringify(trigger)}
RECENT QUIZ ATTEMPTS: ${JSON.stringify(attempts)}

Rules:
- Max 3 ops. Allowed: insertLesson, addConcept, addPractice, markSkippable, reorder.
- For weak concepts: prefer inserting a SHORT remedial lesson placed right after the failed lesson.
- For solid upcoming concepts: markSkippable with reason.
- Never modify or delete completed lessons.
- Every op needs a one-sentence learner-facing reason naming the evidence.

Return JSON: { summary: string, ops: [PatchOp...] }`,
    };
  },

  diagnoseAndFix(goal: string, report: object, lesson: object, neighbors: object, mastery: object): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: A learner reported a problem with a lesson. Diagnose and produce the smallest patch that fixes it.
GOAL: ${goal}
REPORT: ${JSON.stringify(report)}
LESSON: ${JSON.stringify(lesson)}
NEIGHBOR LESSONS: ${JSON.stringify(neighbors)}
MASTERY: ${JSON.stringify(mastery)}

Steps: (1) Decide if report is valid. (2) Identify root cause. (3) Choose minimal scope: block < lesson < roadmap. (4) Produce patch ops.
Write learnerFacingMessage in 2 sentences: what was wrong and what changed.
Do NOT invent citations.

Return JSON: { diagnosis: { rootCause, category, confidence }, scope, learnerFacingMessage, patch: { summary, ops }, propagationHints: [{conceptID, why}] }`,
    };
  },

  verify(before: object, after: object, report: object, mastery: object): PromptPair {
    return {
      system: SYSTEM_PREAMBLE,
      user: `TASK: Independently verify a proposed fix. You did NOT write it.
ORIGINAL LESSON: ${JSON.stringify(before)}
PATCHED LESSON: ${JSON.stringify(after)}
REPORT: ${JSON.stringify(report)}
MASTERY: ${JSON.stringify(mastery)}

CHECK: (1) Does the patch actually resolve the report? (2) Is every factual claim correct? List claims you checked. (3) Did the patch introduce inconsistencies? (4) Is the level appropriate?
Return JSON: { verdict: "pass"|"fail", issues: [{severity: "high"|"low", detail}], factualClaimsChecked: [string] }`,
    };
  },
};
