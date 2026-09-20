'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generate, ApiKeyStore } from '@/lib/llmClient';
import { Prompts } from '@/lib/prompts';
import { useStore } from '@/lib/store';
import type { Course, Concept, Module, Lesson } from '@/lib/models';

const STEPS = [
  { id: 'goal', label: 'Understanding your goal' },
  { id: 'concepts', label: 'Mapping concepts & prerequisites' },
  { id: 'curriculum', label: 'Drafting modules & lessons' },
  { id: 'sources', label: 'Sourcing resources' },
  { id: 'done', label: 'Learning path ready!' },
];

export default function BuildPage() {
  const router = useRouter();
  const setCourse = useStore(s => s.setCourse);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState('');
  const [dots, setDots] = useState('');
  const [goalSummary, setGoalSummary] = useState('');
  const abortRef = useRef(false);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  const buildCourse = useCallback(async (goal: string, endArtifact: string, hours: number) => {
    const apiKey = ApiKeyStore.get();
    if (!apiKey) { router.replace('/goal'); return; }

    try {
      // Step 1: Profile (fast, inline)
      const profile = {
        topic: goal.split(' ').slice(0, 4).join(' '),
        endArtifact,
        level: 'beginner',
        hoursPerWeek: hours,
      };
      await delay(400);

      // Step 2: Concept graph
      if (abortRef.current) return;
      setCurrentStep(1);
      const { system: cgSys, user: cgUser } = Prompts.conceptGraph(goal, profile, {});
      const cgResult = await generate<{ concepts: Concept[] }>(cgSys, cgUser, apiKey, { temperature: 0.4 });
      const concepts = cgResult.concepts ?? [];

      // Step 3: Curriculum
      if (abortRef.current) return;
      setCurrentStep(2);
      const { system: curSys, user: curUser } = Prompts.curriculum(goal, profile, concepts, {});
      const curResult = await generate<{
        modules: Array<{ id: string; title: string; outcome: string; lessonIDs?: string[] }>;
        lessons: Record<string, Lesson & { moduleID?: string }>;
        capstone: Course['capstone'];
      }>(curSys, curUser, apiKey, { temperature: 0.5 });

      // Normalize: ensure modules have lessonIDs and lessons have moduleID
      const lessons: Record<string, Lesson> = {};
      const modules: Module[] = (curResult.modules ?? []).map((m) => {
        const lessonIDs: string[] = m.lessonIDs ?? [];
        // Back-fill lessonIDs from lessons if needed
        Object.entries(curResult.lessons ?? {}).forEach(([lid, l]) => {
          const lessonModID = (l as Lesson & { moduleID?: string }).moduleID;
          if (lessonModID === m.id && !lessonIDs.includes(lid)) lessonIDs.push(lid);
        });
        return { id: m.id, title: m.title, outcome: m.outcome, lessonIDs };
      });

      Object.entries(curResult.lessons ?? {}).forEach(([id, l]) => {
        const lesson = l as Lesson & { moduleID?: string };
        lessons[id] = {
          id,
          moduleID: lesson.moduleID ?? modules[0]?.id ?? 'm-1',
          title: lesson.title ?? 'Lesson',
          conceptIDs: lesson.conceptIDs ?? [],
          objectives: lesson.objectives ?? [],
          status: 'stub',
          skippable: lesson.skippable,
          blocks: [],
          task: lesson.task,
          resourceQueries: lesson.resourceQueries ?? [],
          resources: [],
          sources: [],
          unsourced: true,
          confidence: lesson.confidence ?? 'medium',
          version: 1,
        };
      });

      // Step 4: sources stub
      if (abortRef.current) return;
      setCurrentStep(3);
      await delay(600);

      // Step 5: Build course object
      if (abortRef.current) return;
      setCurrentStep(4);

      const course: Course = {
        id: `course-${Date.now()}`,
        goal,
        profile: {
          topic: profile.topic,
          endArtifact: profile.endArtifact,
          level: profile.level,
          hoursPerWeek: profile.hoursPerWeek,
        },
        version: 1,
        concepts,
        modules,
        lessons,
        quizzes: {},
        capstone: curResult.capstone ?? { title: 'Capstone', description: goal, successCriteria: [] },
        changelog: [],
      };

      setCourse(course);
      await delay(600);
      router.push('/roadmap');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }, [router, setCourse]);

  useEffect(() => {
    const goal = sessionStorage.getItem('anylearn-goal') ?? '';
    const endArtifact = sessionStorage.getItem('anylearn-artifact') ?? 'Working prototype';
    const hours = parseInt(sessionStorage.getItem('anylearn-hours') ?? '5', 10);

    queueMicrotask(() => {
      setGoalSummary(goal.slice(0, 80));
    });

    if (!goal) { router.replace('/goal'); return; }

    abortRef.current = false;
    const timer = setTimeout(() => {
      void buildCourse(goal, endArtifact, hours);
    }, 0);
    return () => {
      clearTimeout(timer);
      abortRef.current = true;
    };
  }, [buildCourse, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-sm border border-[#FEE2E2]">
          <div className="w-14 h-14 rounded-2xl bg-[#FEE2E2] text-2xl flex items-center justify-center mx-auto mb-4">
            ⚠️
          </div>
          <h2 className="text-xl font-bold text-[#0F1117] mb-2">Generation encountered an issue</h2>
          <p className="text-xs text-[#6B7280] mb-6 leading-relaxed bg-[#FFF5F5] p-3 rounded-xl border border-[#FCDEDE]">
            {error}
          </p>
          <button
            type="button"
            className="w-full py-3 rounded-xl bg-[#0F1117] text-white text-sm font-semibold hover:bg-[#232733] transition-all cursor-pointer shadow-xs"
            onClick={() => router.push('/goal')}
          >
            ← Return to Goal Planner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F5F8] text-[#0A5265] text-xs font-semibold mb-3 border border-[#C5EBF1]">
            <span>🌱</span>
            <span>Adaptive Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F1117] tracking-tight mb-2">
            Building your plan{dots}
          </h1>
          {goalSummary && (
            <p className="text-xs text-[#6B7280] max-w-sm mx-auto line-clamp-2 bg-white/70 px-3 py-1.5 rounded-full border border-[#E5E7EB]">
              🎯 &ldquo;{goalSummary}&rdquo;
            </p>
          )}
        </div>

        {/* Stepper Card */}
        <div
          className="p-6 shadow-sm divide-y divide-[#F3F4F6]"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 28,
            border: '1px solid #EBECEF',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          }}
        >
          {STEPS.map((step, i) => {
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
            return (
              <div
                key={step.id}
                className={`build-step ${state} py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="build-step-icon w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      backgroundColor: state === 'done' ? '#D4F6ED' : state === 'active' ? '#F2E7FE' : '#F4F5F7',
                      color: state === 'done' ? '#064E3B' : state === 'active' ? '#581C87' : '#9CA3AF',
                      border: state === 'done' ? '1px solid #A7F3D0' : state === 'active' ? '1px solid #D8B4FE' : '1px solid #E5E7EB',
                    }}
                  >
                    {state === 'done' ? '✓' : state === 'active' ? '◉' : i + 1}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: state === 'pending' ? '#9CA3AF' : '#0F1117',
                      fontWeight: state === 'active' ? 800 : state === 'done' ? 700 : 500,
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {state === 'active' && (
                  <span
                    className="w-4 h-4 rounded-full animate-spin"
                    style={{
                      border: '2.5px solid #D8B4FE',
                      borderTopColor: '#581C87',
                    }}
                  />
                )}
                {state === 'done' && (
                  <span
                    className="text-xs font-bold px-2.5 py-0.5"
                    style={{
                      backgroundColor: '#D4F6ED',
                      color: '#064E3B',
                      borderRadius: 9999,
                    }}
                  >
                    Done
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-[#9CA3AF] text-center mt-5 flex items-center justify-center gap-1.5">
          <span>⚡</span>
          <span>Generating concepts, curriculum hierarchy & resources in real-time</span>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
