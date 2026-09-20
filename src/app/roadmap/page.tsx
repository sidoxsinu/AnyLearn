'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { RoadmapGraph } from '@/components/RoadmapGraph';
import { medicalCourseFixture } from '@/lib/fixture';

const emptySubscribe = () => () => {};

export default function RoadmapPage() {
  const router = useRouter();
  const course = useStore((s) => s.course);
  const learner = useStore((s) => s.learner);
  const setCourse = useStore((s) => s.setCourse);

  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    // If no course loaded, pre-load medical fixture for immediate exploration
    if (mounted && !course) {
      setCourse(medicalCourseFixture);
    }
  }, [mounted, course, setCourse]);

  if (!mounted || !course) {
    return (
      <div className="w-full flex items-center justify-center py-24">
        <div className="spinner" />
      </div>
    );
  }

  // Derive real live data
  const allLessonIDs = course.modules.flatMap((m) => m.lessonIDs);
  const completedIDs = learner.completedLessonIDs || [];
  const nextLessonID = allLessonIDs.find((id) => !completedIDs.includes(id)) || allLessonIDs[0];
  const nextLesson = nextLessonID ? course.lessons[nextLessonID] : null;

  // Real Stats
  const totalLessons = allLessonIDs.length;
  const completedCount = completedIDs.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const masteredCount = Object.values(learner.mastery || {}).filter((m) => m.probability >= 0.7).length;
  const adaptiveUpdatesCount = course.changelog ? course.changelog.length : 0;

  // Selected Lesson Details
  const selectedLesson = selectedID ? course.lessons[selectedID] : null;

  // Filter lessons if searching
  const matchesSearch = (title: string, desc?: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || (desc && desc.toLowerCase().includes(q));
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none pb-12">
      {/* ── 1. Neo-Brutalist Hero Card ─────────────────────────────────────── */}
      <div className="brutal-card p-6 sm:p-8 bg-[#FFE600] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brutal-badge bg-white text-black">
              LIVE COURSE
            </span>
            <span className="brutal-badge bg-[#00F59B] text-black">
              {progressPercent}% COMPLETE
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight leading-tight">
            {course.profile?.topic || course.goal || 'Adaptive Learning Path'}
          </h1>

          <p className="text-sm font-bold text-neutral-800 leading-relaxed">
            {course.goal ? `Goal: ${course.goal}` : 'Adaptive learning path customized to your target domain with AI tutor reinforcement.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {nextLessonID && (
              <button
                type="button"
                onClick={() => router.push(`/lesson/${nextLessonID}`)}
                className="brutal-btn brutal-btn-dark"
              >
                <span>Continue Learning</span>
                <span className="text-base">→</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push('/goal')}
              className="brutal-btn bg-white hover:bg-neutral-100"
            >
              <span>Create New Goal</span>
              <span>🎯</span>
            </button>
          </div>
        </div>

        {/* Hero Visual Stat */}
        <div className="w-full sm:w-auto p-5 border-[3px] border-black bg-white shadow-[4px_4px_0px_#000000] rounded-lg flex flex-col items-center justify-center shrink-0 min-w-[200px] text-center">
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600">
            Current Lesson
          </span>
          <span className="text-base font-black text-black mt-1 line-clamp-2">
            {nextLesson ? nextLesson.title : 'All Lessons Completed!'}
          </span>
          {nextLessonID && (
            <Link
              href={`/lesson/${nextLessonID}`}
              className="mt-3 text-xs font-black text-black underline hover:text-[#8B5CF6]"
            >
              Open Lesson Now ↗
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. Live Store Stats Row (Zero Mock Data) ───────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Stat 1: Total Lessons */}
        <div className="brutal-card p-4 bg-white flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-black">{totalLessons}</span>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-600 mt-1">
            Total Lessons
          </span>
        </div>

        {/* Stat 2: Completed */}
        <div className="brutal-card p-4 bg-[#00F59B] flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-black text-black">{completedCount}</span>
            <span className="text-lg">✓</span>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-black mt-1">
            Completed ({progressPercent}%)
          </span>
        </div>

        {/* Stat 3: Mastered Concepts */}
        <div className="brutal-card p-4 bg-[#E0F2FE] flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-black">{masteredCount}</span>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-700 mt-1">
            Concepts Mastered
          </span>
        </div>

        {/* Stat 4: Adaptive Updates */}
        <div className="brutal-card p-4 bg-[#EDE9FE] flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-black">{adaptiveUpdatesCount}</span>
          <span className="text-xs font-black uppercase tracking-wider text-neutral-700 mt-1">
            Adaptive Updates
          </span>
        </div>
      </div>

      {/* ── 3. Curriculum Controls & View Switcher ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search lessons & concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="brutal-input text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-500 hover:text-black"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Switcher: List vs Graph */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`brutal-btn brutal-btn-sm ${
              viewMode === 'list' ? 'brutal-btn-primary' : 'bg-white'
            }`}
          >
            <span>📋</span>
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`brutal-btn brutal-btn-sm ${
              viewMode === 'graph' ? 'brutal-btn-primary' : 'bg-white'
            }`}
          >
            <span>🌿</span>
            <span>Graph View</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Content: List View or Graph View ──────────────────────── */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-6">
          {course.modules.map((mod, modIdx) => {
            const modLessons = mod.lessonIDs
              .map((id) => course.lessons[id])
              .filter(Boolean)
              .filter((l) => matchesSearch(l.title, l.description));

            if (modLessons.length === 0) return null;

            return (
              <div key={mod.id} className="brutal-card p-5 sm:p-6 bg-white flex flex-col gap-4">
                {/* Module Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-black">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded border-2 border-black bg-[#FFE600] flex items-center justify-center font-black text-sm">
                      {modIdx + 1}
                    </span>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-black">
                        {mod.title}
                      </h2>
                      <p className="text-xs text-neutral-600 font-bold mt-0.5">
                        {modLessons.length} lessons in this module
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lessons Grid in Module */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {modLessons.map((lesson) => {
                    const isCompleted = completedIDs.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        className={`p-4 border-2 border-black rounded transition-all flex flex-col justify-between gap-3 ${
                          isCompleted
                            ? 'bg-[#E6FFFA] shadow-[3px_3px_0px_#000000]'
                            : 'bg-white shadow-[3px_3px_0px_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                        }`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`brutal-badge text-[10px] ${
                                isCompleted
                                  ? 'bg-[#00F59B] text-black'
                                  : lesson.status === 'ready'
                                  ? 'bg-[#E0F2FE] text-black'
                                  : 'bg-neutral-100 text-black'
                              }`}
                            >
                              {isCompleted
                                ? '✓ COMPLETED'
                                : lesson.status === 'ready'
                                ? 'READY'
                                : 'STUB'}
                            </span>

                            {lesson.skippable && (
                              <span className="text-xs font-black text-amber-700 bg-amber-100 border border-black px-1.5 py-0.5 rounded">
                                skip ✓
                              </span>
                            )}
                          </div>

                          <h3 className="font-black text-base text-black leading-snug">
                            {lesson.title}
                          </h3>

                          {lesson.objectives?.[0] && (
                            <p className="text-xs text-neutral-700 font-semibold line-clamp-2">
                              {lesson.objectives[0]}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="pt-2 border-t border-black/10 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => router.push(`/lesson/${lesson.id}`)}
                            className="brutal-btn brutal-btn-sm brutal-btn-primary flex-1"
                          >
                            Open Lesson 🚀
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => router.push(`/quiz/${lesson.id}`)}
                              className="brutal-btn brutal-btn-sm bg-white"
                              title="Re-take Quiz"
                            >
                              Quiz ⏱️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Mode 2: Roadmap Graph View (SVG DAG with all node invariants) ── */
        <div className="brutal-card p-4 sm:p-6 bg-white flex flex-col gap-3 min-h-[550px]">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="text-lg">🌿</span>
              <h2 className="font-black text-base sm:text-lg text-black">
                Interactive Curriculum Dependency Graph (DAG)
              </h2>
            </div>
            <span className="text-xs font-bold text-neutral-600">
              Drag to pan • Click node to inspect
            </span>
          </div>

          <div className="w-full flex-1 overflow-hidden min-h-[480px]">
            <RoadmapGraph
              course={course}
              learner={learner}
              selectedID={selectedID ?? undefined}
              onSelect={(id) => setSelectedID(id === selectedID ? null : id)}
            />
          </div>
        </div>
      )}

      {/* ── 5. Capstone Project Milestone Card (When present) ─────────────── */}
      {course.capstone && (
        <div className="brutal-card p-6 bg-[#EDE9FE] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <span className="brutal-badge bg-black text-white">CAPSTONE MILESTONE</span>
            </div>
            <h3 className="text-xl font-black text-black">
              {course.capstone.title}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-neutral-800 leading-relaxed">
              {course.capstone.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-xs font-black uppercase text-neutral-600">
              Evaluation Criteria
            </span>
            <span className="text-xs font-bold bg-white border-2 border-black px-3 py-1.5 rounded shadow-[2px_2px_0px_#000000]">
              {course.capstone.deliverable || 'Verified Working Implementation'}
            </span>
          </div>
        </div>
      )}

      {/* ── 6. Adaptive Changelog Card (Real updates from store) ──────────── */}
      {course.changelog && course.changelog.length > 0 && (
        <div className="brutal-card p-5 bg-white flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <h3 className="font-black text-sm uppercase tracking-wider text-black">
                Adaptive Changelog ({course.changelog.length} updates)
              </h3>
            </div>
            <span className="text-xs font-bold text-neutral-500">Live Course Adaptation</span>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {course.changelog.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className="p-3 border-2 border-black rounded bg-[#FAF8F5] flex flex-col gap-0.5 text-xs font-semibold"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-black">{entry.summary}</span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-700">{entry.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Slide-Over Lesson Detail Drawer ─────────────────────────────── */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg brutal-card bg-white p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between pb-3 border-b-2 border-black">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                  {course.modules.find((m) => m.id === selectedLesson.moduleID)?.title}
                </span>
                <h2 className="font-black text-xl text-black mt-0.5">
                  {selectedLesson.title}
                </h2>
              </div>
              <button
                className="w-8 h-8 rounded border-2 border-black bg-white hover:bg-black hover:text-white font-black text-sm flex items-center justify-center cursor-pointer transition-colors"
                onClick={() => setSelectedID(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-3 max-h-[60vh]">
              {/* Status pills */}
              <div className="flex flex-wrap gap-2">
                <span className="brutal-badge bg-[#E0F2FE]">
                  {selectedLesson.status === 'ready' ? '✓ Ready' : '◉ Stub'}
                </span>
                <span className="brutal-badge bg-white">
                  {selectedLesson.confidence} confidence
                </span>
                {learner.completedLessonIDs.includes(selectedLesson.id) && (
                  <span className="brutal-badge bg-[#00F59B]">✓ Completed</span>
                )}
              </div>

              {/* Objectives */}
              <div className="p-4 border-2 border-black rounded bg-[#F8F9FA]">
                <span className="text-xs font-black uppercase tracking-wider text-black block mb-2">
                  Learning Objectives
                </span>
                <ul className="flex flex-col gap-1.5 text-xs text-neutral-800 font-bold">
                  {selectedLesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-black">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t-2 border-black flex flex-col gap-2">
              <button
                id={`open-lesson-${selectedLesson.id}`}
                className="brutal-btn brutal-btn-primary w-full"
                onClick={() => router.push(`/lesson/${selectedLesson.id}`)}
              >
                Open Lesson 🚀
              </button>
              {learner.completedLessonIDs.includes(selectedLesson.id) && (
                <button
                  className="brutal-btn bg-white w-full"
                  onClick={() => router.push(`/quiz/${selectedLesson.id}`)}
                >
                  Re-take Quiz ⏱️
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
