import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { BlockRenderer } from '../src/components/BlockRenderer';
import { MasteryRing, MasteryBar } from '../src/components/MasteryRing';
import { RoadmapGraph } from '../src/components/RoadmapGraph';
import { pcbCourseFixture } from '../src/lib/fixture';
import { defaultLearnerState } from '../src/lib/models';
import type { Block, Course, LearnerState } from '../src/lib/models';

test('Interactions & UI Logic — Tier 3 Test Suite', async (t) => {
  await t.test('TC-INT-01: BlockRenderer renders markdown block and supports flag callback button', () => {
    const mdBlock: Block = {
      type: 'markdown',
      id: 'b-md-1',
      markdown: '## Heading 2\nThis is paragraph text with **bold** words.',
    };

    // Render without flag
    const htmlWithoutFlag = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: mdBlock })
    );
    assert.ok(htmlWithoutFlag.includes('<h2>Heading 2</h2>'));
    assert.ok(htmlWithoutFlag.includes('<strong>bold</strong>'));
    assert.ok(!htmlWithoutFlag.includes('Flag this block'));

    // Render with flag callback
    let flaggedID = '';
    const onFlag = (id: string) => {
      flaggedID = id;
    };
    const htmlWithFlag = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: mdBlock, onFlag })
    );
    assert.ok(htmlWithFlag.includes('Flag this block'));
    assert.ok(htmlWithFlag.includes('⚑'));
    assert.equal(flaggedID, '');
  });

  await t.test('TC-INT-02: BlockRenderer renders workedExample block with steps and why explanations', () => {
    const exampleBlock: Block = {
      type: 'workedExample',
      id: 'b-ex-1',
      title: 'Calculate Resistor Value for 5V to 2V LED',
      steps: [
        { text: 'Voltage drop across resistor = 5V - 2V = 3V', why: 'Ohm’s law applies to the resistor' },
        { text: 'Target current = 20mA = 0.02A', why: 'Typical LED forward current' },
        { text: 'R = V / I = 3V / 0.02A = 150 Ohms', why: 'Standard Ohm’s law formula' },
      ],
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: exampleBlock })
    );
    assert.ok(html.includes('Calculate Resistor Value for 5V to 2V LED'));
    assert.ok(html.includes('Step 1'));
    assert.ok(html.includes('Step 2'));
    assert.ok(html.includes('Step 3'));
    assert.ok(html.includes('Voltage drop across resistor = 5V - 2V = 3V'));
    assert.ok(html.includes('Ohm’s law applies to the resistor'));
    assert.ok(html.includes('150 Ohms'));
  });

  await t.test('TC-INT-03: BlockRenderer renders callouts with correct icon mappings and kinds', () => {
    const mistakeCallout: Block = {
      type: 'callout',
      id: 'b-call-1',
      kind: 'mistake',
      markdown: 'Do not connect LED directly to 5V power without a current-limiting resistor.',
    };
    const htmlMistake = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: mistakeCallout })
    );
    assert.ok(htmlMistake.includes('block-callout mistake'));
    assert.ok(htmlMistake.includes('⚠'));

    const tipCallout: Block = {
      type: 'callout',
      id: 'b-call-2',
      kind: 'tip',
      markdown: 'Use 0805 SMD package for easier hand soldering.',
    };
    const htmlTip = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: tipCallout })
    );
    assert.ok(htmlTip.includes('block-callout tip'));
    assert.ok(htmlTip.includes('💡'));

    const warningCallout: Block = {
      type: 'callout',
      id: 'b-call-3',
      kind: 'warning',
      markdown: 'Electrolytic capacitors are polarized.',
    };
    const htmlWarning = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: warningCallout })
    );
    assert.ok(htmlWarning.includes('block-callout warning'));
    assert.ok(htmlWarning.includes('🔔'));
  });

  await t.test('TC-INT-04: BlockRenderer renders checkpoint block with question, reveal button, and hint', () => {
    const checkpointBlock: Block = {
      type: 'checkpoint',
      id: 'b-chk-1',
      conceptID: 'c-elec-basics',
      question: 'What happens if you reverse the polarity of a diode?',
      answer: 'It will block current flow (reverse biased) unless breakdown voltage is exceeded.',
      hint: 'Think of a diode like a one-way check valve.',
    };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(BlockRenderer, { block: checkpointBlock })
    );
    assert.ok(html.includes('What happens if you reverse the polarity of a diode?'));
    assert.ok(html.includes('Reveal answer'));
    assert.ok(html.includes('Hint: Think of a diode like a one-way check valve.'));
  });

  await t.test('TC-INT-05: MasteryRing calculates geometry, stroke dasharray, and color tiers accurately', () => {
    // 1. Untouched (0%)
    const html0 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasteryRing, { probability: 0, size: 60, strokeWidth: 6 })
    );
    assert.ok(html0.includes('width="60"'));
    assert.ok(html0.includes('height="60"'));
    assert.ok(html0.includes('var(--mastery-untouched)'));
    assert.ok(html0.includes('0%'));

    // Radius: (60 - 6) / 2 = 27; circumference: 2 * Math.PI * 27 = 169.646
    const r27 = 27;
    const circ27 = 2 * Math.PI * r27;
    assert.ok(html0.includes(`stroke-dasharray="0 ${circ27}"`));

    // 2. Weak (40%)
    const html40 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasteryRing, { probability: 0.4, size: 48, strokeWidth: 4 })
    );
    assert.ok(html40.includes('var(--mastery-weak)'));
    assert.ok(html40.includes('40%'));

    // 3. OK (75%)
    const html75 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasteryRing, { probability: 0.75, size: 48, strokeWidth: 4 })
    );
    assert.ok(html75.includes('var(--mastery-ok)'));
    assert.ok(html75.includes('75%'));

    // 4. Solid (95%) with custom label
    const html95 = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasteryRing, { probability: 0.95, size: 48, strokeWidth: 4, label: 'MASTER' })
    );
    assert.ok(html95.includes('var(--mastery-solid)'));
    assert.ok(html95.includes('MASTER'));
  });

  await t.test('TC-INT-06: MasteryBar renders label, track, fill percentage, and numeric text', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasteryBar, { probability: 0.65, conceptName: 'Kirchhoff’s Current Law' })
    );
    assert.ok(html.includes('Kirchhoff’s Current Law'));
    assert.ok(html.includes('width:65%'));
    assert.ok(html.includes('var(--mastery-ok)'));
    assert.ok(html.includes('65%'));
  });

  await t.test('TC-INT-07: RoadmapGraph computes valid DAG layout with module headers, nodes, and edges', () => {
    const course: Course = JSON.parse(JSON.stringify(pcbCourseFixture));
    const learner: LearnerState = defaultLearnerState();

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(RoadmapGraph, { course, learner, onSelect: () => {} })
    );

    // Verify SVG structure
    assert.ok(html.includes('<svg'));
    assert.ok(html.includes('class="roadmap-svg"'));
    assert.ok(html.includes('id="arrowhead"'));

    // Verify module titles rendered
    assert.ok(html.includes('Electronics Foundations'));
    assert.ok(html.includes('Schematic Design'));
    assert.ok(html.includes('PCB Layout'));
    assert.ok(html.includes('Fabrication &amp; First Board'));

    // Verify lesson titles rendered (note: RoadmapGraph truncates labels to 20 chars)
    assert.ok(html.includes('Voltage, Current'));

    // Verify connecting edges rendered with arrowhead marker
    assert.ok(html.includes('marker-end="url(#arrowhead)"'));
  });

  await t.test('TC-INT-08: RoadmapGraph renders skippable indicator for skippable lessons', () => {
    const course: Course = JSON.parse(JSON.stringify(pcbCourseFixture));
    course.lessons['l-elec-basics'].skippable = { reason: 'Already mastered in diagnostic' };

    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(RoadmapGraph, {
        course,
        learner: defaultLearnerState(),
        onSelect: () => {},
      })
    );

    assert.ok(html.includes('skip ✓'));
  });
});
