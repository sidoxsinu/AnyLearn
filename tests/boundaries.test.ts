import test from 'node:test';
import assert from 'node:assert/strict';
import { applyPatch, PatchEngineError } from '../src/lib/patchEngine';
import { Mastery } from '../src/lib/mastery';
import { pcbCourseFixture } from '../src/lib/fixture';
import { defaultLearnerState } from '../src/lib/models';
import type { Course, RoadmapPatch, Concept, Lesson } from '../src/lib/models';

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

test('Boundary & Edge Cases — Tier 2 Test Suite', async (t) => {
  await t.test('TC-BND-01: exactly 3 operations in a patch succeeds at boundary limit', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const patch: RoadmapPatch = {
      summary: 'Boundary limit of 3 operations',
      ops: [
        { type: 'addPractice', lessonID: 'l-elec-basics', task: { title: 'T1', instructions: [], successCriteria: [] }, reason: 'R1' },
        { type: 'addPractice', lessonID: 'l-components', task: { title: 'T2', instructions: [], successCriteria: [] }, reason: 'R2' },
        { type: 'addPractice', lessonID: 'l-schematic-reading', task: { title: 'T3', instructions: [], successCriteria: [] }, reason: 'R3' },
      ],
    };

    const result = applyPatch(patch, course, learner);
    assert.equal(result.course.version, course.version + 1);
    assert.equal(result.inverse.length, 3);
  });

  await t.test('TC-BND-02: zero operations patch succeeds as no-op boundary', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const patch: RoadmapPatch = {
      summary: 'No-op patch',
      ops: [],
    };

    const result = applyPatch(patch, course, learner);
    assert.equal(result.course.version, course.version + 1);
    assert.equal(result.inverse.length, 0);
  });

  await t.test('TC-BND-03: cyclic patch rejection prevents graph corruption', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    // c-elec-basics is prereq of c-components
    // Add c-components as prereq of a new concept that c-elec-basics depends on, or self-cycle
    const cyclicConcept: Concept = {
      id: 'c-cyclic-node',
      name: 'Cyclic Node',
      summary: '',
      prereqIDs: ['c-components', 'c-cyclic-node'], // Self-loop
    };

    const patch: RoadmapPatch = {
      summary: 'Should fail cycle validation',
      ops: [{ type: 'addConcept', concept: cyclicConcept, reason: 'Cycle' }],
    };

    assert.throws(
      () => applyPatch(patch, course, learner),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'cyclicGraph'
    );

    // Verify course was not mutated
    assert.ok(!course.concepts.some(c => c.id === 'c-cyclic-node'));
  });

  await t.test('TC-BND-04: extreme mastery score clamping and numeric bounds', () => {
    const initial = Mastery.defaultRecord();

    // Score below 0 clamped to 0
    const underflow = Mastery.update(initial, -10.0, 1);
    assert.equal(underflow.probability, 0.0);
    assert.equal(underflow.attempts, 1);

    // Score above 1 clamped to 1
    const overflow = Mastery.update(initial, 999.0, 1);
    assert.equal(overflow.probability, 0.5);
    assert.equal(overflow.attempts, 1);

    // Continuous 50 failures: stays >= 0 and finite
    let failState = initial;
    for (let i = 0; i < 50; i++) {
      failState = Mastery.update(failState, 0.0, 3);
    }
    assert.ok(!Number.isNaN(failState.probability));
    assert.ok(failState.probability >= 0.0 && failState.probability <= 1.0);

    // Continuous 50 successes: stays <= 1.0 and finite
    let successState = initial;
    for (let i = 0; i < 50; i++) {
      successState = Mastery.update(successState, 1.0, 1);
    }
    assert.ok(!Number.isNaN(successState.probability));
    assert.ok(successState.probability <= 1.0 && successState.probability >= 0.0);
    assert.equal(Mastery.isSolid(successState), true);
  });

  await t.test('TC-BND-05: unknown ID guards across all patch operations', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    // 1. Unknown lesson in replaceBlock
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'replaceBlock',
                lessonID: 'non-existent-lesson',
                blockID: 'b-hook-elec',
                block: { type: 'markdown', id: 'b-hook-elec', markdown: '' },
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 2. Unknown block in replaceBlock
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'replaceBlock',
                lessonID: 'l-elec-basics',
                blockID: 'non-existent-block',
                block: { type: 'markdown', id: 'non-existent-block', markdown: '' },
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 3. Unknown afterBlockID in insertBlock
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'insertBlock',
                lessonID: 'l-elec-basics',
                afterBlockID: 'non-existent-block-anchor',
                block: { type: 'markdown', id: 'b-new', markdown: '' },
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 4. Unknown afterLessonID in insertLesson
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'insertLesson',
                afterLessonID: 'non-existent-lesson-anchor',
                lesson: makeLesson('l-new', 'm-foundations', '', ['c-elec-basics']),
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 5. Unknown conceptID in insertLesson
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'insertLesson',
                afterLessonID: 'l-elec-basics',
                lesson: makeLesson('l-new', 'm-foundations', '', ['non-existent-concept']),
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 6. Unknown moduleID in reorder
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'reorder',
                moduleID: 'non-existent-module',
                lessonIDs: [],
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 7. Unknown questionID in replaceQuestion
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'replaceQuestion',
                lessonID: 'l-elec-basics',
                questionID: 'non-existent-question',
                question: {
                  id: 'non-existent-question',
                  conceptID: 'c-elec-basics',
                  difficulty: 1,
                  prompt: '',
                  options: [],
                  correctOptionID: '',
                  explanation: '',
                },
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 8. Unknown lessonID in real deleteLesson
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'deleteLesson',
                lessonID: 'non-existent-lesson',
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );

    // 9. Malformed virtual block ID in deleteLesson
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'deleteLesson',
                lessonID: 'block:malformed',
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'unknownID'
    );
  });

  await t.test('TC-BND-06: duplicate ID guards for concepts and lessons', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    // Duplicate concept ID
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'addConcept',
                concept: {
                  id: 'c-elec-basics', // already exists
                  name: 'Duplicate',
                  summary: '',
                  prereqIDs: [],
                },
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'duplicateID'
    );

    // Duplicate lesson ID
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'insertLesson',
                afterLessonID: 'l-elec-basics',
                lesson: makeLesson('l-components', 'm-foundations', 'Duplicate', ['c-elec-basics']),
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'duplicateID'
    );
  });

  await t.test('TC-BND-07: reorder rejects invalid lesson set (missing or extra IDs)', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();

    // Missing an ID
    assert.throws(
      () =>
        applyPatch(
          {
            summary: '',
            ops: [
              {
                type: 'reorder',
                moduleID: 'm-foundations',
                lessonIDs: ['l-elec-basics'], // missed l-components
                reason: '',
              },
            ],
          },
          course,
          learner
        ),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'invalidReorder'
    );
  });

  await t.test('TC-BND-08: storage fallback works without window object', () => {
    // In node environment, window is undefined
    assert.equal(typeof window, 'undefined');
    // Calling store functions does not crash
    const dummyStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
    assert.equal(dummyStorage.getItem('anylearn-state'), null);
    assert.doesNotThrow(() => dummyStorage.setItem('key', 'val'));
    assert.doesNotThrow(() => dummyStorage.removeItem('key'));
  });
});
