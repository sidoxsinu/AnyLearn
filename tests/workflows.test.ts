import test from 'node:test';
import assert from 'node:assert/strict';
import { useStore } from '../src/lib/store';
import { pcbCourseFixture } from '../src/lib/fixture';
import { validateDAG } from '../src/lib/dagValidator';
import { Mastery } from '../src/lib/mastery';
import type { Course, RoadmapPatch, Lesson } from '../src/lib/models';

test('Real-World Workflows — Tier 4 Test Suite', async (t) => {
  t.beforeEach(() => {
    useStore.getState().reset();
  });

  await t.test('TC-WF-01: Demo Mode Fixture Integrity & Evaluation Walkthrough', () => {
    // Simulate user selecting "Preview with PCB Design demo"
    const courseFixture = JSON.parse(JSON.stringify(pcbCourseFixture)) as Course;
    useStore.getState().setCourse(courseFixture);

    const storeCourse = useStore.getState().course;
    assert.ok(storeCourse !== null);
    assert.equal(storeCourse.id, 'demo-pcb-course');
    assert.equal(storeCourse.profile.topic, 'PCB Design');
    assert.equal(storeCourse.profile.endArtifact, 'Working PCB board');
    assert.equal(storeCourse.profile.level, 'beginner');

    // Verify concept graph is 100% valid DAG
    assert.equal(validateDAG(storeCourse.concepts), true);
    assert.equal(storeCourse.concepts.length, 7);

    // Verify all module lesson IDs resolve to real lesson definitions
    const lessonIDsInModules = storeCourse.modules.flatMap(m => m.lessonIDs);
    for (const lid of lessonIDsInModules) {
      const lesson: Lesson | undefined = storeCourse.lessons[lid];
      assert.ok(lesson, `Lesson ${lid} from module must exist in lessons map`);
      assert.equal(lesson.id, lid);
      // All concepts in lesson must exist in course concepts
      const conceptIDs = new Set(storeCourse.concepts.map(c => c.id));
      for (const cid of lesson.conceptIDs) {
        assert.ok(conceptIDs.has(cid), `Concept ${cid} in lesson ${lid} must exist`);
      }
    }

    // Verify first lesson has ready status and complete block payload
    const firstLesson = storeCourse.lessons['l-elec-basics'];
    assert.equal(firstLesson.status, 'ready');
    assert.ok(firstLesson.blocks.length >= 3);
    assert.ok(firstLesson.blocks.some(b => b.type === 'markdown'));
    assert.ok(firstLesson.blocks.some(b => b.type === 'workedExample'));
    assert.ok(firstLesson.blocks.some(b => b.type === 'checkpoint'));

    // Verify quizzes exist and are well-formed
    const quiz = storeCourse.quizzes['l-elec-basics'];
    assert.ok(quiz && quiz.length > 0);
    for (const q of quiz) {
      assert.ok(q.prompt.length > 0);
      assert.ok(q.options.length >= 2);
      assert.ok(q.options.some(opt => opt.id === q.correctOptionID));
    }
  });

  await t.test('TC-WF-02: Quiz-to-Mastery Progression & Adaptive Trigger Lifecycle', () => {
    const courseFixture = JSON.parse(JSON.stringify(pcbCourseFixture)) as Course;
    useStore.getState().setCourse(courseFixture);

    const quiz = courseFixture.quizzes['l-elec-basics'];
    const q1 = quiz[0];
    const correctOpt1 = q1.options.find(o => o.id === q1.correctOptionID)!;

    // 1. Answer Q1 correctly
    useStore.getState().updateMastery(q1, correctOpt1);
    let state = useStore.getState();
    const cid = q1.conceptID;
    assert.equal(state.learner.mastery[cid]?.probability, 0.5);
    assert.equal(state.learner.mastery[cid]?.attempts, 1);
    assert.equal(Mastery.colorClass(state.learner.mastery[cid]), 'ok');
    assert.equal(Mastery.shouldAdapt(state.learner.mastery[cid]!), false);

    // 2. Answer Q2 incorrectly with a misconception option
    const q2 = quiz[1] ?? quiz[0];
    const wrongOptWithMisconception = q2.options.find(o => o.id !== q2.correctOptionID && o.misconception)
      ?? { id: 'opt-misc', text: 'Wrong', misconception: 'inverted-law' };

    useStore.getState().updateMastery(q2, wrongOptWithMisconception);
    state = useStore.getState();
    assert.equal(state.learner.mastery[q2.conceptID]?.attempts, q2.conceptID === cid ? 2 : 1);

    // 3. Repeat wrong answer with same misconception -> trigger adaptation
    useStore.getState().updateMastery(q2, wrongOptWithMisconception);
    state = useStore.getState();
    const targetRecord = state.learner.mastery[q2.conceptID]!;
    assert.ok(targetRecord.misconceptions[wrongOptWithMisconception.misconception!] >= 2);
    assert.equal(Mastery.shouldAdapt(targetRecord), true);

    // 4. Mark lesson as complete
    useStore.getState().completeLesson('l-elec-basics');
    assert.ok(useStore.getState().learner.completedLessonIDs.includes('l-elec-basics'));

    // 5. Verify average mastery dashboard metric
    const allConceptIDs = courseFixture.concepts.map(c => c.id);
    const totalMastery = allConceptIDs.reduce(
      (acc, id) => acc + (state.learner.mastery[id]?.probability ?? 0),
      0
    );
    const avgMastery = totalMastery / allConceptIDs.length;
    assert.ok(avgMastery >= 0 && avgMastery <= 1.0);
  });

  await t.test('TC-WF-03: Remedial Course Patch Generation & Full Undo Lifecycle', () => {
    const courseFixture = JSON.parse(JSON.stringify(pcbCourseFixture)) as Course;
    useStore.getState().setCourse(courseFixture);

    const initialVersion = courseFixture.version;
    const initialLessonCount = courseFixture.modules[0].lessonIDs.length;

    // Insert remedial lesson after struggling on electrical fundamentals
    const remedialLesson: Lesson = {
      id: 'l-remedial-ohm-practice',
      moduleID: 'm-foundations',
      title: 'Targeted Review: Ohm’s Law & Resistance',
      conceptIDs: ['c-elec-basics'],
      objectives: ['Review V=IR', 'Work through 5 practical examples'],
      status: 'ready',
      blocks: [
        {
          type: 'markdown',
          id: 'b-rem-intro',
          markdown: '## Refresher on Ohm’s Law\nLet’s revisit the relationship between voltage, current, and resistance.',
        },
      ],
      resourceQueries: ['Ohm Law beginner practice problems'],
      resources: [],
      sources: [],
      unsourced: false,
      confidence: 'high',
      version: 1,
    };

    const patch: RoadmapPatch = {
      summary: 'Adaptive reinforcement for electronic fundamentals',
      ops: [
        {
          type: 'insertLesson',
          afterLessonID: 'l-elec-basics',
          lesson: remedialLesson,
          reason: 'Insert remedial practice',
        },
      ],
    };

    // Apply patch
    const patchResult = useStore.getState().applyPatch(patch, 'adapt', 'Adaptive lesson insertion');
    assert.equal(patchResult.success, true);

    const patchedCourse = useStore.getState().course!;
    assert.equal(patchedCourse.version, initialVersion + 1);
    assert.equal(patchedCourse.modules[0].lessonIDs.length, initialLessonCount + 1);
    assert.ok(patchedCourse.lessons['l-remedial-ohm-practice']);
    assert.equal(patchedCourse.changelog.length, 1);

    const changeEntryID = patchedCourse.changelog[0].id;
    assert.equal(patchedCourse.changelog[0].undone, false);

    // Now trigger undo
    const undoResult = useStore.getState().undo(changeEntryID);
    assert.equal(undoResult.success, true);

    const restoredCourse = useStore.getState().course!;
    assert.equal(restoredCourse.modules[0].lessonIDs.length, initialLessonCount);
    assert.equal(restoredCourse.lessons['l-remedial-ohm-practice'], undefined);
    assert.equal(restoredCourse.changelog[0].undone, true);
  });

  await t.test('TC-WF-04: Storage Serialization & Hydration Safety', () => {
    const courseFixture = JSON.parse(JSON.stringify(pcbCourseFixture)) as Course;
    useStore.getState().setCourse(courseFixture);
    useStore.getState().completeLesson('l-elec-basics');

    const state = useStore.getState();
    // Simulate localStorage partialize logic
    const persistedPayload = JSON.stringify({
      state: {
        course: state.course,
        learner: state.learner,
      },
      version: 0,
    });

    assert.ok(persistedPayload.includes('demo-pcb-course'));
    assert.ok(persistedPayload.includes('l-elec-basics'));

    // Rehydrate
    const parsed = JSON.parse(persistedPayload);
    assert.equal(parsed.state.course.id, 'demo-pcb-course');
    assert.deepEqual(parsed.state.learner.completedLessonIDs, ['l-elec-basics']);
  });
});
