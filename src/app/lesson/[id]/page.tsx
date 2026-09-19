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
  const [flaggedBlock, setFlaggedBlock] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const lesson = course?.lessons[lessonID];

  useEffect(() => {
    if (!course || !lesson) return;
    if (lesson.status === 'stub') {
      generateLesson();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonID, course?.id]);

  async function generateLesson() {
    if (!course || !lesson) return;
    const apiKey = ApiKeyStore.get();
    if (!apiKey) { router.push('/goal'); return; }

    setGenerating(true);
    setError('');
    try {
      const mod = course.modules.find(m => m.id === lesson.moduleID);
      const concepts = lesson.conceptIDs.map(id => course.concepts.find(c => c.id === id)).filter(Boolean);
      const priorLessons = (mod?.lessonIDs ?? [])
        .filter(id => id !== lessonID)
        .map(id => course.lessons[id])
        .filter(Boolean)
        .map(l => ({ title: l!.title, conceptIDs: l!.conceptIDs }));
      const mastery = Object.fromEntries(
        lesson.conceptIDs.map(cid => [cid, learner.mastery[cid]?.probability ?? 0])
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
    <div className="page">
      {/* Navbar */}
      <nav className="navbar">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/roadmap')}>
          ← Roadmap
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="text-xs text-muted">{mod?.title}</div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{lesson.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge badge-${lesson.confidence === 'high' ? 'green' : lesson.confidence === 'medium' ? 'blue' : 'amber'}`}>
            {lesson.confidence}
          </span>
          {lesson.unsourced && <span className="badge badge-amber">unsourced</span>}
        </div>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0 120px' }}>
        <div className="container container-sm">
          {/* Objectives */}
          <div className="card-sm" style={{ marginBottom: 32 }}>
            <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 8 }}>LEARNING OBJECTIVES</div>
            {lesson.objectives.map((obj, i) => (
              <div key={i} className="text-sm" style={{ marginBottom: 4, color: 'var(--text-2)' }}>
                {i + 1}. {obj}
              </div>
            ))}
          </div>

          {/* Blocks */}
          {generating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[200, 80, 120, 80].map((h, i) => (
                <div key={i} className="skeleton" style={{ height: h, borderRadius: 12 }} />
              ))}
              <div className="text-sm text-muted" style={{ textAlign: 'center', marginTop: 8 }}>
                Generating lesson content… <span className="spinner" style={{ verticalAlign: 'middle', width: 14, height: 14, borderWidth: 2 }} />
              </div>
            </div>
          ) : error ? (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
              <div className="text-muted text-sm" style={{ marginBottom: 16 }}>{error}</div>
              <button className="btn btn-secondary" onClick={generateLesson}>Retry</button>
            </div>
          ) : (
            <>
              {lesson.blocks.map(block => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  onFlag={id => { setFlaggedBlock(id); setShowReport(true); }}
                />
              ))}

              {/* Task card */}
              {lesson.task && (
                <div className="card" style={{ marginTop: 24, borderColor: 'var(--border-accent)' }}>
                  <div className="text-xs text-accent" style={{ fontWeight: 700, marginBottom: 10, letterSpacing: '0.06em' }}>HANDS-ON TASK</div>
                  <h3 className="text-lg" style={{ fontWeight: 700, marginBottom: 12 }}>{lesson.task.title}</h3>
                  {lesson.task.instructions.map((ins, i) => (
                    <div key={i} className="text-sm" style={{ marginBottom: 8 }}>
                      <span className="text-accent" style={{ fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>
                      {ins}
                    </div>
                  ))}
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(34,197,94,0.06)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.15)' }}>
                    <div className="text-xs" style={{ color: 'var(--mastery-solid)', fontWeight: 700, marginBottom: 6 }}>SUCCESS CRITERIA</div>
                    {lesson.task.successCriteria.map((sc, i) => (
                      <div key={i} className="text-sm text-muted" style={{ marginBottom: 4 }}>✓ {sc}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sources */}
              {lesson.sources.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <div className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 600 }}>SOURCES</div>
                  {lesson.sources.map(src => (
                    <div key={src.id} className="text-sm" style={{ marginBottom: 4 }}>
                      <a href={src.url} target="_blank" rel="noreferrer" className="text-accent">{src.title}</a>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 20px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        zIndex: 50,
      }}>
        {!isCompleted && lesson.status === 'ready' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => completeLesson(lessonID)}
          >
            ✓ Mark complete
          </button>
        )}
        {isCompleted && <span className="badge badge-green">✓ Completed</span>}

        <div style={{ flex: 1 }} />

        <button
          id="report-fix-btn"
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'var(--border-accent)', color: 'var(--accent)' }}
          onClick={() => router.push(`/report/${lessonID}`)}
        >
          ⚑ Report / Fix
        </button>
        <button
          id="take-quiz-btn"
          className="btn btn-primary"
          onClick={() => router.push(`/quiz/${lessonID}`)}
          disabled={!hasQuiz && lesson.status !== 'ready'}
        >
          Take Quiz →
        </button>
      </div>
    </div>
  );
}
