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

    const weakConcepts = (lesson.conceptIDs || []).filter(cid => {
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
    if (!q || !Array.isArray(q.options)) return [];
    // Deterministic option order based on question and option text to ensure render purity
    return [...q.options].sort((a, b) => {
      const textA = a?.text || '';
      const textB = b?.text || '';
      const qId = q.id || '';
      const charA = (textA.charCodeAt(0) || 0) + (qId.charCodeAt(0) || 0);
      const charB = (textB.charCodeAt(0) || 0) + (qId.charCodeAt(0) || 0);
      return (charA % 7) - (charB % 7);
    });
  }, [q]);

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
    const weakConcepts = (lesson.conceptIDs || []).filter(cid => {
      const r = learner.mastery[cid];
      return r && Mastery.shouldAdapt(r);
    });

    return (
      <div className="w-full h-full flex flex-col relative select-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/5 shrink-0">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>
            ← Lesson
          </button>
          <span className="text-sm font-extrabold text-[#0F1117]">Quiz Results</span>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push('/roadmap')}>
            Roadmap →
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 pb-20">
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {/* Score Card in Brutalist Mint */}
            <div className="brutal-card p-8 text-center bg-[#00F59B]">
              <div className="text-5xl mb-3">
                {score >= 0.8 ? '🎉' : score >= 0.5 ? '💪' : '📚'}
              </div>
              <div className="text-3xl font-black text-black mb-1">
                {correctCount} of {questions.length} Correct
              </div>
              <div className="text-sm font-black text-black">
                {score >= 0.8 ? 'Mastery Achieved!' : score >= 0.5 ? 'Good Progress — Keep Going!' : 'Reviewing concepts is part of the process!'}
              </div>
            </div>

            {/* Mastery Bars */}
            <div className="brutal-card p-6 bg-white">
              <div className="text-xs font-black uppercase tracking-wider text-black mb-4 flex items-center gap-1.5">
                <span>🧠</span>
                <span>Concept Mastery Updated</span>
              </div>
              <div className="flex flex-col gap-3">
                {(lesson.conceptIDs || []).map(cid => {
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

            {/* Weak concept adaptive notice */}
            {weakConcepts.length > 0 && (
              <div className="brutal-card p-6 bg-[#FEF3C7]">
                <div className="text-sm font-black text-black mb-2 flex items-center gap-2">
                  <span>⚡</span>
                  <span>
                    {adaptationState.status === 'applied'
                      ? 'Adaptive Path Generated & Applied'
                      : adaptationState.status === 'running'
                      ? 'Analyzing Struggle Areas…'
                      : 'Adaptive Reinforcement Triggered'}
                  </span>
                </div>
                <p className="text-xs text-black font-semibold leading-relaxed">
                  {adaptationState.status === 'applied'
                    ? `Your roadmap was updated: ${adaptationState.summary ?? 'A targeted remedial review was inserted.'}`
                    : `We noticed struggle areas in ${weakConcepts.length} concept(s). Your learning path adapts automatically.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {weakConcepts.map(cid => {
                    const c = course.concepts.find(x => x.id === cid);
                    return <span key={cid} className="brutal-badge bg-white">{c?.name ?? cid}</span>;
                  })}
                </div>
              </div>
            )}

            {/* Question Review */}
            <div className="brutal-card p-6 bg-white">
              <div className="text-xs font-black uppercase tracking-wider text-black mb-4">
                Detailed Review
              </div>
              <div className="flex flex-col gap-4">
                {results.map((r, i) => (
                  <div key={i} className="pb-4 border-b-2 border-black/10 last:border-b-0">
                    <div className="text-sm font-black text-black mb-1.5">
                      {i + 1}. {r.question.prompt}
                    </div>
                    <div className={`text-xs font-black mb-1 ${r.correct ? 'text-green-700' : 'text-red-600'}`}>
                      {r.correct ? '✓ Correct' : `✗ Selected: ${r.option.text}`}
                    </div>
                    {!r.correct && r.option.misconception && (
                      <div className="text-xs text-amber-900 bg-amber-50 border border-black rounded p-2 mb-1.5 font-bold">
                        💡 Common confusion: {r.option.misconception}
                      </div>
                    )}
                    <div className="text-xs text-neutral-700 font-medium leading-relaxed">{r.question.explanation}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="brutal-btn bg-white flex-1" onClick={() => router.push(`/lesson/${lessonID}`)}>
                Back to Lesson
              </button>
              <button className="brutal-btn brutal-btn-primary flex-1" onClick={() => router.push('/roadmap')}>
                Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col relative select-none">
      {/* Quiz Header */}
      <div className="flex items-center justify-between pb-4 border-b-2 border-black shrink-0">
        <button className="brutal-btn brutal-btn-sm bg-white" onClick={() => router.push(`/lesson/${lessonID}`)}>
          ← Lesson
        </button>
        <div className="text-center">
          <div className="text-xs font-black uppercase tracking-wider text-neutral-600">
            Question {step + 1} of {questions.length}
          </div>
          <div className="text-base font-black text-black">{lesson.title}</div>
        </div>
        <span className="brutal-badge bg-white">{step + 1}/{questions.length}</span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-3 border-2 border-black bg-white rounded my-4 overflow-hidden">
        <div className="h-full bg-[#FFE600] border-r-2 border-black transition-all" style={{ width: `${((step + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Main Question Area */}
      <div className="flex-1 pb-24">
        <div className="max-w-2xl mx-auto py-2">
          <div className="mb-3">
            <span className={`brutal-badge ${q.difficulty === 1 ? 'bg-[#00F59B]' : q.difficulty === 2 ? 'bg-[#38BDF8]' : 'bg-[#FFE600]'}`}>
              {q.difficulty === 1 ? 'Recall' : q.difficulty === 2 ? 'Apply' : 'Transfer'}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-black leading-snug mb-6">
            {q.prompt}
          </h2>

          {/* Options */}
          <div className="flex flex-col gap-3 mb-6">
            {shuffledOptions.map((opt, i) => {
              const isSelected = selected?.id === opt.id;
              const isCorrect = answered && opt.id === q.correctOptionID;
              const isWrong = answered && isSelected && !isCorrect;
              const isUnselected = answered && !isSelected && opt.id !== q.correctOptionID;

              return (
                <button
                  key={opt.id}
                  id={`option-${i + 1}`}
                  onClick={() => handleSelect(opt)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded border-[3px] border-black transition-all flex items-center gap-3.5 ${
                    isSelected && !answered
                      ? 'bg-black text-white shadow-[4px_4px_0px_#FFE600]'
                      : isCorrect
                      ? 'bg-[#00F59B] text-black shadow-[4px_4px_0px_#000000]'
                      : isWrong
                      ? 'bg-[#FF5A36] text-white shadow-[4px_4px_0px_#000000]'
                      : isUnselected
                      ? 'bg-white opacity-40 shadow-[2px_2px_0px_#000000]'
                      : 'bg-white hover:bg-[#FAF8F5] text-black shadow-[4px_4px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded border-2 border-black flex items-center justify-center font-black text-xs shrink-0 ${
                      isSelected && !answered
                        ? 'bg-white text-black'
                        : isCorrect
                        ? 'bg-black text-white'
                        : isWrong
                        ? 'bg-black text-white'
                        : 'bg-[#FFE600] text-black'
                    }`}
                  >
                    {answered ? (isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-sm font-bold flex-1">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          {answered && (
            <div className="brutal-card p-5 bg-[#E0F2FE] animate-fadeIn">
              <div className="text-xs font-black uppercase text-black tracking-wider mb-1 flex items-center gap-1.5">
                <span>{selected?.id === q.correctOptionID ? '🎉 Correct!' : '💡 Key Insight'}</span>
              </div>
              <p className="text-xs md:text-sm text-black font-bold leading-relaxed">
                {q.explanation}
              </p>
              {selected && selected.id !== q.correctOptionID && selected.misconception && (
                <div className="mt-2 text-xs text-amber-900 bg-amber-100 border border-black rounded p-2 font-bold">
                  Note: {selected.misconception}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="sticky bottom-4 mt-6 p-4 bg-white border-[3px] border-black shadow-[4px_4px_0px_#000000] rounded-lg flex items-center justify-center z-30">
        {!answered ? (
          <button
            id="confirm-answer-btn"
            className="brutal-btn brutal-btn-primary w-full md:w-80"
            onClick={handleConfirm}
            disabled={!selected}
          >
            Confirm Answer ✓
          </button>
        ) : (
          <button
            id="next-question-btn"
            className="brutal-btn brutal-btn-primary w-full md:w-80"
            onClick={handleNext}
          >
            {isLastQuestion ? 'See Results 🎉' : 'Next Question →'}
          </button>
        )}
      </div>
    </div>
  );
}

