'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { ApiKeyStore } from '@/lib/llmClient';
import { ApiKeyModal } from '@/components/ApiKeyModal';

const emptySubscribe = () => () => {};

const EXAMPLE_GOALS = [
  { emoji: '🩺', label: 'Medical terminology', goal: 'I want to learn basic medical language for effective communication' },
  { emoji: '💊', label: 'Pharmacology basics', goal: 'I want to learn basic medical language and pharmacology for effective communication' },
  { emoji: '🔌', label: 'PCB design from zero', goal: 'I want to learn PCB design from zero and eventually design my own board' },
  { emoji: '🤖', label: 'Machine learning', goal: 'I want to understand machine learning and build my first model' },
  { emoji: '📈', label: 'Options pricing', goal: 'I want to understand options pricing and trading strategies' },
  { emoji: '🦀', label: 'Rust programming', goal: 'I want to learn Rust programming for systems development' },
];

const ARTIFACTS = ['Working prototype', 'Portfolio project', 'Pass a test / certification', 'Personal project', 'Career change', 'Deep understanding'];
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
    <div className="flex flex-col items-center justify-center py-6 sm:py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 border-2 border-black bg-[#FFE600] shadow-[2px_2px_0px_#000000] text-xs font-black uppercase mb-3 rounded">
          <span>🌱</span>
          <span>Adaptive Curriculum Builder</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight mb-3">
          What do you want to learn? 🎯
        </h1>
        <p className="text-sm sm:text-base max-w-md mx-auto font-bold text-neutral-700 leading-relaxed">
          Describe your learning goal. AnyLearn generates a living, adaptive roadmap with real-time concept mastery tracking.
        </p>
      </div>

      {/* Main input card */}
      <div className="w-full brutal-card p-6 sm:p-8 mb-6 bg-white">
        <label
          htmlFor="goal-input"
          className="block text-xs font-black uppercase tracking-wider mb-2.5 text-black"
        >
          Your Learning Goal
        </label>
        <textarea
          id="goal-input"
          className="w-full p-4 resize-none transition-all outline-none border-[3px] border-black rounded shadow-[3px_3px_0px_#000000] focus:shadow-[5px_5px_0px_#000000] text-base font-bold text-black"
          placeholder="e.g. Learn PCB design from zero and design my first custom board…"
          value={goal}
          onChange={e => setGoal(e.target.value)}
          rows={3}
          autoFocus
        />

        {/* Example chips */}
        <div className="mt-5">
          <div className="text-xs font-black uppercase tracking-wider mb-2.5 text-neutral-700 flex items-center gap-1.5">
            <span>✨ Popular topics:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_GOALS.map(eg => {
              const active = goal === eg.goal;
              return (
                <button
                  key={eg.label}
                  type="button"
                  className={`px-3 py-1.5 text-xs font-black border-2 border-black rounded transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]'
                  }`}
                  onClick={() => setGoal(eg.goal)}
                  id={`example-${eg.label.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  <span>{eg.emoji}</span>
                  <span>{eg.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calibration card */}
      <div className="w-full brutal-card p-6 sm:p-8 mb-6 bg-white">
        <div className="text-xs font-black uppercase tracking-wider mb-4 text-black">
          Quick Customization (Optional)
        </div>

        <div className="flex flex-col gap-5">
          {/* End artifact */}
          <div>
            <div className="text-xs font-black mb-2.5 text-black">
              What&apos;s your desired milestone?
            </div>
            <div className="flex flex-wrap gap-2">
              {ARTIFACTS.map(a => {
                const active = artifact === a;
                return (
                  <button
                    key={a}
                    type="button"
                    className={`px-3 py-1.5 text-xs font-black border-2 border-black rounded transition-all cursor-pointer ${
                      active
                        ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]'
                    }`}
                    onClick={() => setArtifact(artifact === a ? '' : a)}
                    id={`artifact-${a.replace(/\s+/g, '-').toLowerCase()}`}
                  >
                    {a}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours */}
          <div>
            <div className="text-xs font-black mb-2.5 flex items-center justify-between text-black">
              <span>Weekly commitment:</span>
              <span className="brutal-badge bg-[#FFE600]">
                {hours} hours / week
              </span>
            </div>
            <div className="flex gap-2.5">
              {HOURS.map(h => {
                const active = hours === h;
                return (
                  <button
                    key={h}
                    type="button"
                    className={`flex-1 py-2 text-xs font-black border-2 border-black rounded transition-all cursor-pointer ${
                      active
                        ? 'bg-black text-white shadow-[2px_2px_0px_#000000]'
                        : 'bg-white hover:bg-neutral-100 shadow-[2px_2px_0px_#000000]'
                    }`}
                    onClick={() => setHours(h)}
                    id={`hours-${h}`}
                  >
                    {h}h
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CTA button */}
      <button
        id="build-course-btn"
        type="button"
        className={`w-full brutal-btn py-4 text-base font-black ${
          canSubmit ? 'brutal-btn-primary' : 'bg-neutral-200 opacity-60 cursor-not-allowed'
        }`}
        onClick={handleStart}
        disabled={!canSubmit}
      >
        <span>Build my learning plan</span>
        <span>🎉</span>
      </button>

      {/* Key management */}
      <div className="text-center mt-5">
        <button
          type="button"
          className="text-xs font-black text-neutral-600 underline hover:text-black cursor-pointer"
          onClick={() => { ApiKeyStore.clear(); setShowModalOverride(true); }}
        >
          🔑 Change API key or Demo settings
        </button>
      </div>
    </div>
  );
}
