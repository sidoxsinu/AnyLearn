'use client';

import { useState, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generate, ApiKeyStore } from '@/lib/llmClient';
import { Prompts } from '@/lib/prompts';
import type { FixPlan, VerifyResult, Lesson, PatchOp } from '@/lib/models';

export function constructAfterLesson(
  lesson: Lesson,
  patchOps: PatchOp[],
  lessonID: string
): Lesson {
  const afterLesson: Lesson = JSON.parse(JSON.stringify(lesson));
  for (const op of patchOps) {
    if (op.type === 'replaceBlock' && op.lessonID === lessonID) {
      const idx = afterLesson.blocks.findIndex(b => b.id === op.blockID);
      if (idx !== -1) afterLesson.blocks[idx] = op.block;
    } else if (op.type === 'insertBlock' && op.lessonID === lessonID) {
      if (op.afterBlockID) {
        const idx = afterLesson.blocks.findIndex(b => b.id === op.afterBlockID);
        if (idx !== -1) afterLesson.blocks.splice(idx + 1, 0, op.block);
        else afterLesson.blocks.push(op.block);
      } else {
        afterLesson.blocks.unshift(op.block);
      }
    } else if (op.type === 'addPractice' && op.lessonID === lessonID) {
      afterLesson.task = op.task;
    } else if (op.type === 'markSkippable' && op.lessonID === lessonID) {
      afterLesson.skippable = { reason: op.reason };
    } else if (op.type === 'refreshResources' && op.lessonID === lessonID) {
      afterLesson.resourceQueries = op.queries;
    } else if (op.type === 'deleteLesson' && op.lessonID.startsWith(`block:${lessonID}:`)) {
      const targetBlockID = op.lessonID.split(':')[2];
      afterLesson.blocks = afterLesson.blocks.filter(b => b.id !== targetBlockID);
    }
  }
  return afterLesson;
}

const REPORT_TYPES = [
  { id: 'incorrect', label: '❌ Incorrect information', desc: 'Content has a factual error' },
  { id: 'confusing', label: '😕 Confusing explanation', desc: 'Hard to understand' },
  { id: 'missing_prerequisite', label: '🔗 Missing prerequisite', desc: 'Assumes knowledge I don\'t have' },
  { id: 'poor_example', label: '💡 Poor example', desc: 'Example doesn\'t help clarify' },
  { id: 'outdated', label: '📅 Outdated', desc: 'Information is no longer current' },
  { id: 'too_hard', label: '🔥 Too hard', desc: 'Content is above my level' },
  { id: 'too_easy', label: '😴 Too easy', desc: 'Content is below my level' },
  { id: 'broken_resource', label: '🔗 Broken resource', desc: 'A linked resource doesn\'t work' },
  { id: 'dont_understand', label: '🤔 I don\'t understand', desc: 'Free-text — explain further' },
];

type Step = 'input' | 'loading' | 'result';

function ReportContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const blockId = searchParams.get('blockId');
  const lessonID = params.lessonId as string;

  const course = useStore(s => s.course);
  const learner = useStore(s => s.learner);
  const applyPatch = useStore(s => s.applyPatch);

  const [selectedType, setSelectedType] = useState('');
  const [freeText, setFreeText] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loadingMsg, setLoadingMsg] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fixPlan, setFixPlan] = useState<FixPlan | null>(null);
  const [verify, setVerify] = useState<VerifyResult | null>(null);
  const [applyResult, setApplyResult] = useState<{ success: boolean; error?: string } | null>(null);

  const lesson = course?.lessons[lessonID];

  if (!course || !lesson) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <button className="btn btn-secondary" onClick={() => router.push('/roadmap')}>← Roadmap</button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selectedType) return;
    const apiKey = ApiKeyStore.get();
    if (!apiKey) { router.push('/goal'); return; }

    setSubmitError(null);
    setStep('loading');
    try {
      // Diagnose + Fix
      setLoadingMsg('Diagnosing the issue…');
      const report = {
        type: selectedType,
        text: freeText,
        lessonId: lessonID,
        ...(blockId ? { blockId } : {}),
      };
      const mastery = Object.fromEntries(
        lesson.conceptIDs.map(cid => [cid, learner.mastery[cid]?.probability ?? 0])
      );
      const neighbors = course.modules
        .flatMap(m => m.lessonIDs.map(id => course.lessons[id]))
        .filter(l => l && l.id !== lessonID)
        .slice(0, 5)
        .map(l => ({ title: l!.title, conceptIDs: l!.conceptIDs }));

      const { system: dSys, user: dUser } = Prompts.diagnoseAndFix(
        course.goal, report, lesson, neighbors, mastery
      );
      const plan = await generate<FixPlan>(dSys, dUser, apiKey, { temperature: 0.3 });
      setFixPlan(plan);

      // Verify with distinct afterLesson
      setLoadingMsg('Verifying the fix…');
      const afterLesson = constructAfterLesson(lesson, plan.patch.ops, lessonID);
      const { system: vSys, user: vUser } = Prompts.verify(lesson, afterLesson, report, mastery);
      const vResult = await generate<VerifyResult>(vSys, vUser, apiKey, { temperature: 0.1 });
      setVerify(vResult);

      // Apply patch
      setLoadingMsg('Applying patch…');
      let result;
      if (vResult.verdict.toLowerCase().trim() === 'pass') {
        result = applyPatch(plan.patch, 'report', plan.learnerFacingMessage, vResult);
      } else {
        result = { success: false, error: 'Verification failed. Patch rejected by AI judge.' };
      }
      setApplyResult(result);

      setStep('result');
    } catch (err) {
      setLoadingMsg('');
      setStep('input');
      setSubmitError(err instanceof Error ? err.message : String(err));
    }
  };

  if (step === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-3xl border border-black/5 shadow-dei-card max-w-sm">
          <div className="spinner mb-4" />
          <div className="text-base font-extrabold text-[#0F1117] mb-1">{loadingMsg}</div>
          <div className="text-xs text-black/50">Analyzing and verifying your learning path…</div>
        </div>
      </div>
    );
  }

  if (step === 'result' && fixPlan) {
    const passed = verify?.verdict.toLowerCase().trim() === 'pass';
    const isSuccess = Boolean(applyResult?.success && passed);
    return (
      <div className="w-full h-full flex flex-col relative select-none">
        <div className="flex items-center justify-between pb-3 border-b border-black/5 shrink-0">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>
            ← Lesson
          </button>
          <span className="text-sm font-extrabold text-[#0F1117]">Diagnostic & Verification Result</span>
          <div />
        </div>

        <div className="flex-1 overflow-y-auto py-6 pb-20">
          <div className="container container-sm">
            {/* Result Header Card */}
            <div className={`rounded-3xl p-6 border shadow-dei-card mb-5 ${
              isSuccess ? 'bg-[#D4F6D8] border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="text-xs font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span>{isSuccess ? '✓ Fix Verified & Applied' : '⚠️ Attention Required'}</span>
              </div>
              <p className="text-sm md:text-base font-medium leading-relaxed">{fixPlan.learnerFacingMessage}</p>
            </div>

            {/* Diagnosis */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-dei-card mb-5">
              <div className="text-xs font-black uppercase tracking-wider text-black/50 mb-3">AI Diagnosis</div>
              <div className="text-sm text-black mb-1"><strong>Root cause:</strong> {fixPlan.diagnosis.rootCause}</div>
              <div className="text-sm text-black mb-3"><strong>Category:</strong> {fixPlan.diagnosis.category}</div>
              <div className="flex gap-2">
                <span className="badge badge-green">{Math.round(fixPlan.diagnosis.confidence * 100)}% confidence</span>
                <span className="badge badge-gray">{fixPlan.scope} scope</span>
              </div>
            </div>

            {/* Patch Ops */}
            <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-dei-card mb-5">
              <div className="text-xs font-black uppercase tracking-wider text-black/50 mb-2">Changes Applied</div>
              <div className="text-sm font-bold text-black mb-3">{fixPlan.patch.summary}</div>
              {fixPlan.patch.ops.map((op, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-black/70 mb-2">
                  <span className="badge badge-blue">{op.type}</span>
                  <span>{'reason' in op ? op.reason : ''}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => router.push(`/lesson/${lessonID}`)}>
                View Updated Lesson
              </button>
              <button className="btn btn-primary flex-1" onClick={() => router.push('/roadmap')}>
                Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-black/5 shrink-0">
        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>
          ← Lesson
        </button>
        <span className="text-sm font-extrabold text-[#0F1117]">Report / Fix Issue</span>
        <div />
      </div>

      <div className="flex-1 overflow-y-auto py-6 pb-24">
        <div className="container container-sm">
          <h2 className="text-xl md:text-2xl font-extrabold text-[#0F1117] mb-1">
            Report an issue with this lesson
          </h2>
          <p className="text-xs md:text-sm text-black/60 mb-6">
            &quot;{lesson.title}&quot; — AI will diagnose, patch, and verify a fix in ~15 seconds.
          </p>

          {/* Error Message */}
          {submitError && (
            <div className="bg-red-50 rounded-2xl p-4 border border-red-200 text-red-700 text-xs font-semibold mb-5 flex items-center justify-between">
              <span>Error: {submitError}</span>
              <button onClick={() => setSubmitError(null)} className="text-red-900 font-bold">✕</button>
            </div>
          )}

          {/* Targeted Block Indicator */}
          {blockId && (
            <div className="bg-[#E1F6FB] rounded-xl px-3 py-2 text-xs font-bold text-sky-900 mb-4 inline-flex items-center gap-1.5">
              <span>⚑</span>
              <span>Targeting Block: {blockId}</span>
            </div>
          )}

          {/* Issue Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            {REPORT_TYPES.map(rt => {
              const isSelected = selectedType === rt.id;
              return (
                <button
                  key={rt.id}
                  id={`report-type-${rt.id}`}
                  onClick={() => setSelectedType(rt.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all shadow-sm flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-black text-white border-black scale-[1.01]'
                      : 'bg-white hover:bg-[#F8F9FA] border-black/10 text-black'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{rt.label}</span>
                    {isSelected && <span className="text-xs">✓</span>}
                  </div>
                  <span className={`text-[11px] ${isSelected ? 'text-white/70' : 'text-black/50'}`}>
                    {rt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Additional Detail */}
          <div className="mb-6">
            <label className="text-xs font-bold text-black/70 block mb-2">
              Additional Details (optional)
            </label>
            <textarea
              className="input textarea"
              placeholder="Tell us what felt unclear or how it can be improved…"
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Submit */}
      <div className="absolute bottom-3 left-0 right-0 px-4 py-2 bg-white/95 backdrop-blur-md rounded-2xl border border-black/10 shadow-dei-float flex items-center justify-center z-30">
        <button
          id="submit-report-btn"
          className="btn btn-primary btn-full md:w-80"
          onClick={handleSubmit}
          disabled={!selectedType}
        >
          ⚑ Diagnose & Fix →
        </button>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><div className="spinner" /></div>}>
      <ReportContent />
    </Suspense>
  );
}

