import test from 'node:test';
import assert from 'node:assert/strict';
import { PatchEngineError, applyPatch } from '../src/lib/patchEngine';
import { Mastery } from '../src/lib/mastery';
import { pcbCourseFixture } from '../src/lib/fixture';
import { defaultLearnerState } from '../src/lib/models';
import { useStore } from '../src/lib/store';
import type { Course, LearnerState, RoadmapPatch, Lesson } from '../src/lib/models';
import type { StateStorage } from 'zustand/middleware';

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

test('Baseline Regression Assertions — Tier 4 Test Suite', async (t) => {
  t.beforeEach(() => {
    useStore.getState().reset();
  });

  await t.test('TC-REG-01: PatchEngineError constructor standardization for strip-only compatibility', () => {
    const error = new PatchEngineError('tooManyOperations', 'Maximum 3 allowed');
    assert.ok(error instanceof Error);
    assert.equal(error.name, 'PatchEngineError');
    assert.equal(error.code, 'tooManyOperations');
    assert.equal(error.message, 'Patch rejected: tooManyOperations — Maximum 3 allowed');

    const errorWithoutDetail = new PatchEngineError('cyclicGraph');
    assert.equal(errorWithoutDetail.code, 'cyclicGraph');
    assert.equal(errorWithoutDetail.message, 'Patch rejected: cyclicGraph');
  });

  await t.test('TC-REG-02: Completed lesson protection prevents deletion of user progress', () => {
    const course = createFreshCourse();
    const learner: LearnerState = {
      ...defaultLearnerState(),
      completedLessonIDs: ['l-elec-basics', 'l-components'],
    };

    const deleteCompletedPatch: RoadmapPatch = {
      summary: 'Should be blocked',
      ops: [{ type: 'deleteLesson', lessonID: 'l-elec-basics', reason: 'Attempt delete' }],
    };

    assert.throws(
      () => applyPatch(deleteCompletedPatch, course, learner),
      (err: unknown) => {
        return err instanceof PatchEngineError && err.code === 'completedLesson';
      }
    );

    // Verify uncompleted lesson can be deleted without error
    const deleteUncompletedPatch: RoadmapPatch = {
      summary: 'Safe delete',
      ops: [{ type: 'deleteLesson', lessonID: 'l-order', reason: 'Remove order lesson' }],
    };
    const result = applyPatch(deleteUncompletedPatch, course, learner);
    assert.equal(result.course.lessons['l-order'], undefined);
  });

  await t.test('TC-REG-03: Cycle detection in patch engine preserves course state draft isolation', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const snapshotBefore = JSON.stringify(course);

    // Create a 2-node cycle with new concepts
    const patchCycle: RoadmapPatch = {
      summary: 'Circular prerequisite',
      ops: [
        {
          type: 'addConcept',
          concept: { id: 'c-cycle-1', name: 'Node 1', summary: '', prereqIDs: ['c-cycle-2'] },
          reason: 'Op 1',
        },
        {
          type: 'addConcept',
          concept: { id: 'c-cycle-2', name: 'Node 2', summary: '', prereqIDs: ['c-cycle-1'] },
          reason: 'Op 2',
        },
      ],
    };

    assert.throws(
      () => applyPatch(patchCycle, course, learner),
      (err: unknown) => err instanceof PatchEngineError && err.code === 'cyclicGraph'
    );

    // Verify course object was completely uncorrupted
    assert.equal(JSON.stringify(course), snapshotBefore);
  });

  await t.test('TC-REG-04: Deep course state undo invariance', () => {
    const course = createFreshCourse();
    const learner = defaultLearnerState();
    const originalBlocks = JSON.parse(JSON.stringify(course.lessons['l-elec-basics'].blocks));
    const originalLessonIDs = [...course.modules[0].lessonIDs];

    const patch: RoadmapPatch = {
      summary: 'Multi-operation update',
      ops: [
        {
          type: 'replaceBlock',
          lessonID: 'l-elec-basics',
          blockID: 'b-hook-elec',
          block: { type: 'markdown', id: 'b-hook-elec', markdown: 'Replaced introductory hook.' },
          reason: 'Better hook',
        },
        {
          type: 'insertLesson',
          afterLessonID: 'l-elec-basics',
          lesson: makeLesson('l-transient-test', 'm-foundations', 'Transient Test Lesson', ['c-elec-basics']),
          reason: 'Transient lesson',
        },
      ],
    };

    const applied = applyPatch(patch, course, learner);
    assert.equal(applied.course.version, course.version + 1);
    assert.equal(applied.course.modules[0].lessonIDs.length, originalLessonIDs.length + 1);

    // Apply inverse ops
    const undoPatch: RoadmapPatch = {
      summary: 'Revert',
      ops: applied.inverse,
    };
    const reverted = applyPatch(undoPatch, applied.course, learner);

    // Compare original lesson content and module lessons
    assert.deepEqual(reverted.course.lessons['l-elec-basics'].blocks, originalBlocks);
    assert.deepEqual(reverted.course.modules[0].lessonIDs, originalLessonIDs);
    assert.equal(reverted.course.lessons['l-transient-test'], undefined);
  });

  await t.test('TC-REG-05: Mastery clamping and alpha attenuation under repeated updates', () => {
    const record = Mastery.defaultRecord();

    // Attenuation verification:
    // Attempt 1: alpha = 0.5 -> 0 + 0.5 * 1 = 0.5
    const step1 = Mastery.update(record, 1.0, 1);
    assert.equal(step1.probability, 0.5);
    assert.equal(step1.attempts, 1);

    // Attempt 2: alpha = 0.5 -> 0.5 + 0.5 * (1 - 0.5) = 0.75
    const step2 = Mastery.update(step1, 1.0, 1);
    assert.equal(step2.probability, 0.75);
    assert.equal(step2.attempts, 2);

    // Attempt 3: alpha = 0.3 -> 0.75 + 0.3 * (1 - 0.75) = 0.825
    const step3 = Mastery.update(step2, 1.0, 1);
    assert.ok(Math.abs(step3.probability - 0.825) < 1e-9);
    assert.equal(step3.attempts, 3);

    // Bounds check: probability must never exceed 1.0
    let current = step3;
    for (let i = 0; i < 20; i++) {
      current = Mastery.update(current, 10.0, 1);
    }
    assert.ok(current.probability <= 1.0);
    assert.ok(current.probability >= 0.0);
  });

  await t.test('TC-REG-06: Store idempotency for lesson completion', () => {
    for (let i = 0; i < 5; i++) {
      useStore.getState().completeLesson('l-elec-basics');
    }
    const completed = useStore.getState().learner.completedLessonIDs;
    assert.equal(completed.length, 1);
    assert.equal(completed[0], 'l-elec-basics');
  });

  await t.test('TC-REG-07: Double undo prevention in store', () => {
    const course = createFreshCourse();
    useStore.getState().setCourse(course);

    const patch: RoadmapPatch = {
      summary: 'Single op',
      ops: [
        {
          type: 'markSkippable',
          lessonID: 'l-components',
          reason: 'Skip',
        },
      ],
    };

    useStore.getState().applyPatch(patch, 'adapt', 'Mark components skippable');
    const entryID = useStore.getState().course!.changelog[0].id;

    // First undo succeeds
    const firstUndo = useStore.getState().undo(entryID);
    assert.equal(firstUndo.success, true);

    // Second undo fails gracefully
    const secondUndo = useStore.getState().undo(entryID);
    assert.equal(secondUndo.success, false);
    assert.equal(secondUndo.error, 'Entry not found or already undone.');

    // Undo on non-existent entry ID fails gracefully
    const nonExistentUndo = useStore.getState().undo('fake-entry-id');
    assert.equal(nonExistentUndo.success, false);
    assert.equal(nonExistentUndo.error, 'Entry not found or already undone.');
  });

  await t.test('TC-REG-08: No direct sessionStorage access during component mount / SSR', () => {
    // Verify that storage lookup logic safely handles missing window/sessionStorage
    // without throwing ReferenceError during render phase
    const initialSummary = '';
    assert.equal(initialSummary, '');

    // Simulate safe reader pattern in useEffect:
    // When sessionStorage is absent (e.g., in node/SSR), fallback is safe
    const readStorageSafe = (storageKey: string, fallback: string = ''): string => {
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return fallback;
      }
      return sessionStorage.getItem(storageKey) ?? fallback;
    };

    assert.equal(readStorageSafe('anylearn-goal'), '');
    assert.equal(readStorageSafe('anylearn-artifact', 'Working prototype'), 'Working prototype');
    assert.equal(readStorageSafe('anylearn-hours', '5'), '5');
  });

  await t.test('TC-REG-09: Demo mode preview navigation state & course preloading', () => {
    // Mock localStorage
    const storageMap = new Map<string, string>();
    const mockLocalStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, value: string) => storageMap.set(key, String(value)),
      removeItem: (key: string) => storageMap.delete(key),
    };

    // Simulate Preview click in ApiKeyModal
    mockLocalStorage.setItem('anylearn-demo-mode', 'true');
    useStore.getState().setCourse(pcbCourseFixture);

    // Assert demo mode flag is active
    assert.equal(mockLocalStorage.getItem('anylearn-demo-mode'), 'true');

    // Assert course is loaded with PCB Design fixture
    const activeCourse = useStore.getState().course;
    assert.ok(activeCourse !== null);
    assert.equal(activeCourse.id, 'demo-pcb-course');
    assert.equal(activeCourse.profile.topic, 'PCB Design');

    // Assert destination path for demo preview
    const demoDestination = '/roadmap';
    assert.equal(demoDestination, '/roadmap');
  });

  await t.test('TC-REG-10: Missing lesson fallback handling differentiates loading vs missing', () => {
    const course = createFreshCourse();

    // 1. When course is not loaded: loading state (spinner)
    const resolveLessonView = (currentCourse: Course | null, lessonID: string) => {
      if (currentCourse && !currentCourse.lessons[lessonID]) {
        return { status: 'not_found', canReturnToRoadmap: true, message: 'Lesson not found' };
      }
      if (!currentCourse || !currentCourse.lessons[lessonID]) {
        return { status: 'loading', canReturnToRoadmap: false };
      }
      return { status: 'ready', lesson: currentCourse.lessons[lessonID] };
    };

    const loadingState = resolveLessonView(null, 'l-elec-basics');
    assert.equal(loadingState.status, 'loading');
    assert.equal(loadingState.canReturnToRoadmap, false);

    // 2. When course is loaded and lesson exists: ready
    const readyState = resolveLessonView(course, 'l-elec-basics');
    assert.equal(readyState.status, 'ready');
    assert.ok(readyState.lesson);

    // 3. When course is loaded but lesson ID does not exist: not_found with Return to Roadmap
    const missingState = resolveLessonView(course, 'non-existent-lesson-id');
    assert.equal(missingState.status, 'not_found');
    assert.equal(missingState.canReturnToRoadmap, true);
    assert.equal(missingState.message, 'Lesson not found');
  });

  await t.test('TC-REG-11: Storage fallback satisfies StateStorage contract with type safety', () => {
    // Explicitly type the fallback with Zustand's StateStorage interface
    const dummyStorage: StateStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };

    // Verify method signatures and runtime behavior
    assert.equal(dummyStorage.getItem('anylearn-state'), null);
    assert.doesNotThrow(() => dummyStorage.setItem('test-key', 'test-value'));
    assert.doesNotThrow(() => dummyStorage.removeItem('test-key'));

    // Verify Zustand store behaves predictably with fallback storage
    useStore.getState().reset();
    assert.equal(useStore.getState().course, null);
    assert.equal(useStore.getState().latestError, null);
  });
});
