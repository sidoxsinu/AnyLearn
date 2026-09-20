'use client';

import React from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FluentEmoji } from '@/components/FluentEmoji';

export function SecondaryPanel() {
  const { course, learner } = useStore();

  const completedLessonIDs = learner?.completedLessonIDs ?? [];
  const completedCount = completedLessonIDs.length;

  const totalLessons = course
    ? (course.modules?.reduce((acc, m) => acc + m.lessonIDs.length, 0) || Object.keys(course.lessons || {}).length)
    : 0;
  const upcomingCount = Math.max(0, totalLessons - completedCount);

  // Find next uncompleted lesson in curriculum order
  const nextLessonID = course?.modules
    .flatMap((m) => m.lessonIDs)
    .find((id) => !completedLessonIDs.includes(id));

  const nextLesson = (course && nextLessonID)
    ? course.lessons[nextLessonID]
    : course
    ? Object.values(course.lessons).find((l) => !completedLessonIDs.includes(l.id))
    : undefined;

  return (
    <aside
      className="hidden lg:flex flex-col w-80 xl:w-96 bg-grey text-black rounded-[28px] lg:rounded-panel p-6 overflow-y-auto border border-black/5 shrink-0 select-none"
      aria-label="Course Overview and Progress"
    >
      {/* Header section */}
      <div className="flex items-center justify-between pb-4 border-b border-black/5">
        <div className="flex items-center gap-2">
          <FluentEmoji emoji="📊" size={20} />
          <h2 className="font-bold text-base tracking-tight">Active Overview</h2>
        </div>
        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-mint text-black">
          {totalLessons > 0 ? `${Math.round((completedCount / totalLessons) * 100)}% Done` : 'Ready'}
        </span>
      </div>

      {course ? (
        <div className="mt-5 flex flex-col gap-5">
          {/* Active Course Card */}
          <div className="bg-white rounded-2xl p-4 shadow-dei-card border border-black/5">
            <span className="text-xs font-semibold text-black/60 uppercase tracking-wider">Current Goal</span>
            <h3 className="text-base font-extrabold mt-1 text-black leading-snug">
              {course.profile?.topic || 'Current Course'}
            </h3>
            <p className="text-xs text-black/70 mt-1 line-clamp-2">{course.goal}</p>
          </div>

          {/* Stat Trio */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded-2xl p-3 text-center border border-black/5 shadow-dei-card">
              <span className="text-lg font-black text-black block">{totalLessons}</span>
              <span className="text-[11px] font-semibold text-black/60 block">Total</span>
            </div>
            <div className="bg-mint rounded-2xl p-3 text-center border border-black/5 shadow-dei-card">
              <span className="text-lg font-black text-black block">{completedCount}</span>
              <span className="text-[11px] font-semibold text-black block">Done 👏</span>
            </div>
            <div className="bg-butter rounded-2xl p-3 text-center border border-black/5 shadow-dei-card">
              <span className="text-lg font-black text-black block">{upcomingCount}</span>
              <span className="text-[11px] font-semibold text-black block">Next ⏱️</span>
            </div>
          </div>

          {/* Next Lesson Quick Launch */}
          {nextLesson ? (
            <div className="bg-sky rounded-2xl p-4 border border-black/5 shadow-dei-card">
              <div className="flex items-center gap-2 text-xs font-bold text-black/70">
                <FluentEmoji emoji="🎯" size={14} />
                <span>RECOMMENDED NEXT</span>
              </div>
              <p className="font-extrabold text-sm text-black mt-1.5">{nextLesson.title}</p>
              <Link
                href={`/lesson/${nextLesson.id}`}
                aria-label={`Continue lesson: ${nextLesson.title}`}
                className="mt-3 inline-flex items-center justify-center w-full py-2 px-3 rounded-full bg-black text-white text-xs font-bold hover:scale-105 active:scale-95 transition-transform"
              >
                Continue Lesson 🚀
              </Link>
            </div>
          ) : (
            <div className="bg-mint rounded-2xl p-4 border border-black/5 shadow-dei-card text-center">
              <FluentEmoji emoji="🎉" size={32} />
              <p className="font-extrabold text-sm text-black mt-2">All Lessons Completed!</p>
              <p className="text-xs text-black/70 mt-1">Great job mastering this curriculum.</p>
            </div>
          )}

          {/* Concept mastery summary */}
          <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-dei-card">
            <div className="flex items-center justify-between text-xs font-bold text-black/80">
              <span className="flex items-center gap-1.5">
                <FluentEmoji emoji="🧠" size={14} />
                <span>Knowledge Tracking</span>
              </span>
              <span>{course.concepts.length} Concepts</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {course.concepts.slice(0, 6).map((concept) => (
                <span
                  key={concept.id}
                  className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-grey text-black border border-black/5"
                >
                  {concept.name}
                </span>
              ))}
              {course.concepts.length > 6 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium text-black/50">
                  +{course.concepts.length - 6} more
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center text-center p-4">
          <FluentEmoji emoji="🎯" size={40} />
          <h3 className="font-bold text-sm text-black mt-3">No Course Selected</h3>
          <p className="text-xs text-black/60 mt-1">Set a learning goal to generate your personalized path.</p>
          <Link
            href="/goal"
            aria-label="Set a new goal"
            className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold rounded-full hover:scale-105 transition-transform"
          >
            Create Goal 🚀
          </Link>
        </div>
      )}
    </aside>
  );
}

export default SecondaryPanel;
