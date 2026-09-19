'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { generate, ApiKeyStore } from '@/lib/llmClient';
import { Prompts } from '@/lib/prompts';
import type { FixPlan, VerifyResult } from '@/lib/models';

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

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const lessonID = params.lessonId as string;

  const course = useStore(s => s.course);
  const learner = useStore(s => s.learner);
  const applyPatch = useStore(s => s.applyPatch);

  const [selectedType, setSelectedType] = useState('');
  const [freeText, setFreeText] = useState('');
  const [step, setStep] = useState<Step>('input');
  const [loadingMsg, setLoadingMsg] = useState('');
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

    setStep('loading');
    try {
      // Diagnose + Fix
      setLoadingMsg('Diagnosing the issue…');
      const report = { type: selectedType, text: freeText, lessonId: lessonID };
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

      // Verify
      setLoadingMsg('Verifying the fix…');
      const { system: vSys, user: vUser } = Prompts.verify(lesson, lesson, report, mastery);
      const vResult = await generate<VerifyResult>(vSys, vUser, apiKey, { temperature: 0.1 });
      setVerify(vResult);

      // Apply patch
      setLoadingMsg('Applying patch…');
      const result = applyPatch(plan.patch, 'report', plan.learnerFacingMessage, vResult);
      setApplyResult(result);

      setStep('result');
    } catch (err) {
      setLoadingMsg('');
      setStep('input');
      alert('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  if (step === 'loading') {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 20px' }} />
          <div className="text-xl" style={{ marginBottom: 8 }}>{loadingMsg}</div>
          <div className="text-muted text-sm">This takes 10–20 seconds…</div>
        </div>
      </div>
    );
  }

  if (step === 'result' && fixPlan) {
    const passed = verify?.verdict === 'pass';
    return (
      <div className="page">
        <nav className="navbar">
          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>← Lesson</button>
          <span className="text-sm" style={{ fontWeight: 600 }}>Report / Fix Result</span>
          <div />
        </nav>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0 40px' }}>
          <div className="container container-sm">

            {/* Learner message */}
            <div className="card" style={{ marginBottom: 20, borderColor: passed ? 'rgba(34,197,94,0.3)' : 'rgba(249,115,22,0.3)' }}>
              <div className="text-sm" style={{ fontWeight: 700, marginBottom: 8, color: passed ? 'var(--mastery-solid)' : 'var(--accent)' }}>
                {passed ? '✓ Fix applied & verified' : '⚠ Fix applied (needs review)'}
              </div>
              <div className="text-base" style={{ lineHeight: 1.7 }}>{fixPlan.learnerFacingMessage}</div>
            </div>

            {/* Diagnosis */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 10 }}>DIAGNOSIS</div>
              <div className="text-sm" style={{ marginBottom: 6 }}><strong>Root cause:</strong> {fixPlan.diagnosis.rootCause}</div>
              <div className="text-sm"><strong>Category:</strong> {fixPlan.diagnosis.category}</div>
              <div style={{ marginTop: 8 }}>
                <span className={`badge badge-${fixPlan.diagnosis.confidence >= 0.8 ? 'green' : fixPlan.diagnosis.confidence >= 0.5 ? 'blue' : 'amber'}`}>
                  {Math.round(fixPlan.diagnosis.confidence * 100)}% confidence
                </span>
                <span className="badge badge-gray" style={{ marginLeft: 6 }}>{fixPlan.scope} scope</span>
              </div>
            </div>

            {/* Patch ops */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 10 }}>CHANGES APPLIED</div>
              <div className="text-sm" style={{ fontWeight: 600, marginBottom: 10 }}>{fixPlan.patch.summary}</div>
              {fixPlan.patch.ops.map((op, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13, color: 'var(--text-2)' }}>
                  <span className="badge badge-blue">{op.type}</span>
                  <span>{'reason' in op ? op.reason : ''}</span>
                </div>
              ))}
            </div>

            {/* Verification */}
            {verify && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 10 }}>VERIFICATION</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge badge-${passed ? 'green' : 'red'}`}>
                    {passed ? '✓ PASS' : '✗ FAIL'}
                  </span>
                  <span className="text-sm text-muted">{verify.factualClaimsChecked.length} claims checked</span>
                </div>
                {verify.issues.length > 0 && (
                  <div>
                    {verify.issues.map((iss, i) => (
                      <div key={i} className="text-sm" style={{ color: iss.severity === 'high' ? '#f87171' : 'var(--mastery-weak)', marginBottom: 4 }}>
                        {iss.severity === 'high' ? '🔴' : '🟡'} {iss.detail}
                      </div>
                    ))}
                  </div>
                )}
                {verify.factualClaimsChecked.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div className="text-xs text-dim" style={{ marginBottom: 6 }}>Claims checked:</div>
                    {verify.factualClaimsChecked.map((c, i) => (
                      <div key={i} className="text-xs text-muted" style={{ marginBottom: 3 }}>✓ {c}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Propagation */}
            {fixPlan.propagationHints.length > 0 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: 10 }}>ALSO AFFECTED</div>
                {fixPlan.propagationHints.map((h, i) => {
                  const c = course.concepts.find(x => x.id === h.conceptID);
                  return (
                    <div key={i} className="text-sm" style={{ marginBottom: 6 }}>
                      <span className="badge badge-orange" style={{ marginRight: 6 }}>{c?.name ?? h.conceptID}</span>
                      {h.why}
                    </div>
                  );
                })}
              </div>
            )}

            {applyResult && !applyResult.success && (
              <div className="card" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
                <div className="text-sm" style={{ color: '#f87171' }}>Patch could not be applied: {applyResult.error}</div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => router.push(`/lesson/${lessonID}`)}>
                View Updated Lesson
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => router.push('/roadmap')}>
                Roadmap →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="navbar">
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/lesson/${lessonID}`)}>← Lesson</button>
        <span className="text-sm" style={{ fontWeight: 600 }}>Report / Fix</span>
        <div />
      </nav>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0 120px' }}>
        <div className="container container-sm">
          <h1 className="text-2xl" style={{ marginBottom: 6 }}>Report an issue</h1>
          <p className="text-muted text-sm" style={{ marginBottom: 28, lineHeight: 1.6 }}>
            "{lesson.title}" — AI will diagnose, patch, and verify a fix in ~15 seconds.
          </p>

          {/* Type selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {REPORT_TYPES.map(rt => (
              <button
                key={rt.id}
                id={`report-type-${rt.id}`}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  gap: 12,
                  padding: '12px 16px',
                  borderColor: selectedType === rt.id ? 'var(--accent)' : undefined,
                  background: selectedType === rt.id ? 'rgba(249,115,22,0.08)' : undefined,
                  textAlign: 'left',
                }}
                onClick={() => setSelectedType(rt.id)}
              >
                <span style={{ flex: 1 }}>{rt.label}</span>
                <span className="text-dim text-xs">{rt.desc}</span>
                {selectedType === rt.id && <span style={{ color: 'var(--accent)' }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Free text */}
          <div style={{ marginBottom: 24 }}>
            <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Additional detail (optional)
            </label>
            <textarea
              className="input textarea"
              placeholder="Describe the issue in more detail…"
              value={freeText}
              onChange={e => setFreeText(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--glass-bg)', backdropFilter: 'var(--glass-blur)',
        borderTop: '1px solid var(--glass-border)',
        padding: '12px 20px', zIndex: 50,
      }}>
        <button
          id="submit-report-btn"
          className="btn btn-primary btn-full btn-lg"
          onClick={handleSubmit}
          disabled={!selectedType}
          style={{ borderColor: 'var(--accent)' }}
        >
          ⚑ Diagnose & Fix →
        </button>
      </div>
    </div>
  );
}
