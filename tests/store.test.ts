import test from 'node:test';
import assert from 'node:assert/strict';
import { useStore } from '../src/lib/store';
import { pcbCourseFixture } from '../src/lib/fixture';
import { defaultLearnerState } from '../src/lib/models';
import type { Course, Question, RoadmapPatch, LearnerState } from '../src/lib/models';

function createFreshCourse(): Course {
  return JSON.parse(JSON.stringify(pcbCourseFixture));
}

test('Zustand Store — Tier 1 Feature Tests', async (t) => {
  // Reset store before each test
  t.beforeEach(() => {
    useStore.getState().reset();
  });

  await t.test('TC-STORE-01: initial store state is clean and default', () => {
    const state = useStore.getState();
    assert.equal(state.course, null);
    assert.equal(state.latestError, null);
    assert.equal(state.isBuilding, false);
    assert.equal(state.buildStep, '');
    assert.deepEqual(state.learner, defaultLearnerState());
  });

  await t.test('TC-STORE-02: setCourse and setLearner update respective state slices', () => {
    const course = createFreshCourse();
    useStore.getState().setCourse(course);
    assert.deepEqual(useStore.getState().course?.id, course.id);

    const customLearner: LearnerState = {
      ...defaultLearnerState(),
      completedLessonIDs: ['l-custom'],
    };
    useStore.getState().setLearner(customLearner);
    assert.deepEqual(useStore.getState().learner.completedLessonIDs, ['l-custom']);
  });

  await t.test('TC-STORE-03: completeLesson idempotently records completed lessons', () => {
    useStore.getState().completeLesson('l-elec-basics');
    assert.deepEqual(useStore.getState().learner.completedLessonIDs, ['l-elec-basics']);

    // Calling it a second time should not duplicate the ID
    useStore.getState().completeLesson('l-elec-basics');
    assert.deepEqual(useStore.getState().learner.completedLessonIDs, ['l-elec-basics']);

    // Adding another lesson
    useStore.getState().completeLesson('l-components');
    assert.deepEqual(useStore.getState().learner.completedLessonIDs, ['l-elec-basics', 'l-components']);
  });

  await t.test('TC-STORE-04: updateMastery updates concept record and logs attempt history', () => {
    const question: Question = {
      id: 'q-test-ohm',
      conceptID: 'c-elec-basics',
      difficulty: 1,
      prompt: 'What is Ohm’s law?',
      options: [
        { id: 'opt-correct', text: 'V = IR' },
        { id: 'opt-wrong', text: 'V = I/R', misconception: 'inverted-ohm' },
      ],
      correctOptionID: 'opt-correct',
      explanation: 'V equals I times R.',
    };

    // Answer correctly
    useStore.getState().updateMastery(question, question.options[0]);
    const learnerAfterCorrect = useStore.getState().learner;
    assert.equal(learnerAfterCorrect.mastery['c-elec-basics']?.probability, 0.5);
    assert.equal(learnerAfterCorrect.mastery['c-elec-basics']?.attempts, 1);
    assert.equal(learnerAfterCorrect.attempts.length, 1);
    assert.equal(learnerAfterCorrect.attempts[0].questionID, 'q-test-ohm');
    assert.equal(learnerAfterCorrect.attempts[0].conceptID, 'c-elec-basics');
    assert.equal(learnerAfterCorrect.attempts[0].selectedOptionID, 'opt-correct');
    assert.equal(learnerAfterCorrect.attempts[0].score, 1.0);
    assert.ok(typeof learnerAfterCorrect.attempts[0].occurredAt === 'string');

    // Answer incorrectly with misconception
    useStore.getState().updateMastery(question, question.options[1]);
    const learnerAfterWrong = useStore.getState().learner;
    assert.equal(learnerAfterWrong.mastery['c-elec-basics']?.attempts, 2);
    assert.equal(learnerAfterWrong.mastery['c-elec-basics']?.misconceptions['inverted-ohm'], 1);
    assert.equal(learnerAfterWrong.attempts.length, 2);
    assert.equal(learnerAfterWrong.attempts[1].score, 0.0);
  });

  await t.test('TC-STORE-05: applyPatch applies operations and writes changelog entry', () => {
    const course = createFreshCourse();
    useStore.getState().setCourse(course);

    const patch: RoadmapPatch = {
      summary: 'Update intro block markdown',
      ops: [
        {
          type: 'replaceBlock',
          lessonID: 'l-elec-basics',
          blockID: 'b-hook-elec',
          block: { type: 'markdown', id: 'b-hook-elec', markdown: 'Updated through store' },
          reason: 'Typo fix',
        },
      ],
    };

    const result = useStore.getState().applyPatch(patch, 'report', 'Typo fix in intro block');
    assert.equal(result.success, true);

    const updatedCourse = useStore.getState().course!;
    assert.equal(updatedCourse.version, course.version + 1);
    assert.equal(
      (updatedCourse.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown,
      'Updated through store'
    );
    assert.equal(updatedCourse.changelog.length, 1);
    const logEntry = updatedCourse.changelog[0];
    assert.equal(logEntry.source, 'report');
    assert.equal(logEntry.reason, 'Typo fix in intro block');
    assert.equal(logEntry.undone, false);
    assert.ok(logEntry.inverseOps.length > 0);
  });

  await t.test('TC-STORE-06: undo action reverses applied patch and updates changelog', () => {
    const course = createFreshCourse();
    useStore.getState().setCourse(course);
    const originalText = (course.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown;

    const patch: RoadmapPatch = {
      summary: 'Temporary practice task',
      ops: [
        {
          type: 'replaceBlock',
          lessonID: 'l-elec-basics',
          blockID: 'b-hook-elec',
          block: { type: 'markdown', id: 'b-hook-elec', markdown: 'Replaced text' },
          reason: 'Edit before undo',
        },
      ],
    };

    useStore.getState().applyPatch(patch, 'adapt', 'Temporary edit');
    const entryID = useStore.getState().course!.changelog[0].id;

    // Perform undo
    const undoResult = useStore.getState().undo(entryID);
    assert.equal(undoResult.success, true);

    const revertedCourse = useStore.getState().course!;
    assert.equal(
      (revertedCourse.lessons['l-elec-basics'].blocks[0] as { markdown: string }).markdown,
      originalText
    );
    assert.equal(revertedCourse.changelog[0].undone, true);

    // Double undo should be rejected
    const secondUndo = useStore.getState().undo(entryID);
    assert.equal(secondUndo.success, false);
    assert.equal(secondUndo.error, 'Entry not found or already undone.');
  });

  await t.test('TC-STORE-07: reset resets all state slices cleanly', () => {
    useStore.getState().setCourse(createFreshCourse());
    useStore.getState().completeLesson('l-elec-basics');
    useStore.getState().setError('Sample error');
    useStore.getState().setBuilding(true, 'Step 1');

    useStore.getState().reset();

    const state = useStore.getState();
    assert.equal(state.course, null);
    assert.equal(state.latestError, null);
    assert.deepEqual(state.learner, defaultLearnerState());
  });
});
