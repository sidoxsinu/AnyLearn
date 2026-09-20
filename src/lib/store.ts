// AnyLearn — Zustand Store (ported from AppStore.swift)
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { Course, LearnerState, Question, QuestionOption, RoadmapPatch, ChangeSource, VerifyResult, ID } from './models';
import { defaultLearnerState } from './models';
import { applyPatch } from './patchEngine';
import { Mastery } from './mastery';

interface AppState {
  course: Course | null;
  learner: LearnerState;
  latestError: string | null;
  isBuilding: boolean;
  buildStep: string;

  // Actions
  setCourse: (course: Course | null) => void;
  setLearner: (learner: LearnerState) => void;
  setError: (err: string | null) => void;
  setBuilding: (building: boolean, step?: string) => void;

  updateMastery: (question: Question, option: QuestionOption) => void;
  completeLesson: (lessonID: ID) => void;

  applyPatch: (
    patch: RoadmapPatch,
    source: ChangeSource,
    reason: string,
    verify?: VerifyResult
  ) => { success: boolean; error?: string };

  undo: (entryID: ID) => { success: boolean; error?: string };

  reset: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      course: null,
      learner: defaultLearnerState(),
      latestError: null,
      isBuilding: false,
      buildStep: '',

      setCourse: (course) => set({ course }),
      setLearner: (learner) => set({ learner }),
      setError: (err) => set({ latestError: err }),
      setBuilding: (building, step = '') => set({ isBuilding: building, buildStep: step }),

      updateMastery: (question, option) => {
        const { learner } = get();
        const record = learner.mastery[question.conceptID] ?? Mastery.defaultRecord();
        const updated = Mastery.updateFromAnswer(record, question, option);
        const score = option.id === question.correctOptionID ? 1.0 : 0.0;
        set({
          learner: {
            ...learner,
            mastery: { ...learner.mastery, [question.conceptID]: updated },
            attempts: [
              ...learner.attempts,
              {
                id: `a-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                questionID: question.id,
                conceptID: question.conceptID,
                selectedOptionID: option.id,
                score,
                occurredAt: new Date().toISOString(),
              },
            ],
          },
        });
      },

      completeLesson: (lessonID) => {
        const { learner } = get();
        if (learner.completedLessonIDs.includes(lessonID)) return;
        set({ learner: { ...learner, completedLessonIDs: [...learner.completedLessonIDs, lessonID] } });
      },

      applyPatch: (patch, source, reason, verify) => {
        const { course, learner } = get();
        if (!course) return { success: false, error: 'No course loaded.' };
        try {
          const result = applyPatch(patch, course, learner);
          const entry = {
            id: `ch-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            timestamp: new Date().toISOString(),
            source,
            summary: patch.summary,
            reason,
            ops: patch.ops,
            inverseOps: result.inverse,
            verify,
            undone: false,
          };
          const updatedCourse = {
            ...result.course,
            changelog: [...result.course.changelog, entry],
          };
          set({ course: updatedCourse, latestError: null });
          return { success: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          set({ latestError: msg });
          return { success: false, error: msg };
        }
      },

      undo: (entryID) => {
        const { course, learner } = get();
        if (!course) return { success: false, error: 'No course loaded.' };
        const idx = course.changelog.findIndex(e => e.id === entryID && !e.undone);
        if (idx === -1) return { success: false, error: 'Entry not found or already undone.' };
        try {
          const inversePatch = { summary: 'Undo', ops: course.changelog[idx].inverseOps };
          const result = applyPatch(inversePatch, course, learner);
          const updatedChangelog = result.course.changelog.map((e, i) =>
            i === idx ? { ...e, undone: true } : e
          );
          set({ course: { ...result.course, changelog: updatedChangelog } });
          return { success: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: msg };
        }
      },

      reset: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('anylearn-demo-mode');
        }
        set({ course: null, learner: defaultLearnerState(), latestError: null });
      },
    }),
    {
      name: 'anylearn-state',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return window.localStorage;
        const fallback: StateStorage = {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
        return fallback;
      }),
      partialize: (state) => ({ course: state.course, learner: state.learner }),
    }
  )
);
