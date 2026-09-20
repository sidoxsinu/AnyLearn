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
        <div className="w-full max-w-md brutal-card p-8 text-center bg-white">
          <div
            style={{
              width: 52,
              height: 52,
              backgroundColor: '#FF5A36',
              border: '2px solid #000000',
              boxShadow: '2px 2px 0px #000000',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
              margin: '0 auto 16px',
            }}
          >
            ⚠️
          </div>
          <h2 className="text-xl font-black text-black mb-2">Generation encountered an issue</h2>
          <p
            style={{
              backgroundColor: '#FEE2E2',
              border: '2px solid #000000',
              borderRadius: 4,
              padding: '12px',
              fontSize: 12,
              fontWeight: 700,
              color: '#000000',
              marginBottom: 20,
            }}
          >
            {error}
          </p>
          <button
            type="button"
            className="w-full brutal-btn brutal-btn-dark"
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
          <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#FFE600] shadow-[2px_2px_0px_#000000] text-xs font-black uppercase mb-3 rounded">
            <span>🌱</span>
            <span>Adaptive Engine</span>
          </div>
          <h1 className="text-2xl font-black text-black tracking-tight mb-2">
            Building your course{dots}
          </h1>
          {goalSummary && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-black bg-white shadow-[2px_2px_0px_#000000] rounded text-xs font-bold text-black max-w-sm mx-auto">
              <span>🎯</span>
              <span className="truncate">&ldquo;{goalSummary}&rdquo;</span>
            </div>
          )}
        </div>

        {/* Stepper Card */}
        <div className="brutal-card p-6 bg-white divide-y-2 divide-black">
          {STEPS.map((step, i) => {
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
            return (
              <div
                key={step.id}
                className={`build-step ${state} py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="build-step-icon w-8 h-8 rounded flex items-center justify-center text-xs font-black transition-all"
                    style={{
                      backgroundColor: state === 'done' ? '#00F59B' : state === 'active' ? '#FFE600' : '#FFFFFF',
                      color: '#000000',
                      border: '2px solid #000000',
                      boxShadow: '2px 2px 0px #000000',
                    }}
                  >
                    {state === 'done' ? '✓' : state === 'active' ? '◉' : i + 1}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color: state === 'pending' ? '#6B7280' : '#000000',
                      fontWeight: state === 'active' ? 900 : state === 'done' ? 800 : 600,
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                {state === 'active' && (
                  <span
                    className="w-4 h-4 rounded-full animate-spin"
                    style={{
                      border: '3px solid #000000',
                      borderTopColor: '#FFE600',
                    }}
                  />
                )}
                {state === 'done' && (
                  <span
                    className="text-xs font-black px-2.5 py-0.5 border-2 border-black rounded"
                    style={{
                      backgroundColor: '#00F59B',
                      color: '#000000',
                      boxShadow: '1px 1px 0px #000000',
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
        <div className="text-xs font-bold text-neutral-600 text-center mt-5 flex items-center justify-center gap-1.5">
          <span>⚡</span>
          <span>Generating concepts, curriculum hierarchy & resources in real-time</span>
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
