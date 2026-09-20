// AnyLearn — Patch Engine (ported from PatchEngine.swift)
import type { Course, LearnerState, PatchOp, RoadmapPatch } from './models';
import { validateDAG } from './dagValidator';

export class PatchEngineError extends Error {
  public code: PatchErrorCode;
  constructor(code: PatchErrorCode, detail?: string) {
    super(`Patch rejected: ${code}${detail ? ` — ${detail}` : ''}`);
    this.name = 'PatchEngineError';
    this.code = code;
  }
}

export type PatchErrorCode =
  | 'tooManyOperations'
  | 'unknownID'
  | 'completedLesson'
  | 'invalidReorder'
  | 'cyclicGraph'
  | 'duplicateID';

export interface PatchResult {
  course: Course;
  inverse: PatchOp[];
}

export function applyPatch(
  patch: RoadmapPatch,
  course: Course,
  learner: LearnerState
): PatchResult {
  if (patch.ops.length > 3) throw new PatchEngineError('tooManyOperations');

  let draft: Course = deepClone(course);
  const inverses: PatchOp[] = [];

  for (const op of patch.ops) {
    switch (op.type) {
      case 'addConcept': {
        if (draft.concepts.some(c => c.id === op.concept.id)) {
          throw new PatchEngineError('duplicateID', op.concept.id);
        }
        draft.concepts.push(op.concept);
        inverses.unshift({ type: 'deleteLesson', lessonID: `concept:${op.concept.id}`, reason: op.reason });
        break;
      }

      case 'insertLesson': {
        let moduleIndex = draft.modules.findIndex(m => m.lessonIDs.includes(op.afterLessonID));
        let insertIndex = -1;
        if (moduleIndex !== -1) {
          insertIndex = draft.modules[moduleIndex].lessonIDs.indexOf(op.afterLessonID) + 1;
        } else {
          moduleIndex = draft.modules.findIndex(m => m.id === op.afterLessonID);
          if (moduleIndex !== -1) insertIndex = 0;
        }
        if (moduleIndex === -1) throw new PatchEngineError('unknownID', op.afterLessonID);
        if (draft.lessons[op.lesson.id]) throw new PatchEngineError('duplicateID', op.lesson.id);
        const knownConceptIDs = new Set(draft.concepts.map(c => c.id));
        if (!op.lesson.conceptIDs.every(id => knownConceptIDs.has(id))) {
          throw new PatchEngineError('unknownID', 'lesson concept');
        }
        draft.modules[moduleIndex].lessonIDs.splice(insertIndex, 0, op.lesson.id);
        draft.lessons[op.lesson.id] = op.lesson;
        inverses.unshift({ type: 'deleteLesson', lessonID: op.lesson.id, reason: op.reason });
        break;
      }

      case 'replaceBlock': {
        const lesson = draft.lessons[op.lessonID];
        if (!lesson) throw new PatchEngineError('unknownID', op.lessonID);
        const blockIndex = lesson.blocks.findIndex(b => b.id === op.blockID);
        if (blockIndex === -1) throw new PatchEngineError('unknownID', op.blockID);
        const oldBlock = lesson.blocks[blockIndex];
        draft.lessons[op.lessonID] = {
          ...lesson,
          blocks: lesson.blocks.map((b, i) => (i === blockIndex ? op.block : b)),
        };
        inverses.unshift({
          type: 'replaceBlock',
          lessonID: op.lessonID,
          blockID: op.block.id,
          block: oldBlock,
          reason: op.reason,
        });
        break;
      }

      case 'insertBlock': {
        const lesson = draft.lessons[op.lessonID];
        if (!lesson) throw new PatchEngineError('unknownID', op.lessonID);
        const blocks = [...lesson.blocks];
        if (op.afterBlockID) {
          const idx = blocks.findIndex(b => b.id === op.afterBlockID);
          if (idx === -1) throw new PatchEngineError('unknownID', op.afterBlockID);
          blocks.splice(idx + 1, 0, op.block);
        } else {
          blocks.unshift(op.block);
        }
        draft.lessons[op.lessonID] = { ...lesson, blocks };
        inverses.unshift({
          type: 'deleteLesson',
          lessonID: `block:${op.lessonID}:${op.block.id}`,
          reason: op.reason,
        });
        break;
      }

      case 'addPractice': {
        const lesson = draft.lessons[op.lessonID];
        if (!lesson) throw new PatchEngineError('unknownID', op.lessonID);
        const oldTask = lesson.task;
        draft.lessons[op.lessonID] = { ...lesson, task: op.task };
        if (oldTask) {
          inverses.unshift({
            type: 'addPractice',
            lessonID: op.lessonID,
            task: oldTask,
            reason: op.reason,
          });
        } else {
          inverses.unshift({
            type: 'deleteLesson',
            lessonID: `practice:${op.lessonID}`,
            reason: op.reason,
          });
        }
        break;
      }

      case 'markSkippable': {
        const lesson = draft.lessons[op.lessonID];
        if (!lesson) throw new PatchEngineError('unknownID', op.lessonID);
        const old = lesson.skippable;
        draft.lessons[op.lessonID] = { ...lesson, skippable: { reason: op.reason } };
        if (old) {
          inverses.unshift({ type: 'markSkippable', lessonID: op.lessonID, reason: old.reason });
        } else {
          inverses.unshift({ type: 'deleteLesson', lessonID: `skippable:${op.lessonID}`, reason: op.reason });
        }
        break;
      }

      case 'reorder': {
        const mIdx = draft.modules.findIndex(m => m.id === op.moduleID);
        if (mIdx === -1) throw new PatchEngineError('unknownID', op.moduleID);
        const old = draft.modules[mIdx].lessonIDs;
        if (!setsEqual(new Set(old), new Set(op.lessonIDs))) throw new PatchEngineError('invalidReorder');
        const updatedModules = draft.modules.map((m, i) =>
          i === mIdx ? { ...m, lessonIDs: op.lessonIDs } : m
        );
        draft = { ...draft, modules: updatedModules };
        inverses.unshift({ type: 'reorder', moduleID: op.moduleID, lessonIDs: old, reason: op.reason });
        break;
      }

      case 'replaceQuestion': {
        const questions = draft.quizzes[op.lessonID];
        if (!questions) throw new PatchEngineError('unknownID', op.lessonID);
        const qIdx = questions.findIndex(q => q.id === op.questionID);
        if (qIdx === -1) throw new PatchEngineError('unknownID', op.questionID);
        const old = questions[qIdx];
        draft.quizzes[op.lessonID] = questions.map((q, i) => (i === qIdx ? op.question : q));
        inverses.unshift({
          type: 'replaceQuestion',
          lessonID: op.lessonID,
          questionID: op.question.id,
          question: old,
          reason: op.reason,
        });
        break;
      }

      case 'refreshResources': {
        const lesson = draft.lessons[op.lessonID];
        if (!lesson) throw new PatchEngineError('unknownID', op.lessonID);
        const old = lesson.resourceQueries;
        draft.lessons[op.lessonID] = { ...lesson, resourceQueries: op.queries };
        inverses.unshift({ type: 'refreshResources', lessonID: op.lessonID, queries: old, reason: op.reason });
        break;
      }

      case 'deleteLesson': {
        const id = op.lessonID;
        // Virtual delete for concepts
        if (id.startsWith('concept:')) {
          const cid = id.slice(8);
          const concept = draft.concepts.find(c => c.id === cid);
          if (concept) inverses.unshift({ type: 'addConcept', concept, reason: op.reason });
          draft.concepts = draft.concepts.map(c => ({
            ...c,
            prereqIDs: c.prereqIDs.filter(p => p !== cid)
          })).filter(c => c.id !== cid);
          for (const lesson of Object.values(draft.lessons)) {
            lesson.conceptIDs = lesson.conceptIDs.filter(c => c !== cid);
          }
          break;
        }
        // Virtual delete for blocks
        if (id.startsWith('block:')) {
          const parts = id.split(':');
          if (parts.length !== 3) throw new PatchEngineError('unknownID', id);
          const lesson = draft.lessons[parts[1]];
          if (!lesson) throw new PatchEngineError('unknownID', parts[1]);
          const block = lesson.blocks.find(b => b.id === parts[2]);
          if (block) {
            const idx = lesson.blocks.indexOf(block);
            const afterBlockID = idx > 0 ? lesson.blocks[idx - 1].id : null;
            inverses.unshift({ type: 'insertBlock', lessonID: parts[1], afterBlockID, block, reason: op.reason });
          }
          draft.lessons[parts[1]] = { ...lesson, blocks: lesson.blocks.filter(b => b.id !== parts[2]) };
          break;
        }
        // Virtual delete for skippable
        if (id.startsWith('skippable:')) {
          const targetLessonID = id.slice(10);
          const lesson = draft.lessons[targetLessonID];
          if (!lesson) throw new PatchEngineError('unknownID', targetLessonID);
          if (lesson.skippable) inverses.unshift({ type: 'markSkippable', lessonID: targetLessonID, reason: lesson.skippable.reason });
          const updated = { ...lesson };
          delete updated.skippable;
          draft.lessons[targetLessonID] = updated;
          break;
        }
        // Virtual delete for practice task
        if (id.startsWith('practice:') || id.startsWith('task:')) {
          const targetLessonID = id.startsWith('practice:') ? id.slice(9) : id.slice(5);
          const lesson = draft.lessons[targetLessonID];
          if (!lesson) throw new PatchEngineError('unknownID', targetLessonID);
          if (lesson.task) inverses.unshift({ type: 'addPractice', lessonID: targetLessonID, task: lesson.task, reason: op.reason });
          const updated = { ...lesson };
          delete updated.task;
          draft.lessons[targetLessonID] = updated;
          break;
        }
        // Real lesson delete
        if (learner.completedLessonIDs.includes(id)) throw new PatchEngineError('completedLesson', id);
        if (!draft.lessons[id]) throw new PatchEngineError('unknownID', id);
        
        const deletedLesson = draft.lessons[id];
        const mIdx = draft.modules.findIndex(m => m.lessonIDs.includes(id));
        if (mIdx !== -1) {
          const lIdx = draft.modules[mIdx].lessonIDs.indexOf(id);
          const afterLessonID = lIdx > 0 ? draft.modules[mIdx].lessonIDs[lIdx - 1] : draft.modules[mIdx].id;
          inverses.unshift({ type: 'insertLesson', afterLessonID, lesson: deletedLesson, reason: op.reason });
        }

        const updatedLessons = { ...draft.lessons };
        delete updatedLessons[id];
        const updatedQuizzes = { ...draft.quizzes };
        delete updatedQuizzes[id];
        const updatedModules = draft.modules.map(m => ({
          ...m,
          lessonIDs: m.lessonIDs.filter(lid => lid !== id),
        }));
        draft = { ...draft, lessons: updatedLessons, modules: updatedModules, quizzes: updatedQuizzes };
        break;
      }
    }

    if (!validateDAG(draft.concepts)) throw new PatchEngineError('cyclicGraph');
  }

  draft.version += 1;
  return { course: draft, inverse: inverses };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) if (!b.has(item)) return false;
  return true;
}
