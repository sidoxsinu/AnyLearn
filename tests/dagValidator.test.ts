import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDAG } from '../src/lib/dagValidator';
import { pcbCourseFixture } from '../src/lib/fixture';
import type { Concept } from '../src/lib/models';

test('DAG Validator — Tier 1 Feature Tests', async (t) => {
  await t.test('TC-DAG-01: valid linear pipeline (A -> B -> C -> D)', () => {
    const concepts: Concept[] = [
      { id: 'c1', name: 'A', summary: '', prereqIDs: [] },
      { id: 'c2', name: 'B', summary: '', prereqIDs: ['c1'] },
      { id: 'c3', name: 'C', summary: '', prereqIDs: ['c2'] },
      { id: 'c4', name: 'D', summary: '', prereqIDs: ['c3'] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-02: valid diamond dependency graph', () => {
    const concepts: Concept[] = [
      { id: 'cA', name: 'A', summary: '', prereqIDs: [] },
      { id: 'cB', name: 'B', summary: '', prereqIDs: ['cA'] },
      { id: 'cC', name: 'C', summary: '', prereqIDs: ['cA'] },
      { id: 'cD', name: 'D', summary: '', prereqIDs: ['cB', 'cC'] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-03: valid multi-root DAG with confluence', () => {
    const concepts: Concept[] = [
      { id: 'r1', name: 'Root 1', summary: '', prereqIDs: [] },
      { id: 'r2', name: 'Root 2', summary: '', prereqIDs: [] },
      { id: 'c1', name: 'Child 1', summary: '', prereqIDs: ['r1', 'r2'] },
      { id: 'c2', name: 'Leaf', summary: '', prereqIDs: ['c1'] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-04: direct two-node cycle rejection (A -> B -> A)', () => {
    const concepts: Concept[] = [
      { id: 'c1', name: 'A', summary: '', prereqIDs: ['c2'] },
      { id: 'c2', name: 'B', summary: '', prereqIDs: ['c1'] },
    ];
    assert.equal(validateDAG(concepts), false);
  });

  await t.test('TC-DAG-05: three-node cycle rejection (A -> B -> C -> A)', () => {
    const concepts: Concept[] = [
      { id: 'cA', name: 'A', summary: '', prereqIDs: ['cC'] },
      { id: 'cB', name: 'B', summary: '', prereqIDs: ['cA'] },
      { id: 'cC', name: 'C', summary: '', prereqIDs: ['cB'] },
    ];
    assert.equal(validateDAG(concepts), false);
  });

  await t.test('TC-DAG-06: self-referential node cycle rejection (A -> A)', () => {
    const concepts: Concept[] = [
      { id: 'cA', name: 'A', summary: '', prereqIDs: ['cA'] },
    ];
    assert.equal(validateDAG(concepts), false);
  });

  await t.test('TC-DAG-07: disconnected independent valid components', () => {
    const concepts: Concept[] = [
      { id: 'a1', name: 'A1', summary: '', prereqIDs: [] },
      { id: 'a2', name: 'A2', summary: '', prereqIDs: ['a1'] },
      { id: 'b1', name: 'B1', summary: '', prereqIDs: [] },
      { id: 'b2', name: 'B2', summary: '', prereqIDs: ['b1'] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-08: empty concepts array is trivially valid', () => {
    assert.equal(validateDAG([]), true);
  });

  await t.test('TC-DAG-09: single standalone concept is valid', () => {
    const concepts: Concept[] = [
      { id: 'solo', name: 'Solo', summary: '', prereqIDs: [] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-10: foreign prerequisite ID not in concepts list is ignored safely', () => {
    const concepts: Concept[] = [
      { id: 'c1', name: 'Node 1', summary: '', prereqIDs: ['non-existent-prereq'] },
    ];
    assert.equal(validateDAG(concepts), true);
  });

  await t.test('TC-DAG-11: pcbCourseFixture concepts DAG is fully valid', () => {
    assert.ok(pcbCourseFixture.concepts.length > 0);
    assert.equal(validateDAG(pcbCourseFixture.concepts), true);
  });
});
