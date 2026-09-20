'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ApiKeyStore } from '@/lib/llmClient';
import { ApiKeyModal } from '@/components/ApiKeyModal';

const emptySubscribe = () => () => {};

const EXAMPLE_GOALS = [
  { emoji: '🔌', label: 'PCB design from zero', goal: 'I want to learn PCB design from zero and eventually design my own board' },
  { emoji: '📈', label: 'Options pricing', goal: 'I want to understand options pricing and trading strategies' },
  { emoji: '🦀', label: 'Rust programming', goal: 'I want to learn Rust programming for systems development' },
  { emoji: '🤖', label: 'Machine learning', goal: 'I want to understand machine learning and build my first model' },
  { emoji: '🐝', label: 'Beekeeping', goal: 'I want to start beekeeping and harvest my first honey' },
  { emoji: '🗾', label: 'Japanese', goal: 'I want to learn Japanese enough for travel and basic conversations' },
];

const ARTIFACTS = ['Working prototype', 'Portfolio project', 'Pass a test / certification', 'Personal project', 'Career change', 'Just understand it deeply'];
const HOURS = [1, 2, 5, 10, 20];

export default function GoalPage() {
  const router = useRouter();

  const [goal, setGoal] = useState('');
  const [artifact, setArtifact] = useState('');
  const [hours, setHours] = useState(5);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [showModalOverride, setShowModalOverride] = useState<boolean | null>(null);

  const showModal = mounted && (showModalOverride ?? !ApiKeyStore.has());

  const canSubmit = goal.trim().length >= 8;

  const handleStart = () => {
    if (!canSubmit) return;
    // Store intent in sessionStorage for the build page
    sessionStorage.setItem('anylearn-goal', goal.trim());
    sessionStorage.setItem('anylearn-artifact', artifact || 'Working prototype');
    sessionStorage.setItem('anylearn-hours', String(hours));
    localStorage.removeItem('anylearn-demo-mode');
    router.push('/build');
  };

  if (showModal) {
    return <ApiKeyModal onReady={() => setShowModalOverride(false)} />;
  }

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      {/* Background gradients */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 30%, rgba(249,115,22,0.07) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(59,130,246,0.05) 0%, transparent 55%)',
      }} />

      <div style={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
          <h1 className="text-4xl" style={{ marginBottom: 12 }}>
            What do you want to learn?
          </h1>
          <p className="text-muted" style={{ fontSize: 17, lineHeight: 1.6 }}>
            Describe your goal in one sentence. AnyLearn will build you a personalized,<br />
            <em>living</em> course — not a chat, a real structured learning environment.
          </p>
        </div>

        {/* Main input */}
        <div className="card" style={{ padding: 28, marginBottom: 20 }}>
          <textarea
            id="goal-input"
            className="input textarea"
            placeholder="e.g. I want to learn PCB design from zero and eventually design my own board…"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            rows={3}
            style={{ fontSize: 16 }}
            autoFocus
          />

          {/* Example chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {EXAMPLE_GOALS.map(eg => (
              <button
                key={eg.label}
                className={`chip ${goal === eg.goal ? 'active' : ''}`}
                onClick={() => setGoal(eg.goal)}
                id={`example-${eg.label.replace(/\s+/g, '-').toLowerCase()}`}
              >
                {eg.emoji} {eg.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calibration */}
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div className="text-sm" style={{ fontWeight: 600, marginBottom: 16, color: 'var(--text-2)' }}>
            Quick calibration (optional)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* End artifact */}
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 8 }}>What&apos;s your end goal?</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ARTIFACTS.map(a => (
                  <button
                    key={a}
                    className={`chip ${artifact === a ? 'active' : ''}`}
                    onClick={() => setArtifact(artifact === a ? '' : a)}
                    id={`artifact-${a.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div>
              <div className="text-sm text-muted" style={{ marginBottom: 8 }}>
                Hours per week: <strong className="text-accent">{hours}h</strong>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {HOURS.map(h => (
                  <button
                    key={h}
                    className={`chip ${hours === h ? 'active' : ''}`}
                    onClick={() => setHours(h)}
                    id={`hours-${h}`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          id="build-course-btn"
          className="btn btn-primary btn-lg btn-full"
          onClick={handleStart}
          disabled={!canSubmit}
          style={{ fontSize: 17 }}
        >
          Build my course →
        </button>

        {/* Key management */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { ApiKeyStore.clear(); setShowModalOverride(true); }}
          >
            🔑 Change API key
          </button>
        </div>
      </div>
    </div>
  );
}
