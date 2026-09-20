'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { medicalCourseFixture, pcbCourseFixture } from '@/lib/fixture';
import { ApiKeyStore } from '@/lib/llmClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { setCourse, reset } = useStore();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedKey, setSavedKey] = useState(ApiKeyStore.get() || '');
  const [keyNotice, setKeyNotice] = useState('');

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) return;
    ApiKeyStore.set(apiKeyInput.trim());
    setSavedKey(apiKeyInput.trim());
    setApiKeyInput('');
    setKeyNotice('API Key saved!');
    setTimeout(() => setKeyNotice(''), 3000);
  };

  const handleClearKey = () => {
    ApiKeyStore.clear();
    setSavedKey('');
    setKeyNotice('API Key removed.');
    setTimeout(() => setKeyNotice(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-md brutal-card p-6 flex flex-col gap-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚙️</span>
            <h2 className="font-black text-xl text-black">Settings &amp; Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded border-2 border-black bg-white hover:bg-black hover:text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Gemini API Key */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">
            Gemini API Key
          </span>
          <p className="text-xs text-neutral-700 font-semibold leading-relaxed">
            Required for on-the-fly lesson content generation and AI adaptive reasoning.
          </p>

          {savedKey ? (
            <div className="flex items-center justify-between p-3 border-2 border-black bg-[#E0F2FE] text-xs font-bold">
              <span>✓ Key set ({savedKey.slice(0, 6)}…)</span>
              <button
                type="button"
                onClick={handleClearKey}
                className="text-red-700 underline font-black cursor-pointer hover:text-red-900"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste Gemini API Key..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 brutal-input text-xs"
              />
              <button
                type="button"
                onClick={handleSaveKey}
                className="brutal-btn brutal-btn-primary brutal-btn-sm"
              >
                Save
              </button>
            </div>
          )}
          {keyNotice && <p className="text-xs text-green-700 font-black">{keyNotice}</p>}
        </div>

        {/* Switch Course Fixture */}
        <div className="flex flex-col gap-2 pt-3 border-t-2 border-black">
          <span className="text-xs font-black uppercase tracking-wider text-black">
            Switch Course
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCourse(medicalCourseFixture);
                if (typeof window !== 'undefined') localStorage.setItem('anylearn-demo-mode', 'true');
                onClose();
              }}
              className="brutal-btn brutal-btn-sm bg-white hover:bg-[#FFE600] flex items-center justify-center gap-1.5"
            >
              <span>🩺</span>
              <span>Medical Terminology</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCourse(pcbCourseFixture);
                if (typeof window !== 'undefined') localStorage.setItem('anylearn-demo-mode', 'true');
                onClose();
              }}
              className="brutal-btn brutal-btn-sm bg-white hover:bg-[#38BDF8] flex items-center justify-center gap-1.5"
            >
              <span>🔌</span>
              <span>PCB Design</span>
            </button>
          </div>
        </div>

        {/* Guided Onboarding Tour Replay */}
        <div className="pt-3 border-t-2 border-black flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-black">
            Guided Onboarding Tour
          </span>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('start-anylearn-tour'));
              }
            }}
            className="brutal-btn brutal-btn-sm brutal-btn-primary flex items-center justify-center gap-2"
          >
            <span>❓</span>
            <span>Launch Interactive Tour</span>
          </button>
        </div>

        {/* Reset Course Progress */}
        <div className="pt-3 border-t-2 border-black flex flex-col gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-red-600">
            Reset Progress
          </span>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset your current course progress and return to goal intake?')) {
                reset();
                onClose();
                router.push('/goal');
              }
            }}
            className="brutal-btn brutal-btn-sm bg-red-100 hover:bg-red-500 hover:text-white border-2 border-black text-red-900 font-black"
          >
            Reset Progress &amp; Create New Goal
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
