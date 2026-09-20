'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FluentEmoji } from '@/components/FluentEmoji';

export function FloatingToolbar() {
  const { course, learner } = useStore();

  // Determine active lesson and quiz targets
  const completedLessonIDs = learner?.completedLessonIDs ?? [];
  const allLessonIDs = course
    ? course.modules.flatMap((m) => m.lessonIDs).filter((id) => Boolean(course.lessons[id]))
    : [];
  const fallbackLessonIDs = course ? Object.keys(course.lessons) : [];
  const lessonSequence = allLessonIDs.length > 0 ? allLessonIDs : fallbackLessonIDs;

  const targetLessonID =
    lessonSequence.find((id) => !completedLessonIDs.includes(id)) ||
    lessonSequence[0];

  const lessonHref = targetLessonID ? `/lesson/${targetLessonID}` : '/roadmap';
  const quizHref = targetLessonID ? `/quiz/${targetLessonID}` : '/roadmap';
  const reportHref = targetLessonID ? `/report/${targetLessonID}` : '/roadmap';

  return (
    <nav
      aria-label="Quick Actions Floating Toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl border border-white/15 px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-toolbar flex items-center gap-2 md:gap-3"
    >
      {/* 1. Lavender: Roadmap View */}
      <Link
        href="/roadmap"
        aria-label="View Roadmap"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-lavender text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <FluentEmoji emoji="🗺️" size={20} />
      </Link>

      {/* 2. Sky: Continue Lesson */}
      <Link
        href={lessonHref}
        aria-label="Continue Current Lesson"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-sky text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <FluentEmoji emoji="📚" size={20} />
      </Link>

      {/* 3. Pink: Practice Quiz */}
      <Link
        href={quizHref}
        aria-label="Take Practice Quiz"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-pink text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <FluentEmoji emoji="🧠" size={20} />
      </Link>

      {/* 4. Butter: Mastery Overview */}
      <Link
        href="/roadmap"
        aria-label="View Mastery Progress"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-butter text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <FluentEmoji emoji="🎯" size={20} />
      </Link>

      {/* 5. Mint: Adaptive Changelog / Patch */}
      <Link
        href={reportHref}
        aria-label="Adaptive Course Changelog"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-mint text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-transform shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <FluentEmoji emoji="🔧" size={20} />
      </Link>

      {/* 6. Dark "+": Create New Goal */}
      <Link
        href="/goal"
        aria-label="Create New Course"
        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-black text-white border border-white/20 flex items-center justify-center font-bold text-xl hover:bg-white hover:text-black hover:scale-110 active:scale-95 transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span>+</span>
      </Link>
    </nav>
  );
}

export default FloatingToolbar;
