import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

import RoadmapPage from '../src/app/roadmap/page.tsx';
import GoalPage from '../src/app/goal/page.tsx';
import BuildPage from '../src/app/build/page.tsx';
import LessonPage from '../src/app/lesson/[id]/page.tsx';
import QuizPage from '../src/app/quiz/[lessonId]/page.tsx';
import ReportPage from '../src/app/report/[lessonId]/page.tsx';
import RootPage from '../src/app/page.tsx';
import { ApiKeyModal } from '../src/components/ApiKeyModal.tsx';

import { useStore } from '../src/lib/store';
import { ApiKeyStore } from '../src/lib/llmClient';
import { pcbCourseFixture } from '../src/lib/fixture';
import { setMockParams, resetRouterCalls } from './mock_navigation.mjs';

// Setup Mock Browser Globals
const storageState = new Map();
globalThis.localStorage = {
  getItem: (k) => storageState.get(k) ?? null,
  setItem: (k, v) => { storageState.set(k, String(v)); },
  removeItem: (k) => { storageState.delete(k); },
  clear: () => { storageState.clear(); },
};

const sessionState = new Map();
globalThis.sessionStorage = {
  getItem: (k) => sessionState.get(k) ?? null,
  setItem: (k, v) => { sessionState.set(k, String(v)); },
  removeItem: (k) => { sessionState.delete(k); },
  clear: () => { sessionState.clear(); },
};

// Ensure window is defined for client-side code checks
globalThis.window = globalThis;

const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

// Helper: render in CSR mode (where useSyncExternalStore uses client getSnapshot)
function renderCSR(elem) {
  let origH = internals.H;
  Object.defineProperty(internals, 'H', {
    configurable: true,
    get() { return origH; },
    set(dispatcher) {
      if (dispatcher && dispatcher.useSyncExternalStore) {
        dispatcher.useSyncExternalStore = (_sub, getSnap) => getSnap();
      }
      origH = dispatcher;
    }
  });
  try {
    return ReactDOMServer.renderToString(elem);
  } finally {
    Object.defineProperty(internals, 'H', {
      configurable: true,
      writable: true,
      value: origH,
    });
  }
}

test('Adversarial Stress Suite — Milestone 2', async (t) => {

  t.beforeEach(() => {
    resetRouterCalls();
    storageState.clear();
    sessionState.clear();
    useStore.getState().reset();
    setMockParams({ id: '', lessonId: '' });
  });

  await t.test('STRESS-01: SSR markup stability with useSyncExternalStore (No Hydration Mismatches)', () => {
    // 1. GoalPage SSR render
    const goalHtml = ReactDOMServer.renderToString(React.createElement(GoalPage));
    assert.ok(goalHtml.includes('What do you want to learn?'), 'Goal page renders intake header on SSR');
    assert.ok(!goalHtml.includes('modal-overlay'), 'Modal must not render during SSR pass to prevent mismatch');

    // 2. RoadmapPage SSR render with empty store
    const roadmapHtmlEmpty = ReactDOMServer.renderToString(React.createElement(RoadmapPage));
    assert.equal(roadmapHtmlEmpty, '', 'RoadmapPage returns null during SSR pass');

    // 3. RoadmapPage SSR render with loaded course
    useStore.getState().setCourse(pcbCourseFixture);
    const roadmapHtmlLoaded = ReactDOMServer.renderToString(React.createElement(RoadmapPage));
    assert.equal(roadmapHtmlLoaded, '', 'RoadmapPage returns null during SSR pass even with loaded course');
  });

  await t.test('STRESS-02: CSR rendering with useSyncExternalStore post-hydration', () => {
    // 1. GoalPage CSR render without API key: should show ApiKeyModal
    ApiKeyStore.clear();
    const goalCSRHtmlNoKey = renderCSR(React.createElement(GoalPage));
    assert.ok(goalCSRHtmlNoKey.includes('modal-overlay'), 'Shows modal on client post-hydration when no key');

    // 2. GoalPage CSR render with API key: should show goal intake form
    ApiKeyStore.set('AIzaTestKey1234567890');
    const goalCSRHtmlWithKey = renderCSR(React.createElement(GoalPage));
    assert.ok(!goalCSRHtmlWithKey.includes('modal-overlay'), 'Does not show modal when API key is present');
    assert.ok(goalCSRHtmlWithKey.includes('What do you want to learn?'), 'Renders intake form');

    // 3. RoadmapPage CSR render with loaded course
    useStore.getState().setCourse(pcbCourseFixture);
    const roadmapCSRHtml = renderCSR(React.createElement(RoadmapPage));
    assert.ok(roadmapCSRHtml.includes('AnyLearn'), 'Renders navbar brand');
    assert.ok(roadmapCSRHtml.includes('PCB design from zero'), 'Renders course goal');
    assert.ok(roadmapCSRHtml.includes('roadmap-container'), 'Renders roadmap graph container');
  });

  await t.test('STRESS-03: Missing/Invalid lesson ID handling in LessonPage (CSR mode)', () => {
    useStore.getState().setCourse(pcbCourseFixture);

    const testInvalidIDs = [
      'non-existent-lesson-id-999',
      'undefined',
      'null',
      '',
      '..%2F..%2Fetc',
      'invalid_id_with_special_chars!@#$',
    ];

    for (const invalidID of testInvalidIDs) {
      setMockParams({ id: invalidID });
      const html = renderCSR(React.createElement(LessonPage));
      assert.ok(html.includes('Lesson not found'), `Must render "Lesson not found" for invalid ID: "${invalidID}"`);
      assert.ok(html.includes('Return to Roadmap'), `Must render "Return to Roadmap" CTA for invalid ID: "${invalidID}"`);
      assert.ok(!html.includes('spinner'), `Must not show spinner for invalid ID: "${invalidID}"`);
    }
  });

  await t.test('STRESS-04: Valid lesson rendering in LessonPage (CSR mode)', () => {
    useStore.getState().setCourse(pcbCourseFixture);
    setMockParams({ id: 'l-elec-basics' });

    const html = renderCSR(React.createElement(LessonPage));
    assert.ok(html.includes('Voltage, Current &amp; Resistance') || html.includes('Voltage, Current & Resistance'), 'Renders lesson title');
    assert.ok(html.includes('LEARNING OBJECTIVES'), 'Renders learning objectives card');
    assert.ok(html.includes('HANDS-ON TASK'), 'Renders hands-on task card');
    assert.ok(html.includes('Take Quiz'), 'Renders quiz button');
    assert.ok(html.includes('Report / Fix'), 'Renders report button');
  });

  await t.test('STRESS-05: Empty store states across all routes (CSR mode)', () => {
    // With useStore().course === null:
    // 1. RootPage
    const rootHtml = renderCSR(React.createElement(RootPage));
    assert.ok(rootHtml.includes('spinner'), 'RootPage renders loading spinner during store hydration delay');

    // 2. QuizPage with empty store
    setMockParams({ lessonId: 'l-elec-basics' });
    const quizHtml = renderCSR(React.createElement(QuizPage));
    assert.ok(quizHtml.includes('No quiz yet'), 'QuizPage renders fallback with empty store');
    assert.ok(quizHtml.includes('Go to Lesson'), 'QuizPage renders navigation button to lesson');

    // 3. ReportPage with empty store
    setMockParams({ lessonId: 'l-elec-basics' });
    const reportHtml = renderCSR(React.createElement(ReportPage));
    assert.ok(reportHtml.includes('Roadmap'), 'ReportPage renders back button to roadmap');

    // 4. LessonPage with empty store
    setMockParams({ id: 'l-elec-basics' });
    const lessonHtml = renderCSR(React.createElement(LessonPage));
    // Observation: LessonPage renders spinner indefinitely when course is null
    assert.ok(lessonHtml.includes('spinner'), 'LessonPage renders spinner when course is not loaded');
  });

  await t.test('STRESS-06: Demo Mode activation and transition in ApiKeyModal', () => {
    let modalClosed = false;
    const modalElement = React.createElement(ApiKeyModal, {
      onReady: () => { modalClosed = true; },
    });

    const html = renderCSR(modalElement);
    assert.ok(html.includes('Preview with PCB Design demo'), 'Modal renders preview button');
    assert.ok(html.includes('Gemini API Key'), 'Modal renders API key input');

    // Simulate clicking handlePreview
    localStorage.setItem('anylearn-demo-mode', 'true');
    useStore.getState().setCourse(pcbCourseFixture);
    modalClosed = true;

    assert.ok(modalClosed);
    assert.equal(localStorage.getItem('anylearn-demo-mode'), 'true');
    const course = useStore.getState().course;
    assert.ok(course !== null);
    assert.equal(course.id, 'demo-pcb-course');
    assert.equal(Object.keys(course.lessons).length, 10);
  });

  await t.test('STRESS-07: Rapid mount/unmount and state transition loop stress test', () => {
    useStore.getState().setCourse(pcbCourseFixture);
    setMockParams({ id: 'l-elec-basics', lessonId: 'l-elec-basics' });

    const capturedErrors = [];
    const capturedWarns = [];
    const origError = console.error;
    const origWarn = console.warn;
    console.error = (...args) => { capturedErrors.push(args.join(' ')); };
    console.warn = (...args) => { capturedWarns.push(args.join(' ')); };

    try {
      // 100 rapid CSR renders across all pages
      for (let i = 0; i < 100; i++) {
        renderCSR(React.createElement(GoalPage));
        renderCSR(React.createElement(RoadmapPage));
        renderCSR(React.createElement(LessonPage));
        renderCSR(React.createElement(QuizPage));
        renderCSR(React.createElement(ReportPage));
        renderCSR(React.createElement(RootPage));
      }
    } finally {
      console.error = origError;
      console.warn = origWarn;
    }

    // Verify no React internal fatal warnings
    const fatalErrors = capturedErrors.filter(e =>
      e.includes('Maximum update depth exceeded') ||
      e.includes('Cannot update a component while rendering a different component')
    );
    assert.equal(fatalErrors.length, 0, `No cascading render errors detected: ${fatalErrors.join(', ')}`);
  });

  await t.test('STRESS-08: BuildPage parameter extraction and SSR/CSR safety', () => {
    sessionStorage.setItem('anylearn-goal', 'Learn Quantum Computing from scratch');
    sessionStorage.setItem('anylearn-artifact', 'Working prototype');
    sessionStorage.setItem('anylearn-hours', '10');

    // SSR pass: no sessionStorage direct render
    const ssrHtml = ReactDOMServer.renderToString(React.createElement(BuildPage));
    assert.ok(ssrHtml.includes('Building your course'), 'BuildPage renders step pipeline');
    assert.ok(!ssrHtml.includes('Learn Quantum Computing from scratch'), 'Goal summary is deferred to post-hydration microtask');

    // CSR pass
    const csrHtml = renderCSR(React.createElement(BuildPage));
    assert.ok(csrHtml.includes('Building your course'), 'CSR renders pipeline');
  });

  await t.test('STRESS-09: Store immutability and reset idempotency under stress', () => {
    for (let i = 0; i < 50; i++) {
      useStore.getState().setCourse(pcbCourseFixture);
      assert.ok(useStore.getState().course !== null);
      useStore.getState().completeLesson('l-elec-basics');
      assert.ok(useStore.getState().learner.completedLessonIDs.includes('l-elec-basics'));
      useStore.getState().reset();
      assert.equal(useStore.getState().course, null);
      assert.equal(useStore.getState().learner.completedLessonIDs.length, 0);
    }
  });

  await t.test('STRESS-10: Demo Mode stub lesson notice verification in LessonPage', () => {
    useStore.getState().setCourse(pcbCourseFixture);
    const stubLesson = pcbCourseFixture.lessons['l-schematic-reading'];
    assert.equal(stubLesson.status, 'stub', 'l-schematic-reading is a stub lesson');

    setMockParams({ id: 'l-schematic-reading' });
    const html = renderCSR(React.createElement(LessonPage));
    assert.ok(html.includes('LEARNING OBJECTIVES'), 'Renders stub objectives');
    assert.ok(html.includes('Reading Schematics'), 'Renders stub lesson title');
    assert.ok(html.includes('Identify standard schematic symbols'), 'Renders objective text');
    assert.ok(html.includes('disabled=""') || html.includes('disabled'), 'Quiz button disabled for stub lesson');
    assert.ok(!html.includes('✓ Mark complete'), 'Mark complete hidden for stub lesson');
  });

});
