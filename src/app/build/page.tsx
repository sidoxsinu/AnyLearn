'use client';

import { useEffect, useRef, useState } from 'react';
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
  const abortRef = useRef(false);

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const goal = sessionStorage.getItem('anylearn-goal') ?? '';
    const endArtifact = sessionStorage.getItem('anylearn-artifact') ?? 'Working prototype';
    const hours = parseInt(sessionStorage.getItem('anylearn-hours') ?? '5', 10);

    if (!goal) { router.replace('/goal'); return; }

    buildCourse(goal, endArtifact, hours);
    return () => { abortRef.current = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function buildCourse(goal: string, endArtifact: string, hours: number) {
    const apiKey = ApiKeyStore.get();
    if (!apiKey) { router.replace('/goal'); return; }

    try {
      // Step 1: Profile (fast, inline)
      setCurrentStep(0);
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
  }

  if (error) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
          <div className="text-xl" style={{ marginBottom: 8 }}>Course generation failed</div>
          <div className="text-sm text-muted" style={{ marginBottom: 24, lineHeight: 1.6 }}>{error}</div>
          <button className="btn btn-secondary" onClick={() => router.push('/goal')}>
            ← Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(249,115,22,0.06) 0%, transparent 60%)',
      }} />
      <div style={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚙</div>
          <h1 className="text-2xl" style={{ marginBottom: 8 }}>Building your course{dots}</h1>
          <p className="text-muted text-sm">
            {sessionStorage.getItem('anylearn-goal')?.slice(0, 80) ?? ''}
          </p>
        </div>

        <div className="card">
          {STEPS.map((step, i) => {
            const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'pending';
            return (
              <div key={step.id} className={`build-step ${state}`}>
                <div className="build-step-icon">
                  {state === 'done' ? '✓' : state === 'active' ? '◉' : '○'}
                </div>
                <span>{step.label}</span>
                {state === 'active' && (
                  <span className="spinner" style={{ marginLeft: 'auto', width: 14, height: 14, borderWidth: 2 }} />
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-dim" style={{ textAlign: 'center', marginTop: 20 }}>
          This usually takes 15–30 seconds. Powered by Gemini 2.0 Flash.
        </div>
      </div>
    </div>
  );
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
