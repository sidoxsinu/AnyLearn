'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { SettingsModal } from './SettingsModal';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/roadmap';
  const { course, learner } = useStore();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Derive real next lesson ID from the active course and learner state
  const allLessonIDs = course?.modules.flatMap((m) => m.lessonIDs) || [];
  const completedIDs = learner?.completedLessonIDs || [];
  const nextLessonID = allLessonIDs.find((id) => !completedIDs.includes(id)) || allLessonIDs[0];

  const lessonHref = nextLessonID ? `/lesson/${nextLessonID}` : '/roadmap';
  const quizHref = nextLessonID ? `/quiz/${nextLessonID}` : '/roadmap';
  const reportHref = nextLessonID ? `/report/${nextLessonID}` : '/report';

  const isRoadmap = pathname === '/' || pathname === '/roadmap';
  const isLesson = pathname.startsWith('/lesson');
  const isQuiz = pathname.startsWith('/quiz');
  const isReport = pathname.startsWith('/report');
  const isGoal = pathname === '/goal';

  // Real progress metrics
  const totalLessons = allLessonIDs.length || 0;
  const completedCount = completedIDs.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div
      className="min-h-screen w-full flex flex-col font-sans"
      style={{ backgroundColor: '#F4F0EA', color: '#000000' }}
    >
      {/* ── Brutalist Top Navigation Header ───────────────────────────────── */}
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '3px solid #000000',
          boxShadow: '0 4px 0px #000000',
        }}
      >
        <div
          style={{ maxWidth: 1140, margin: '0 auto' }}
          className="px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3"
        >
          {/* Brand Wordmark with Electric Yellow Star Box */}
          <Link
            href="/roadmap"
            className="flex items-center gap-2.5 select-none shrink-0"
            style={{ textDecoration: 'none' }}
            aria-label="AnyLearn Home"
          >
            <div
              style={{
                width: 42,
                height: 42,
                backgroundColor: '#FFE600',
                border: '3px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 22,
                color: '#000000',
              }}
            >
              ★
            </div>
            <div className="flex flex-col">
              <span
                style={{
                  fontWeight: 900,
                  fontSize: 22,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                  color: '#000000',
                }}
              >
                AnyLearn
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#000000',
                  marginTop: 2,
                }}
              >
                Adaptive LMS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Real functional routes) */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/roadmap"
              className={`brutal-nav-link ${isRoadmap ? 'active' : ''}`}
            >
              🗺️ Roadmap
            </Link>

            <Link
              href={lessonHref}
              className={`brutal-nav-link ${isLesson ? 'active' : ''}`}
            >
              📖 Lesson
            </Link>

            <Link
              href={quizHref}
              className={`brutal-nav-link ${isQuiz ? 'active' : ''}`}
            >
              ⚡ Quiz
            </Link>

            <Link
              href={reportHref}
              className={`brutal-nav-link ${isReport ? 'active' : ''}`}
            >
              📊 Report
            </Link>

            <Link
              href="/goal"
              className={`brutal-nav-link ${isGoal ? 'active' : ''}`}
            >
              🎯 New Goal
            </Link>
          </nav>

          {/* Right: Live Progress Pill & Settings Action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real Progress Metric Pill */}
            {totalLessons > 0 && (
              <div
                style={{
                  backgroundColor: '#00F59B',
                  border: '2px solid #000000',
                  boxShadow: '2px 2px 0px #000000',
                  padding: '6px 12px',
                  fontWeight: 900,
                  fontSize: 12,
                  color: '#000000',
                  borderRadius: 4,
                }}
                className="hidden sm:flex items-center gap-1.5"
              >
                <span>✓</span>
                <span>
                  {completedCount}/{totalLessons} ({progressPercent}%)
                </span>
              </div>
            )}

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="brutal-btn brutal-btn-sm brutal-btn-white"
              title="Settings & API Key"
              aria-label="Settings"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Links Row */}
        <div
          className="flex md:hidden items-center justify-around px-2 py-2"
          style={{
            borderTop: '2px solid #000000',
            backgroundColor: '#FAF8F5',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          <Link
            href="/roadmap"
            style={{
              textDecoration: isRoadmap ? 'underline' : 'none',
              textDecorationThickness: 2,
              color: '#000000',
            }}
          >
            🗺️ Roadmap
          </Link>
          <Link
            href={lessonHref}
            style={{
              textDecoration: isLesson ? 'underline' : 'none',
              textDecorationThickness: 2,
              color: '#000000',
            }}
          >
            📖 Lesson
          </Link>
          <Link
            href={quizHref}
            style={{
              textDecoration: isQuiz ? 'underline' : 'none',
              textDecorationThickness: 2,
              color: '#000000',
            }}
          >
            ⚡ Quiz
          </Link>
          <Link
            href={reportHref}
            style={{
              textDecoration: isReport ? 'underline' : 'none',
              textDecorationThickness: 2,
              color: '#000000',
            }}
          >
            📊 Report
          </Link>
          <Link
            href="/goal"
            style={{
              textDecoration: isGoal ? 'underline' : 'none',
              textDecorationThickness: 2,
              color: '#000000',
            }}
          >
            🎯 Goal
          </Link>
        </div>
      </header>

      {/* ── Main View Container (Natural Scrolling, Responsive, No Overlapping) */}
      <main
        style={{
          maxWidth: 1140,
          margin: '0 auto',
          padding: '24px 16px 48px 16px',
          width: '100%',
          boxSizing: 'border-box',
        }}
        className="flex-1 flex flex-col"
      >
        {children}
      </main>

      {/* ── Brutalist Footer ──────────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: '#FFFFFF',
          borderTop: '3px solid #000000',
          padding: '16px 24px',
          fontSize: 12,
          fontWeight: 800,
          color: '#000000',
        }}
        className="w-full text-center"
      >
        <div
          style={{ maxWidth: 1140, margin: '0 auto' }}
          className="flex flex-col sm:flex-row items-center justify-between gap-2"
        >
          <span>AnyLearn — Living, Adaptive Learning Path powered by Gemini AI</span>
          <span>Zero Mock Data • 100% Verified State</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default AppShell;
