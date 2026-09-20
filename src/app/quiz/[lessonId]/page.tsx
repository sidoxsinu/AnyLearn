'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Mastery } from '@/lib/mastery';
import { MasteryBar } from '@/components/MasteryRing';
import { generate, ApiKeyStore } from '@/lib/llmClient';
import { Prompts } from '@/lib/prompts';
import type { Question, QuestionOption, Course, Lesson, RoadmapPatch } from '@/lib/models';

export function createRemedialPatch(
  course: Course,
  lesson: Lesson,
  weakConcepts: string[]
): RoadmapPatch {
  const weakConceptNames = weakConcepts
    .map(cid => course.concepts.find(c => c.id === cid)?.name ?? cid)
    .join(' & ');
  const timestamp = Date.now().toString(36);
  const remedialLessonID = `l-remedial-${lesson.id.replace(/^l-/, '')}-${timestamp}`;
  const remedialLesson: Lesson = {
    id: remedialLessonID,
    moduleID: lesson.moduleID,
    title: `Remedial Review: ${weakConceptNames}`,
    conceptIDs: weakConcepts,
    objectives: [
      `Reinforce core principles of ${weakConceptNames}`,
      `Review targeted misconceptions identified in quiz`,
    ],
    status: 'ready',
    blocks: [
      {
        type: 'callout',
        id: `b-rem-callout-${timestamp}`,
        kind: 'warning',
        markdown: `**Targeted Review**: Based on your recent quiz results, this review focuses on ${weakConceptNames} to help bridge key conceptual gaps before moving forward.`,
      },
      {
        type: 'markdown',
        id: `b-rem-md-${timestamp}`,
        markdown: `## Focused Recap: ${weakConceptNames}\n\nReview the underlying fundamentals and trace how these concepts interact. Pay special attention to common pitfalls and verify each calculation or configuration step carefully.`,
      },
    ],
    resourceQueries: weakConcepts.map(cid => `${cid} refresher tutorial`),
    resources: [],
    sources: [],
    unsourced: false,
    confidence: 'high',
    version: 1,
  };

  return {
    summary: `Add remedial review for ${weakConceptNames}`,
    ops: [
      {
        type: 'insertLesson',
        afterLessonID: lesson.id,
        lesson: remedialLesson,
        reason: `Low mastery detected on ${weakConceptNames} during quiz`,
      },
    ],
  };
}

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const lessonID = params.lessonId as string;

  const course = useStore(s => s.course);
  const learner = useStore(s => s.learner);
  const updateMastery = useStore(s => s.updateMastery);

  const [step, setStep] = useState(0); // current question index
  const [selected, setSelected] = useState<QuestionOption | null>(null);
  const [answered, setAnswered] = useState(false);
  const [results, setResults] = useState<Array<{ question: Question; option: QuestionOption; correct: boolean }>>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [adaptationState, setAdaptationState] = useState<{
    status: 'idle' | 'running' | 'applied' | 'error';
    summary?: string;
    error?: string;
  }>({ status: 'idle' });
  const adaptationTriggeredRef = useRef(false);

  const lesson = course?.lessons[lessonID];
  const questions = course?.quizzes[lessonID] ?? [];

  useEffect(() => {
    if (!showSummary || !course || !lesson || adaptationTriggeredRef.current) return;

    // Check if we already adapted for this lesson completion recently
    const hasAdapted = course.changelog.some(c => 
      c.source === 'adapt' && c.reason.includes(lesson.id)
    );
    if (hasAdapted) {
      adaptationTriggeredRef.current = true;
      return;
    }

    const weakConcepts = lesson.conceptIDs.filter(cid => {
      const r = learner.mastery[cid];
      return r && Mastery.shouldAdapt(r);
    });

    if (weakConcepts.length === 0) return;

    adaptationTriggeredRef.current = true;

    const runAdapt = async () => {
      setAdaptationState({ status: 'running' });
      const apiKey = ApiKeyStore.get();
      const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('anylearn-demo-mode') === 'true';

      let patch: RoadmapPatch | null = null;
      let reason = `Quiz adaptation for ${weakConcepts.length} concept(s) (Lesson: ${lesson.id})`;

      if (apiKey && !isDemoMode) {
        try {
          const attempts = learner.attempts
            .filter(a => lesson.conceptIDs.includes(a.conceptID))
            .slice(-5);
          const { system, user } = Prompts.adapt(
            course.goal,
            { modules: course.modules },
            course.concepts,
            learner.mastery,
            { type: 'quizFailure', lessonID, weakConcepts },
            attempts
          );
          patch = await generate<RoadmapPatch>(system, user, apiKey, { temperature: 0.3 });
          if (patch?.summary) reason = `${patch.summary} (Lesson: ${lesson.id})`;
        } catch {
          patch = null;
        }
      }

      if (!patch) {
        patch = createRemedialPatch(course, lesson, weakConcepts);
        reason = `${patch.summary} (Lesson: ${lesson.id})`;
      }

      const res = useStore.getState().applyPatch(patch, 'adapt', reason);
      if (res.success) {
        setAdaptationState({ status: 'applied', summary: patch.summary });
      } else {
        setAdaptationState({ status: 'error', error: res.error });
      }
    };

    void runAdapt();
  }, [showSummary, course, lesson, lessonID, learner]);

  const q = questions[step];
  const isLastQuestion = step === questions.length - 1;

  const shuffledOptions = useMemo(() => {
    if (!q) return [];
    return [...q.options].sort(() => Math.random() - 0.5);
  }, [q?.id]);

  if (!course || !lesson || questions.length === 0) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
          <div className="text-xl" style={{ marginBottom: 8 }}>No quiz yet</div>
          <div className="text-muted text-sm" style={{ marginBottom: 20 }}>
            Open the lesson first to generate content and quiz questions.
          </div>
          <button className="btn btn-primary" onClick={() => router.push(`/lesson/${lessonID}`)}>
            Go to Lesson
          </button>
        </div>
      </div>
    );
  }

  const handleSelect = (option: QuestionOption) => {
    if (answered) return;
    setSelected(option);
  };

  const handleConfirm = () => {
    if (!selected || answered) return;
    const correct = selected.id === q.correctOptionID;
    updateMastery(q, selected);
    setResults(prev => [...prev, { question: q, option: selected, correct }]);
    setAnswered(true);
  };

  const handleNext = () => {
    if (isLastQuestion) {
      useStore.getState().completeLesson(lessonID);
      setShowSummary(true);
    } else {
      setStep(s => s + 1);
      setSelected(null);
      setAnswered(false);
    }
  };

  const correctCount = results.filter(r => r.correct).length;
  const score = results.length > 0 ? correctCount / results.length : 0;

  if (showSummary) {
    const weakConcepts = lesson.conceptIDs.filter(cid => {
      const r = learner.mastery[cid];
      return r && Mastery.shouldAdapt(r);
    });

    return (
      <div className="page" style={{ overflowY: 'auto' }}>
        <nav className="navbar">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>← Lesson</button>
          <span className="text-sm text-muted">Quiz Complete</span>
          <button className="btn btn-ghost btn-sm" onClick={() => router.push('/roadmap')}>Roadmap</button>
        </nav>

        <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 20px' }}>
          {/* Score */}
          <div className="card" style={{ textAlign: 'center', marginBottom: 24, padding: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {score >= 0.8 ? '🎉' : score >= 0.5 ? '💪' : '📚'}
            </div>
            <div className="text-3xl" style={{ marginBottom: 4 }}>
              {correctCount}/{questions.length} correct
            </div>
            <div className="text-muted">{score >= 0.8 ? 'Excellent!' : score >= 0.5 ? 'Good progress' : 'Keep practising'}</div>
          </div>

          {/* Mastery bars */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="text-sm" style={{ fontWeight: 600, marginBottom: 16 }}>Concept Mastery</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lesson.conceptIDs.map(cid => {
                const concept = course.concepts.find(c => c.id === cid);
                const record = learner.mastery[cid];
                return (
                  <div key={cid}>
                    <MasteryBar
                      probability={record?.probability ?? 0}
                      conceptName={concept?.name ?? cid}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weak concept notice */}
          {weakConcepts.length > 0 && (
            <div
              className="card"
              style={{
                borderColor: adaptationState.status === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)',
                background: adaptationState.status === 'error' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)',
                marginBottom: 24,
              }}
            >
              <div
                className="text-sm"
                style={{
                  color: adaptationState.status === 'error' ? '#ef4444' : 'var(--mastery-weak)',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                {adaptationState.status === 'applied'
                  ? '✓ Adaptive update applied'
                  : adaptationState.status === 'running'
                  ? '⏳ Generating adaptive update…'
                  : adaptationState.status === 'error'
                  ? '⚠ Adaptive update failed'
                  : '⚠ Adaptive update triggered'}
              </div>
              <div className="text-sm text-muted">
                {adaptationState.status === 'applied'
                  ? `Your roadmap was updated: ${adaptationState.summary ?? 'A remedial review lesson was added.'}`
                  : adaptationState.status === 'running'
                  ? 'Analyzing your struggle areas and generating a remedial path…'
                  : adaptationState.status === 'error'
                  ? `Could not apply patch: ${adaptationState.error}`
                  : `You're struggling with ${weakConcepts.length} concept${weakConcepts.length > 1 ? 's' : ''}. The roadmap will be updated to add a remedial path.`}
              </div>
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {weakConcepts.map(cid => {
                  const c = course.concepts.find(x => x.id === cid);
                  return <span key={cid} className="badge badge-amber">{c?.name ?? cid}</span>;
                })}
              </div>
            </div>
          )}

          {/* Question review */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="text-sm" style={{ fontWeight: 600, marginBottom: 16 }}>Review</div>
            {results.map((r, i) => (
              <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div className="text-sm" style={{ marginBottom: 6, fontWeight: 500 }}>
                  {i + 1}. {r.question.prompt}
                </div>
                <div className="text-xs" style={{ color: r.correct ? 'var(--mastery-solid)' : '#f87171', marginBottom: 4 }}>
                  {r.correct ? '✓ Correct' : `✗ You chose: ${r.option.text}`}
                </div>
                {!r.correct && (
                  <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
                    {r.option.misconception && <em>Misconception: {r.option.misconception}</em>}
                  </div>
                )}
                <div className="text-xs text-muted">{r.question.explanation}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => router.push(`/lesson/${lessonID}`)}>
              Back to Lesson
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push('/roadmap')}>
              Roadmap →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="navbar">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>← Lesson</button>
        <div style={{ textAlign: 'center' }}>
          <div className="text-xs text-muted">Question {step + 1} of {questions.length}</div>
          <div className="text-sm" style={{ fontWeight: 600 }}>{lesson.title}</div>
        </div>
        <span className="badge badge-gray">{step + 1}/{questions.length}</span>
      </nav>

      {/* Progress */}
      <div className="progress-bar-track" style={{ borderRadius: 0 }}>
        <div className="progress-bar-fill" style={{ width: `${((step) / questions.length) * 100}%` }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '40px 0 120px' }}>
        <div className="container container-sm">
          {/* Difficulty */}
          <div style={{ marginBottom: 12 }}>
            <span className={`badge badge-${q.difficulty === 1 ? 'green' : q.difficulty === 2 ? 'blue' : 'amber'}`}>
              {q.difficulty === 1 ? 'Recall' : q.difficulty === 2 ? 'Apply' : 'Transfer'}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl" style={{ marginBottom: 32, lineHeight: 1.4 }}>{q.prompt}</h2>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {shuffledOptions.map((opt, i) => {
              const isSelected = selected?.id === opt.id;
              const isCorrect = answered && opt.id === q.correctOptionID;
              const isWrong = answered && isSelected && !isCorrect;
              const isUnselected = answered && !isSelected && opt.id !== q.correctOptionID;
              return (
                <button
                  key={opt.id}
                  id={`option-${i + 1}`}
                  className={`quiz-option ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''} ${isUnselected ? 'unselected-after-answer' : ''}`}
                  onClick={() => handleSelect(opt)}
                  disabled={answered}
                  style={{ borderColor: isSelected && !answered ? 'var(--accent)' : undefined }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: isSelected && !answered ? 'var(--accent)' : isCorrect ? 'var(--mastery-solid)' : isWrong ? '#ef4444' : 'var(--bg-4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                    color: (isSelected || isCorrect || isWrong) ? '#fff' : 'var(--text-3)',
                    transition: 'all 200ms ease',
                  }}>
                    {answered ? (isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation (after answer) */}
          {answered && (
            <div className="card animate-fadeIn" style={{ marginBottom: 16 }}>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 8 }}>
                {selected?.id === q.correctOptionID ? '✓ Correct!' : '✗ Not quite'}
              </div>
              <div className="text-sm text-muted" style={{ lineHeight: 1.6 }}>{q.explanation}</div>
              {selected && selected.id !== q.correctOptionID && selected.misconception && (
                <div className="text-xs" style={{ marginTop: 10, color: 'var(--mastery-weak)', fontStyle: 'italic' }}>
                  Common confusion: {selected.misconception}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 20px', display: 'flex', gap: 10, zIndex: 50,
      }}>
        {!answered ? (
          <button
            id="confirm-answer-btn"
            className="btn btn-primary btn-full btn-lg"
            onClick={handleConfirm}
            disabled={!selected}
          >
            Confirm Answer
          </button>
        ) : (
          <button
            id="next-question-btn"
            className="btn btn-primary btn-full btn-lg"
            onClick={handleNext}
          >
            {isLastQuestion ? 'See Results →' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}
