'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiKeyStore } from '@/lib/llmClient';
import { useStore } from '@/lib/store';
import { pcbCourseFixture } from '@/lib/fixture';

interface ApiKeyModalProps {
  onReady: () => void;
}

const EXAMPLE_TOPICS = [
  'PCB design from zero',
  'Options pricing & trading',
  'Rust programming',
  'Machine learning fundamentals',
  'Beekeeping for beginners',
  'Japanese for travelers',
];

export function ApiKeyModal({ onReady }: ApiKeyModalProps) {
  const router = useRouter();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    const trimmed = key.trim();
    // OpenAI keys start with sk- and are long; Gemini keys start with AIza
    if (trimmed.length < 10 || (!trimmed.startsWith('sk-') && !trimmed.startsWith('AIza'))) {
      setError('Invalid API key format. OpenAI keys start with sk-');
      return;
    }
    setTesting(true);
    setError('');
    try {
      // Quick validation call against OpenAI models endpoint
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      if (res.status === 401 || res.status === 403) {
        setError('Invalid API key. Please check and try again.');
        setTesting(false);
        return;
      }
      ApiKeyStore.set(trimmed);
      onReady();
    } catch {
      setError('Could not reach OpenAI API. Check your internet connection.');
    }
    setTesting(false);
  };

  const handlePreview = () => {
    localStorage.setItem('anylearn-demo-mode', 'true');
    // Load fixture for demo
    if (pcbCourseFixture) {
      useStore.getState().setCourse(pcbCourseFixture);
    }
    onReady();
    router.push('/roadmap');
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-springin" style={{ maxWidth: 520 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56, height: 56,
            borderRadius: 16,
            background: 'rgba(249,115,22,0.12)',
            border: '1px solid rgba(249,115,22,0.3)',
            fontSize: 26,
            marginBottom: 12,
          }}>🧠</div>
          <div className="text-3xl" style={{ marginBottom: 6 }}>AnyLearn</div>
          <div className="text-sm text-muted">Your living, adaptive learning environment</div>
        </div>

        {/* What it does */}
        <div className="card-sm" style={{ marginBottom: 24, background: 'rgba(249,115,22,0.04)', borderColor: 'rgba(249,115,22,0.15)' }}>
          <div className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
            Enter any learning goal → get a personalized roadmap, lessons, quizzes, and resources — all adapting to your understanding in real-time.
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {EXAMPLE_TOPICS.slice(0, 3).map(t => (
              <span key={t} className="badge badge-orange">{t}</span>
            ))}
          </div>
        </div>

        {/* API Key input */}
        <div style={{ marginBottom: 8 }}>
          <label className="text-sm" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
            OpenAI API Key
            <span className="text-dim" style={{ fontWeight: 400, marginLeft: 6 }}>
              — get yours at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="text-accent"
              >
                platform.openai.com
              </a>
            </span>
          </label>
          <input
            id="api-key-input"
            className="input"
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            autoComplete="off"
          />
          {error && (
            <div className="text-sm" style={{ color: '#f87171', marginTop: 6 }}>
              ⚠ {error}
            </div>
          )}
          <div className="text-xs text-dim" style={{ marginTop: 6 }}>
            Your key is stored only in your browser&apos;s localStorage. Never sent to our servers.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
          <button
            id="save-api-key-btn"
            className="btn btn-primary btn-lg btn-full"
            onClick={handleSave}
            disabled={!key.trim() || testing}
          >
            {testing ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Verifying…</>
            ) : (
              '→ Start Learning'
            )}
          </button>
          <button
            id="preview-mode-btn"
            className="btn btn-ghost btn-full"
            onClick={handlePreview}
            style={{ fontSize: 13 }}
          >
            👁 Preview with PCB Design demo (no key needed)
          </button>
        </div>
      </div>
    </div>
  );
}
