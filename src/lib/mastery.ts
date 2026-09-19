// AnyLearn — Mastery Engine (ported from Mastery.swift)
import type { MasteryRecord, Question, QuestionOption } from './models';

export const Mastery = {
  defaultRecord(): MasteryRecord {
    return { probability: 0, attempts: 0, misconceptions: {} };
  },

  update(
    record: MasteryRecord,
    score: number,
    difficulty: number,
    misconception?: string
  ): MasteryRecord {
    const result = { ...record, misconceptions: { ...record.misconceptions } };
    const boundedScore = Math.min(1, Math.max(0, score));
    // Hard questions penalise more on wrong answer
    const adjustedScore = boundedScore === 0 && difficulty >= 3 ? 0 : boundedScore;
    const alpha = result.attempts < 2 ? 0.5 : 0.3;
    result.probability = Math.min(1, Math.max(0, result.probability + alpha * (adjustedScore - result.probability)));
    result.attempts += 1;
    if (misconception && boundedScore < 1) {
      result.misconceptions[misconception] = (result.misconceptions[misconception] ?? 0) + 1;
    }
    return result;
  },

  isWeak(record: MasteryRecord): boolean {
    return record.probability < 0.5;
  },

  isSolid(record: MasteryRecord): boolean {
    return record.probability >= 0.8;
  },

  shouldAdapt(record: MasteryRecord): boolean {
    const hasRepeatedMisconception = Object.values(record.misconceptions).some(c => c >= 2);
    return (this.isWeak(record) && record.attempts >= 2) || hasRepeatedMisconception;
  },

  colorClass(record: MasteryRecord | undefined): 'untouched' | 'weak' | 'ok' | 'solid' {
    if (!record || record.attempts === 0) return 'untouched';
    if (record.probability < 0.5) return 'weak';
    if (record.probability < 0.8) return 'ok';
    return 'solid';
  },

  updateFromAnswer(
    record: MasteryRecord,
    question: Question,
    option: QuestionOption
  ): MasteryRecord {
    const score = option.id === question.correctOptionID ? 1.0 : 0.0;
    return this.update(record, score, question.difficulty, option.misconception);
  },
};
