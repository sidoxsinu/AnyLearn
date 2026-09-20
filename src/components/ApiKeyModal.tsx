'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ApiKeyStore } from '@/lib/llmClient';
import { useStore } from '@/lib/store';
import { pcbCourseFixture } from '@/lib/fixture';

interface ApiKeyModalProps {
  onReady: () => void;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md p-7 shadow-2xl animate-fadeIn"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 28,
          border: '1px solid #EBECEF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          color: '#0F1117',
        }}
      >
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl text-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: '#E6F5F8', border: '1px solid #C5EBF1' }}
          >
            🌱
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: '#0F1117' }}>
            Welcome to AnyLearn
          </h2>
          <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
            Your personal, adaptive living curriculum
          </p>
        </div>

        {/* Feature highlight */}
        <div
          className="p-4 mb-5"
          style={{
            backgroundColor: '#F8F9FA',
            borderRadius: 20,
            border: '1px solid #EFEFEF',
          }}
        >
          <p className="text-xs leading-relaxed mb-2.5 font-medium" style={{ color: '#4B5563' }}>
            Turn any subject into an interactive learning plan with lessons, quizzes, and real-time concept tracking.
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#D4F6ED', color: '#064E3B' }}
            >
              🩺 Medicine
            </span>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#F2E7FE', color: '#581C87' }}
            >
              💊 Pharmacology
            </span>
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ backgroundColor: '#DCF0FA', color: '#0C4A6E' }}
            >
              🔌 PCB Electronics
            </span>
          </div>
        </div>

        {/* API Key input */}
        <div className="mb-4">
          <label htmlFor="api-key-input" className="block text-xs font-bold mb-1.5" style={{ color: '#374151' }}>
            OpenAI API Key
            <span className="font-normal ml-1.5" style={{ color: '#9CA3AF' }}>
              (Optional for demo preview)
            </span>
          </label>
          <input
            id="api-key-input"
            className="w-full px-3.5 py-2.5 text-sm transition-all outline-none"
            style={{
              backgroundColor: '#F8F9FA',
              color: '#0F1117',
              border: '1.5px solid #E5E7EB',
              borderRadius: 16,
            }}
            type="password"
            placeholder="sk-..."
            value={key}
            onChange={e => { setKey(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
            autoComplete="off"
          />
          {error && (
            <div className="text-xs font-medium mt-1.5 flex items-center gap-1" style={{ color: '#DC2626' }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          <div className="text-[11px] mt-1.5" style={{ color: '#9CA3AF' }}>
            🔒 Stored locally in your browser. Never shared with any third party.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 mt-5">
          <button
            id="save-api-key-btn"
            type="button"
            className="w-full py-3 text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              backgroundColor: !key.trim() || testing ? '#E5E7EB' : '#0F1117',
              color: !key.trim() || testing ? '#9CA3AF' : '#FFFFFF',
              borderRadius: 16,
              cursor: !key.trim() || testing ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
            onClick={handleSave}
            disabled={!key.trim() || testing}
          >
            {testing ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Start with API Key →</span>
            )}
          </button>

          <button
            id="preview-mode-btn"
            type="button"
            className="w-full py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{
              backgroundColor: '#D4F6ED',
              color: '#064E3B',
              border: '1px solid #A7F3D0',
              borderRadius: 16,
            }}
            onClick={handlePreview}
          >
            <span>👁</span>
            <span>Explore Demo Learning Plan (Instant)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
