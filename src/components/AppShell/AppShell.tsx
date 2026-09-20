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

  // Real progress calculation
  const totalLessons = allLessonIDs.length || 0;
  const completedCount = completedIDs.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen w-full bg-[#F4F0EA] flex flex-col font-sans text-black">
      {/* ── Brutalist Top Navigation Bar ──────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full bg-[#FFFFFF] border-b-[3px] border-black shadow-[0_4px_0px_#000000]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <Link
            href="/roadmap"
            className="flex items-center gap-2 group text-decoration-none select-none shrink-0"
            aria-label="AnyLearn Home"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-[#FFE600] border-[3px] border-black shadow-[3px_3px_0px_#000000] flex items-center justify-center font-black text-xl group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[4px_4px_0px_#000000] transition-all">
              ★
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl sm:text-2xl text-black tracking-tight leading-none">
                AnyLearn
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-black mt-0.5">
                Adaptive LMS
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Real functional pages) */}
          <nav className="hidden md:flex items-center gap-2 font-black text-xs sm:text-sm">
            {/* 1. Roadmap */}
            <Link
              href="/roadmap"
              className={`px-3 py-1.5 border-2 border-black rounded transition-all ${
                isRoadmap
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                  : 'bg-white hover:bg-neutral-100'
              }`}
            >
              🗺️ Roadmap
            </Link>

            {/* 2. Current Lesson */}
            <Link
              href={lessonHref}
              className={`px-3 py-1.5 border-2 border-black rounded transition-all ${
                isLesson
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                  : 'bg-white hover:bg-neutral-100'
              }`}
            >
              📖 Lesson
            </Link>

            {/* 3. Quiz & Practice */}
            <Link
              href={quizHref}
              className={`px-3 py-1.5 border-2 border-black rounded transition-all ${
                isQuiz
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                  : 'bg-white hover:bg-neutral-100'
              }`}
            >
              ⚡ Quiz
            </Link>

            {/* 4. Report */}
            <Link
              href={reportHref}
              className={`px-3 py-1.5 border-2 border-black rounded transition-all ${
                isReport
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                  : 'bg-white hover:bg-neutral-100'
              }`}
            >
              📊 Report
            </Link>

            {/* 5. Goal Intake */}
            <Link
              href="/goal"
              className={`px-3 py-1.5 border-2 border-black rounded transition-all ${
                isGoal
                  ? 'bg-[#FFE600] shadow-[2px_2px_0px_#000000]'
                  : 'bg-white hover:bg-neutral-100'
              }`}
            >
              🎯 New Goal
            </Link>
          </nav>

          {/* Right: Live Progress Pill & Settings Action */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Real Progress Metric Pill */}
            {totalLessons > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#00F59B] border-2 border-black shadow-[2px_2px_0px_#000000] font-black text-xs">
                <span>✓</span>
                <span>
                  {completedCount}/{totalLessons} Done ({progressPercent}%)
                </span>
              </div>
            )}

            {/* Settings Button */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="brutal-btn brutal-btn-sm bg-white hover:bg-[#FFE600]"
              title="Settings & API Key"
              aria-label="Settings"
            >
              <span>⚙️</span>
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around border-t-2 border-black bg-[#FAF8F5] px-2 py-2 text-xs font-black">
          <Link href="/roadmap" className={isRoadmap ? 'underline decoration-2' : ''}>
            🗺️ Roadmap
          </Link>
          <Link href={lessonHref} className={isLesson ? 'underline decoration-2' : ''}>
            📖 Lesson
          </Link>
          <Link href={quizHref} className={isQuiz ? 'underline decoration-2' : ''}>
            ⚡ Quiz
          </Link>
          <Link href={reportHref} className={isReport ? 'underline decoration-2' : ''}>
            📊 Report
          </Link>
          <Link href="/goal" className={isGoal ? 'underline decoration-2' : ''}>
            🎯 Goal
          </Link>
        </div>
      </header>

      {/* ── Main View Container (Natural Scrolling & Zero Overlap) ────────── */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>

      {/* ── Brutalist Footer ──────────────────────────────────────────────── */}
      <footer className="w-full bg-[#FFFFFF] border-t-[3px] border-black py-4 px-6 text-center text-xs font-bold text-neutral-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AnyLearn — Living, Adaptive Learning Path powered by Gemini AI</span>
          <span>Open Source &amp; Privacy-First</span>
        </div>
      </footer>

      {/* Real Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default AppShell;
