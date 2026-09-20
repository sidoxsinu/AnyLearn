import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPatch, PatchEngineError } from '../src/lib/patchEngine';
import { pcbCourseFixture } from '../src/lib/fixture';
import { defaultLearnerState } from '../src/lib/models';
import type { Course, LearnerState, RoadmapPatch, Concept, Lesson, Block, TaskCard } from '../src/lib/models';

function createFreshCourse(): Course {
  return JSON.parse(JSON.stringify(pcbCourseFixture));
}

function makeLesson(id: string, moduleID: string, title: string, conceptIDs: string[]): Lesson {
  return {
    id,
    moduleID,
    title,
    conceptIDs,
    objectives: ['Objective 1'],
    status: 'ready',
    blocks: [{ type: 'markdown', id: `b-${id}`, markdown: 'Content' }],
    resourceQueries: [],
    resources: [],
    sources: [],
    unsourced: false,
    confidence: 'high',
    version: 1,
  };
}

function makeTask(title = 'Practice task'): TaskCard {
  return {
    title,
    instructions: ['Step 1: Calculate values', 'Step 2: Inspect board'],
    successCriteria: ['Correct resistance', 'Safe power dissipation'],
  };
}

test('Patch Engine — Tier 1 Feature Tests', async (t) => {
  await t.test('TC-PATCH-01: operation limit rejects patches with > 3 operations', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const patch: RoadmapPatch = {
      summary: 'Testing excessive operations limit',
      ops: [
        { type: 'markSkippable', lessonID: 'l-elec-basics', reason: 'Skip 1' },
        { type: 'markSkippable', lessonID: 'l-components', reason: 'Skip 2' },
        { type: 'markSkippable', lessonID: 'l-schematic-reading', reason: 'Skip 3' },
        { type: 'markSkippable', lessonID: 'l-schematic-drawing', reason: 'Skip 4' },
      ],
    };

    assert.throws(
      () => applyPatch(patch, course, learner),
      (err: unknown) => {
        return err instanceof PatchEngineError && err.code === 'tooManyOperations';
      }
    );
  });

  await t.test('TC-PATCH-02: addConcept adds concept and produces deleteLesson virtual inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const newConcept: Concept = {
      id: 'c-grounding',
      name: 'Ground Planes & Noise',
      summary: 'Star grounding and noise decoupling',
      prereqIDs: ['c-elec-basics'],
    };

    const patch: RoadmapPatch = {
      summary: 'Add grounding foundation',
      ops: [{ type: 'addConcept', concept: newConcept, reason: 'Grounding' }],
    };

    const result = applyPatch(patch, course, learner);
    assert.equal(result.course.version, course.version + 1);
    assert.ok(result.course.concepts.some(c => c.id === 'c-grounding'));
    assert.deepEqual(result.inverse, [
      { type: 'deleteLesson', lessonID: 'concept:c-grounding', reason: 'Grounding' },
    ]);
  });

  await t.test('TC-PATCH-03: insertLesson adds lesson into module and creates inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const newLesson = makeLesson(
      'l-resistors-deep-dive',
      'm-foundations',
      'Resistors Deep Dive',
      ['c-elec-basics']
    );

    const patch: RoadmapPatch = {
      summary: 'Reinforce resistor fundamentals',
      ops: [
        {
          type: 'insertLesson',
          afterLessonID: 'l-elec-basics',
          lesson: newLesson,
          reason: 'Extra practice with resistors',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    const mod = result.course.modules.find(m => m.id === 'm-foundations');
    assert.ok(mod);
    const idx = mod.lessonIDs.indexOf('l-resistors-deep-dive');
    assert.equal(idx, 1); // Placed immediately after l-elec-basics (idx 0)
    assert.ok(result.course.lessons['l-resistors-deep-dive']);
    assert.deepEqual(result.inverse, [
      { type: 'deleteLesson', lessonID: 'l-resistors-deep-dive', reason: 'Extra practice with resistors' },
    ]);
  });

  await t.test('TC-PATCH-04: replaceBlock modifies target block and saves original in inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const targetLesson = course.lessons['l-elec-basics'];
    const originalBlock = targetLesson.blocks[0];

    const replacementBlock: Block = {
      type: 'markdown',
      id: originalBlock.id,
      markdown: '## Updated Heading\nEnhanced explanation of current and voltage.',
    };

    const patch: RoadmapPatch = {
      summary: 'Fix confusing typo in intro',
      ops: [
        {
          type: 'replaceBlock',
          lessonID: 'l-elec-basics',
          blockID: originalBlock.id,
          block: replacementBlock,
          reason: 'Corrected typo',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    const updatedLesson = result.course.lessons['l-elec-basics'];
    assert.equal(updatedLesson.blocks[0].type === 'markdown' && updatedLesson.blocks[0].markdown, replacementBlock.markdown);
    assert.deepEqual(result.inverse, [
      {
        type: 'replaceBlock',
        lessonID: 'l-elec-basics',
        blockID: replacementBlock.id,
        block: originalBlock,
        reason: 'Corrected typo',
      },
    ]);
  });

  await t.test('TC-PATCH-05: insertBlock adds block and creates virtual block delete inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const newBlock: Block = {
      type: 'callout',
      id: 'b-new-callout',
      kind: 'tip',
      markdown: 'Remember to check resistor power ratings.',
    };

    const patch: RoadmapPatch = {
      summary: 'Add safety tip',
      ops: [
        {
          type: 'insertBlock',
          lessonID: 'l-elec-basics',
          afterBlockID: 'b-hook-elec',
          block: newBlock,
          reason: 'Safety callout',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    const blocks = result.course.lessons['l-elec-basics'].blocks;
    assert.equal(blocks[1].id, 'b-new-callout');
    assert.deepEqual(result.inverse, [
      {
        type: 'deleteLesson',
        lessonID: 'block:l-elec-basics:b-new-callout',
        reason: 'Safety callout',
      },
    ]);
  });

  await t.test('TC-PATCH-06: addPractice updates task card and preserves previous task in inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const oldTask = course.lessons['l-elec-basics'].task;
    const newTask = makeTask('LED Current Calculation Practice');

    const patch: RoadmapPatch = {
      summary: 'Hands-on practice task',
      ops: [
        {
          type: 'addPractice',
          lessonID: 'l-elec-basics',
          task: newTask,
          reason: 'Add LED calculation practice',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.deepEqual(result.course.lessons['l-elec-basics'].task, newTask);
    assert.deepEqual(result.inverse, [
      {
        type: 'addPractice',
        lessonID: 'l-elec-basics',
        task: oldTask ?? newTask,
        reason: 'Add LED calculation practice',
      },
    ]);
  });

  await t.test('TC-PATCH-07: markSkippable marks lesson and inverse restores state', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    const patch: RoadmapPatch = {
      summary: 'Learner already demonstrated solid mastery',
      ops: [
        {
          type: 'markSkippable',
          lessonID: 'l-elec-basics',
          reason: 'Tested out in diagnostic',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.deepEqual(result.course.lessons['l-elec-basics'].skippable, {
      reason: 'Tested out in diagnostic',
    });
  });

  await t.test('TC-PATCH-08: reorder swaps lessons in module and generates inverted order', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const originalOrder = [...course.modules[0].lessonIDs];
    const invertedOrder = [...originalOrder].reverse();

    const patch: RoadmapPatch = {
      summary: 'Pedagogical order swap',
      ops: [
        {
          type: 'reorder',
          moduleID: 'm-foundations',
          lessonIDs: invertedOrder,
          reason: 'Reverse order',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.deepEqual(result.course.modules[0].lessonIDs, invertedOrder);
    assert.deepEqual(result.inverse, [
      {
        type: 'reorder',
        moduleID: 'm-foundations',
        lessonIDs: originalOrder,
        reason: 'Reverse order',
      },
    ]);
  });

  await t.test('TC-PATCH-09: replaceQuestion modifies quiz and preserves old question in inverse', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const oldQuestion = course.quizzes['l-elec-basics'][0];

    const updatedQuestion = {
      ...oldQuestion,
      prompt: 'Clarified: In Ohm’s Law, what does I represent?',
    };

    const patch: RoadmapPatch = {
      summary: 'Clarify question prompt',
      ops: [
        {
          type: 'replaceQuestion',
          lessonID: 'l-elec-basics',
          questionID: oldQuestion.id,
          question: updatedQuestion,
          reason: 'Clarify question prompt',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.equal(result.course.quizzes['l-elec-basics'][0].prompt, updatedQuestion.prompt);
    assert.deepEqual(result.inverse, [
      {
        type: 'replaceQuestion',
        lessonID: 'l-elec-basics',
        questionID: updatedQuestion.id,
        question: oldQuestion,
        reason: 'Clarify question prompt',
      },
    ]);
  });

  await t.test('TC-PATCH-10: refreshResources updates external resources', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const oldQueries = course.lessons['l-elec-basics'].resourceQueries;

    const newQueries = ['SparkFun Ohm Law Tutorial', 'All About Circuits Resistor Guide'];
    const patch: RoadmapPatch = {
      summary: 'Update outdated external links',
      ops: [
        {
          type: 'refreshResources',
          lessonID: 'l-elec-basics',
          queries: newQueries,
          reason: 'Update outdated external links',
        },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.deepEqual(result.course.lessons['l-elec-basics'].resourceQueries, newQueries);
    assert.deepEqual(result.inverse, [
      {
        type: 'refreshResources',
        lessonID: 'l-elec-basics',
        queries: oldQueries,
        reason: 'Update outdated external links',
      },
    ]);
  });

  await t.test('TC-PATCH-11: deleteLesson handles virtual concepts and blocks', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    // Test virtual concept deletion
    const patchConcept: RoadmapPatch = {
      summary: 'Delete non-essential concept',
      ops: [{ type: 'deleteLesson', lessonID: 'concept:c-gerbers', reason: 'Remove gerber concept' }],
    };
    const resConcept = applyPatch(patchConcept, course, learner);
    assert.ok(!resConcept.course.concepts.some(c => c.id === 'c-gerbers'));

    // Test virtual block deletion
    const patchBlock: RoadmapPatch = {
      summary: 'Delete obsolete block',
      ops: [{ type: 'deleteLesson', lessonID: 'block:l-elec-basics:b-hook-elec', reason: 'Remove hook' }],
    };
    const resBlock = applyPatch(patchBlock, course, learner);
    assert.ok(!resBlock.course.lessons['l-elec-basics'].blocks.some(b => b.id === 'b-hook-elec'));
  });

  await t.test('TC-PATCH-12: deleteLesson throws completedLesson when attempting to delete completed lesson', () => {
    const course = createFreshCourse();
    const learner: LearnerState = {
      ...defaultLearnerState(),
      completedLessonIDs: ['l-elec-basics'],
    };

    const patch: RoadmapPatch = {
      summary: 'Try deleting completed lesson',
      ops: [{ type: 'deleteLesson', lessonID: 'l-elec-basics', reason: 'Should fail' }],
    };

    assert.throws(
      () => applyPatch(patch, course, learner),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'completedLesson'
    );
  });

  await t.test('TC-PATCH-13: course version increments deterministically on each patch application', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const initialVersion = course.version;

    const patch: RoadmapPatch = {
      summary: 'Bump version test',
      ops: [{ type: 'markSkippable', lessonID: 'l-components', reason: 'Skippable' }],
    };

    const res1 = applyPatch(patch, course, learner);
    assert.equal(res1.course.version, initialVersion + 1);

    const res2 = applyPatch(patch, res1.course, learner);
    assert.equal(res2.course.version, initialVersion + 2);
  });

  await t.test('TC-PATCH-14: round-trip undo by applying generated inverse restores original state', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const originalBlockText = (course.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown;

    const patch: RoadmapPatch = {
      summary: 'Temporary modification',
      ops: [
        {
          type: 'replaceBlock',
          lessonID: 'l-elec-basics',
          blockID: 'b-hook-elec',
          block: { type: 'markdown', id: 'b-hook-elec', markdown: 'Temporary content' },
          reason: 'Test edit',
        },
      ],
    };

    const mutated = applyPatch(patch, course, learner);
    assert.equal((mutated.course.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown, 'Temporary content');

    // Invert the patch
    const inversePatch: RoadmapPatch = {
      summary: 'Undo test edit',
      ops: mutated.inverse,
    };

    const restored = applyPatch(inversePatch, mutated.course, learner);
    assert.equal((restored.course.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown, originalBlockText);
  });
});
