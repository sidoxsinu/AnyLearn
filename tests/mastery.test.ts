import test from 'node:test';
import assert from 'node:assert/strict';
import { Mastery } from '../src/lib/mastery';
import type { MasteryRecord, Question } from '../src/lib/models';

test('Mastery Engine — Tier 1 Feature Tests', async (t) => {
  await t.test('TC-MAST-01: defaultRecord initializes with zero probability, zero attempts, empty misconceptions', () => {
    const record = Mastery.defaultRecord();
    assert.equal(record.probability, 0);
    assert.equal(record.attempts, 0);
    assert.deepEqual(record.misconceptions, {});
    assert.equal(Mastery.colorClass(record), 'untouched');
  });

  await t.test('TC-MAST-02: correct answer progression on first attempt updates probability with alpha=0.5', () => {
    const initial = Mastery.defaultRecord();
    // update(record, score, difficulty, misconception)
    const updated = Mastery.update(initial, 1.0, 1);
    // formula: probability + 0.5 * (1 - 0) = 0.5
    assert.equal(updated.probability, 0.5);
    assert.equal(updated.attempts, 1);
    assert.equal(Mastery.colorClass(updated), 'ok');
    assert.equal(Mastery.isWeak(updated), false);
    assert.equal(Mastery.isSolid(updated), false);
  });

  await t.test('TC-MAST-03: multiple attempts progression and alpha attenuation', () => {
    const initial = Mastery.defaultRecord();
    // Attempt 1: alpha = 0.5 -> 0 + 0.5 * (1 - 0) = 0.5
    const att1 = Mastery.update(initial, 1.0, 1);
    assert.equal(att1.attempts, 1);
    assert.equal(att1.probability, 0.5);

    // Attempt 2: attempts was 1 (< 2), so alpha = 0.5 -> 0.5 + 0.5 * (1 - 0.5) = 0.75
    const att2 = Mastery.update(att1, 1.0, 1);
    assert.equal(att2.attempts, 2);
    assert.equal(att2.probability, 0.75);
    assert.equal(Mastery.colorClass(att2), 'ok');

    // Attempt 3: attempts was 2 (not < 2), so alpha = 0.3 -> 0.75 + 0.3 * (1 - 0.75) = 0.825
    const att3 = Mastery.update(att2, 1.0, 1);
    assert.equal(att3.attempts, 3);
    assert.ok(Math.abs(att3.probability - 0.825) < 1e-9);
    assert.equal(Mastery.colorClass(att3), 'solid');
    assert.equal(Mastery.isSolid(att3), true);
  });

  await t.test('TC-MAST-04: wrong answer on difficulty >= 3 penalizes probability', () => {
    // Start with a high-mastery record
    const record: MasteryRecord = { probability: 0.8, attempts: 2, misconceptions: {} };
    // Wrong answer on difficulty 3: adjustedScore = 0, alpha = 0.3
    // new probability = 0.8 + 0.3 * (0 - 0.8) = 0.8 - 0.24 = 0.56
    const updated = Mastery.update(record, 0, 3);
    assert.equal(updated.attempts, 3);
    assert.ok(Math.abs(updated.probability - 0.56) < 1e-9);
  });

  await t.test('TC-MAST-05: misconception tracking on wrong answers', () => {
    const initial = Mastery.defaultRecord();
    const wrong1 = Mastery.update(initial, 0, 1, 'ohm-confusion');
    assert.equal(wrong1.misconceptions['ohm-confusion'], 1);

    const wrong2 = Mastery.update(wrong1, 0, 1, 'ohm-confusion');
    assert.equal(wrong2.misconceptions['ohm-confusion'], 2);

    // Correct answer should not increment misconception
    const correct = Mastery.update(wrong2, 1.0, 1, 'ohm-confusion');
    assert.equal(correct.misconceptions['ohm-confusion'], 2);
  });

  await t.test('TC-MAST-06: classification boundaries (isWeak, isSolid, colorClass)', () => {
    assert.equal(Mastery.isWeak({ probability: 0.49, attempts: 1, misconceptions: {} }), true);
    assert.equal(Mastery.isWeak({ probability: 0.50, attempts: 1, misconceptions: {} }), false);

    assert.equal(Mastery.isSolid({ probability: 0.79, attempts: 1, misconceptions: {} }), false);
    assert.equal(Mastery.isSolid({ probability: 0.80, attempts: 1, misconceptions: {} }), true);
    assert.equal(Mastery.isSolid({ probability: 0.99, attempts: 1, misconceptions: {} }), true);

    assert.equal(Mastery.colorClass(undefined), 'untouched');
    assert.equal(Mastery.colorClass({ probability: 0.9, attempts: 0, misconceptions: {} }), 'untouched');
    assert.equal(Mastery.colorClass({ probability: 0.4, attempts: 1, misconceptions: {} }), 'weak');
    assert.equal(Mastery.colorClass({ probability: 0.5, attempts: 1, misconceptions: {} }), 'ok');
    assert.equal(Mastery.colorClass({ probability: 0.79, attempts: 1, misconceptions: {} }), 'ok');
    assert.equal(Mastery.colorClass({ probability: 0.8, attempts: 1, misconceptions: {} }), 'solid');
  });

  await t.test('TC-MAST-07: adaptation trigger (shouldAdapt)', () => {
    // Condition 1: isWeak && attempts >= 2
    assert.equal(Mastery.shouldAdapt({ probability: 0.4, attempts: 1, misconceptions: {} }), false);
    assert.equal(Mastery.shouldAdapt({ probability: 0.4, attempts: 2, misconceptions: {} }), true);
    assert.equal(Mastery.shouldAdapt({ probability: 0.6, attempts: 3, misconceptions: {} }), false);

    // Condition 2: hasRepeatedMisconception (any >= 2) even if not weak
    assert.equal(Mastery.shouldAdapt({ probability: 0.85, attempts: 3, misconceptions: { 'sign-flip': 2 } }), true);
  });

  await t.test('TC-MAST-08: updateFromAnswer maps question and option correctly', () => {
    const question: Question = {
      id: 'q1',
      conceptID: 'c1',
      difficulty: 2,
      prompt: 'What is Ohm’s law?',
      options: [
        { id: 'opt-a', text: 'V = I * R' },
        { id: 'opt-b', text: 'V = I / R', misconception: 'inverted-ohm' },
      ],
      correctOptionID: 'opt-a',
      explanation: 'V equals I times R.',
    };

    const initial = Mastery.defaultRecord();
    const correctResult = Mastery.updateFromAnswer(initial, question, question.options[0]);
    assert.equal(correctResult.probability, 0.5);
    assert.equal(correctResult.attempts, 1);
    assert.equal(correctResult.misconceptions['inverted-ohm'], undefined);

    const wrongResult = Mastery.updateFromAnswer(initial, question, question.options[1]);
    assert.equal(wrongResult.probability, 0);
    assert.equal(wrongResult.attempts, 1);
    assert.equal(wrongResult.misconceptions['inverted-ohm'], 1);
  });

  await t.test('TC-MAST-09: immutability check on Mastery.update', () => {
    const original: MasteryRecord = { probability: 0.3, attempts: 1, misconceptions: { test: 1 } };
    const originalCopy = JSON.parse(JSON.stringify(original));
    const result = Mastery.update(original, 1.0, 1, 'test');
    assert.notEqual(result, original);
    assert.deepEqual(original, originalCopy);
  });
});
