'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generate, ApiKeyStore } from '@/lib/llmClient';
import { Prompts } from '@/lib/prompts';
import { BlockRenderer } from '@/components/BlockRenderer';
import type { Lesson, Block } from '@/lib/models';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonID = params.id as string;

  const course = useStore(s => s.course);
  const learner = useStore(s => s.learner);
  const setCourse = useStore(s => s.setCourse);
  const completeLesson = useStore(s => s.completeLesson);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const lesson = course?.lessons[lessonID];

  useEffect(() => {
    if (!course || !lesson) return;
    if (lesson.status === 'stub') {
      const timer = setTimeout(() => {
        void generateLesson();
      }, 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonID, course?.id]);

  async function generateLesson() {
    if (!course || !lesson) return;
    const apiKey = ApiKeyStore.get();
    const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('anylearn-demo-mode') === 'true';

    if (!apiKey) {
      if (isDemoMode) {
        setNotice('Stub lesson generation requires a live Gemini API key');
        return;
      }
      router.push('/goal');
      return;
    }

    setGenerating(true);
    setError('');
    setNotice('');
    try {
      const mod = course.modules.find(m => m.id === lesson.moduleID);
      const concepts = (lesson.conceptIDs || []).map(id => course.concepts.find(c => c.id === id)).filter(Boolean);
      const priorLessons = (mod?.lessonIDs ?? [])
        .filter(id => id !== lessonID)
        .map(id => course.lessons[id])
        .filter(Boolean)
        .map(l => ({ title: l!.title, conceptIDs: l!.conceptIDs || [] }));
      const mastery = Object.fromEntries(
        (lesson.conceptIDs || []).map(cid => [cid, learner.mastery[cid]?.probability ?? 0])
      );

      const { system, user } = Prompts.lesson(
        course.goal, course.profile, mod ?? {}, lesson, concepts, priorLessons, mastery
      );
      const result = await generate<{ blocks: Block[]; task?: Lesson['task']; confidence: Lesson['confidence']; sources?: Lesson['sources']; unsourced?: boolean }>(
        system, user, apiKey, { temperature: 0.4 }
      );

      // Also generate quiz
      const quizPrompt = Prompts.quiz(result.blocks, lesson.conceptIDs);
      const quizResult = await generate<{ questions: NonNullable<typeof course.quizzes[string]> }>(
        quizPrompt.system, quizPrompt.user, apiKey, { temperature: 0.6 }
      );

      const updatedLesson: Lesson = {
        ...lesson,
        blocks: result.blocks ?? [],
        task: result.task ?? lesson.task,
        confidence: result.confidence ?? 'medium',
        sources: result.sources ?? [],
        unsourced: result.unsourced ?? true,
        status: 'ready',
        version: lesson.version + 1,
      };

      const updatedCourse = {
        ...course,
        lessons: { ...course.lessons, [lessonID]: updatedLesson },
        quizzes: { ...course.quizzes, [lessonID]: quizResult.questions ?? [] },
      };
      setCourse(updatedCourse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
    setGenerating(false);
  }

  if (course && !lesson) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
        <div className="card" style={{ maxWidth: 480, textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <h2 className="text-xl" style={{ marginBottom: 8, fontWeight: 700 }}>Lesson not found</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 24, lineHeight: 1.6 }}>
            The requested lesson could not be found in this course.
          </p>
          <button className="btn btn-primary" onClick={() => router.push('/roadmap')}>
            Return to Roadmap
          </button>
        </div>
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const mod = course.modules.find(m => m.id === lesson.moduleID);
  const isCompleted = learner.completedLessonIDs.includes(lessonID);
  const hasQuiz = (course.quizzes[lessonID]?.length ?? 0) > 0;

  return (
    <div className="w-full h-full flex flex-col relative select-none">
      {/* Top Header inside panel */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/5 shrink-0">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => router.push('/roadmap')}
        >
          ← Roadmap
        </button>

        <div className="flex-1 text-center truncate px-2">
          <div className="text-[11px] font-bold text-black/50 uppercase tracking-wider">{mod?.title}</div>
          <div className="text-base md:text-lg font-extrabold text-[#0F1117] truncate">{lesson.title}</div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`badge ${lesson.confidence === 'high' ? 'badge-green' : lesson.confidence === 'medium' ? 'badge-blue' : 'badge-amber'}`}>
            {lesson.confidence}
          </span>
          {isCompleted && <span className="badge badge-green">✓ Completed</span>}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto py-6 pb-24">
        <div className="container container-sm">
          {/* Objectives Card in Brutalist Sky Blue */}
          <div className="brutal-card p-5 sm:p-6 mb-6 bg-[#E0F2FE]">
            <div className="text-xs font-black uppercase tracking-wider mb-2.5 flex items-center gap-1.5 text-black">
              <span>🎯</span>
              <span>Learning Objectives</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs md:text-sm font-bold text-black">
              {(lesson.objectives || []).map((obj, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="font-black text-black">{i + 1}.</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Demo Notice */}
          {notice && (
            <div className="brutal-card p-4 mb-6 bg-[#FEF3C7] flex items-center gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-xs md:text-sm font-black text-black">
                {notice}
              </div>
            </div>
          )}

          {/* Lesson Content Blocks */}
          {generating ? (
            <div className="flex flex-col gap-4 py-8">
              {[180, 70, 110].map((h, i) => (
                <div key={i} className="bg-black/5 animate-pulse rounded-2xl" style={{ height: h }} />
              ))}
              <div className="text-sm font-bold text-center flex items-center justify-center gap-2 mt-4" style={{ color: '#4B5563' }}>
                <span>Generating lesson content…</span>
                <span className="spinner" />
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-200 text-center">
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-sm text-red-700 font-medium mb-4">{error}</div>
              <button className="btn btn-secondary btn-sm" onClick={generateLesson}>Retry</button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {(lesson.blocks || []).map((block, idx) => (
                <BlockRenderer
                  key={block?.id || `block-${idx}`}
                  block={block}
                  onFlag={id => router.push(`/report/${lessonID}?blockId=${id}`)}
                />
              ))}

              {/* Hands-On Task Card in Brutalist Yellow */}
              {lesson.task && (
                <div className="brutal-card p-5 md:p-6 mt-4 bg-[#FFE600]">
                  <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 text-black">
                    <span>⭐</span>
                    <span>Hands-On Task</span>
                  </div>
                  <h3 className="text-base md:text-lg font-black mb-3 text-black">{lesson.task.title}</h3>
                  <div className="flex flex-col gap-2 text-xs md:text-sm mb-4 font-bold text-black">
                    {(lesson.task.instructions || []).map((ins, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="font-black">{i + 1}.</span>
                        <span>{ins}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-2 border-black rounded bg-white">
                    <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1 text-black">
                      <span>✓</span>
                      <span>Success Criteria</span>
                    </div>
                    {(lesson.task.successCriteria || []).map((sc, i) => (
                      <div key={i} className="text-xs font-bold mb-1 flex items-center gap-1.5 text-black">
                        <span>✓</span>
                        <span>{sc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {(lesson.sources || []).length > 0 && (
                <div className="mt-4 pt-4 border-t-2 border-black">
                  <div className="text-xs font-black uppercase tracking-wider mb-2 text-neutral-600">Sources</div>
                  {(lesson.sources || []).map((src, i) => (
                    <div key={src.id || src.url || i} className="text-xs">
                      <a href={src.url} target="_blank" rel="noreferrer" className="font-bold underline text-black hover:text-[#8B5CF6]">
                        🔗 {src.title}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions inside main view */}
      <div className="sticky bottom-4 mt-6 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] rounded-lg flex items-center justify-between gap-3 z-30">
        <div>
          {!isCompleted && lesson.status === 'ready' && (
            <button
              className="brutal-btn brutal-btn-sm brutal-btn-accent"
              onClick={() => completeLesson(lessonID)}
            >
              ✓ Mark Complete
            </button>
          )}
          {isCompleted && <span className="brutal-badge bg-[#00F59B]">✓ Mastered</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            id="report-fix-btn"
            className="brutal-btn brutal-btn-sm bg-white"
            onClick={() => router.push(`/report/${lessonID}`)}
          >
            ⚑ Report
          </button>
          <button
            id="take-quiz-btn"
            className="brutal-btn brutal-btn-sm brutal-btn-primary"
            onClick={() => router.push(`/quiz/${lessonID}`)}
            disabled={!hasQuiz && lesson.status !== 'ready'}
          >
            Take Quiz ⏱️
          </button>
        </div>
      </div>
    </div>
  );
}

