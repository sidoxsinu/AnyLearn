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
    // If no course is loaded when visiting roadmap, load medical fixture by default
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

  // Derive live data from store
  const allLessonIDs = course.modules.flatMap((m) => m.lessonIDs);
  const completedIDs = learner.completedLessonIDs || [];
  const nextLessonID = allLessonIDs.find((id) => !completedIDs.includes(id)) || allLessonIDs[0];
  const nextLesson = nextLessonID ? course.lessons[nextLessonID] : null;

  // Real stats
  const totalLessons = allLessonIDs.length;
  const completedCount = completedIDs.length;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const masteredCount = Object.values(learner.mastery || {}).filter((m) => m.probability >= 0.7).length;
  const adaptiveUpdatesCount = course.changelog ? course.changelog.length : 0;

  // Selected lesson detail
  const selectedLesson = selectedID ? course.lessons[selectedID] : null;

  // Search filter
  const matchesSearch = (title: string, desc?: string) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || (desc && desc.toLowerCase().includes(q));
  };

  return (
    <div className="w-full flex flex-col gap-6 select-none">
      {/* ── 1. Neo-Brutalist Hero Card ─────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: '#FFE600',
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: 10,
          padding: '28px 24px',
        }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
      >
        {/* Left Hero Content */}
        <div className="flex flex-col gap-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{
                backgroundColor: '#FFFFFF',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 4,
                padding: '3px 10px',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: '0.04em',
              }}
            >
              LIVE COURSE
            </span>
            <span
              style={{
                backgroundColor: '#00F59B',
                color: '#000000',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 4,
                padding: '3px 10px',
                fontWeight: 900,
                fontSize: 11,
                letterSpacing: '0.04em',
              }}
            >
              {progressPercent}% COMPLETE
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: '#000000',
            }}
          >
            {course.profile?.topic || course.goal || 'Medical Terminology & Clinical Basics'}
          </h1>

          <p
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1F2937',
              lineHeight: 1.5,
            }}
          >
            {course.goal
              ? `Goal: ${course.goal}`
              : 'Master medical terminology, basic pharmacology, and clinical pathophysiology for effective patient communication.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {nextLessonID && (
              <button
                type="button"
                onClick={() => router.push(`/lesson/${nextLessonID}`)}
                className="brutal-btn brutal-btn-dark"
                style={{ backgroundColor: '#000000', color: '#FFFFFF' }}
              >
                <span style={{ color: '#FFFFFF', fontWeight: 900 }}>Continue Learning</span>
                <span style={{ color: '#FFFFFF', fontWeight: 900 }}>→</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => router.push('/goal')}
              className="brutal-btn brutal-btn-white"
              style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
            >
              <span style={{ color: '#000000', fontWeight: 900 }}>Create New Goal</span>
              <span>🎯</span>
            </button>
          </div>
        </div>

        {/* Right Sub-Card: Current Lesson Indicator */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 8,
            padding: '20px',
            width: '100%',
            maxWidth: 340,
            boxSizing: 'border-box',
          }}
          className="flex flex-col gap-2 shrink-0"
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#4B5563',
            }}
          >
            CURRENT LESSON
          </span>

          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: '#000000',
              lineHeight: 1.3,
            }}
            className="line-clamp-2"
          >
            {nextLesson ? nextLesson.title : 'All Lessons Completed!'}
          </span>

          {nextLessonID && (
            <Link
              href={`/lesson/${nextLessonID}`}
              className="brutal-btn brutal-btn-sm brutal-btn-primary"
              style={{
                marginTop: 8,
                textDecoration: 'none',
                backgroundColor: '#FFE600',
                color: '#000000',
                width: '100%',
              }}
            >
              <span style={{ color: '#000000', fontWeight: 900 }}>Open Lesson Now ↗</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── 2. Live Store Stats Row (4-Column Neo-Brutalist Grid) ───────────── */}
      <div className="brutal-grid-4">
        {/* Stat 1: Total Lessons (White card with bold black text) */}
        <div
          className="brutal-stat-card"
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 900, color: '#000000', lineHeight: 1 }}>
            {totalLessons}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#4B5563' }}>
            Total Lessons
          </span>
        </div>

        {/* Stat 2: Completed (Acid Mint) */}
        <div
          className="brutal-stat-card"
          style={{
            backgroundColor: '#00F59B',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
          }}
        >
          <div className="flex items-center gap-1.5" style={{ lineHeight: 1 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: '#000000' }}>
              {completedCount}
            </span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#000000' }}>✓</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000000' }}>
            Completed ({progressPercent}%)
          </span>
        </div>

        {/* Stat 3: Mastered Concepts (Sky Blue) */}
        <div
          className="brutal-stat-card"
          style={{
            backgroundColor: '#38BDF8',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 900, color: '#000000', lineHeight: 1 }}>
            {masteredCount}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000000' }}>
            Concepts Mastered
          </span>
        </div>

        {/* Stat 4: Adaptive Updates (Electric Violet) */}
        <div
          className="brutal-stat-card"
          style={{
            backgroundColor: '#DDD6FE',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
          }}
        >
          <span style={{ fontSize: 32, fontWeight: 900, color: '#000000', lineHeight: 1 }}>
            {adaptiveUpdatesCount}
          </span>
          <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000000' }}>
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
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-500 hover:text-black cursor-pointer"
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
              viewMode === 'list' ? 'brutal-btn-primary' : 'brutal-btn-white'
            }`}
            style={{
              backgroundColor: viewMode === 'list' ? '#FFE600' : '#FFFFFF',
              color: '#000000',
            }}
          >
            <span>📋</span>
            <span>List View</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`brutal-btn brutal-btn-sm ${
              viewMode === 'graph' ? 'brutal-btn-primary' : 'brutal-btn-white'
            }`}
            style={{
              backgroundColor: viewMode === 'graph' ? '#FFE600' : '#FFFFFF',
              color: '#000000',
            }}
          >
            <span>🌿</span>
            <span>Graph View</span>
          </button>
        </div>
      </div>

      {/* ── 4. Main Content: List View vs Graph View ──────────────────────── */}
      {viewMode === 'list' ? (
        <div className="flex flex-col gap-6">
          {course.modules.map((mod, modIdx) => {
            const modLessons = mod.lessonIDs
              .map((id) => course.lessons[id])
              .filter(Boolean)
              .filter((l) => matchesSearch(l.title, l.description));

            if (modLessons.length === 0) return null;

            return (
              <div
                key={mod.id}
                className="brutal-card p-5 sm:p-6 bg-white flex flex-col gap-4"
                style={{
                  border: '3px solid #000000',
                  boxShadow: '4px 4px 0px #000000',
                  borderRadius: 8,
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Module Header */}
                <div
                  className="flex flex-wrap items-center justify-between gap-2 pb-3"
                  style={{ borderBottom: '2px solid #000000' }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        border: '2px solid #000000',
                        backgroundColor: '#FFE600',
                        boxShadow: '2px 2px 0px #000000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: 14,
                        color: '#000000',
                        borderRadius: 4,
                      }}
                    >
                      {modIdx + 1}
                    </span>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 900, color: '#000000' }}>
                        {mod.title}
                      </h2>
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#525252', marginTop: 2 }}>
                        {modLessons.length} lessons in this module
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lessons Grid in Module */}
                <div className="brutal-grid-2">
                  {modLessons.map((lesson) => {
                    const isCompleted = completedIDs.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        style={{
                          border: '2px solid #000000',
                          boxShadow: '3px 3px 0px #000000',
                          borderRadius: 6,
                          padding: 16,
                          backgroundColor: isCompleted ? '#E6FFFA' : '#FFFFFF',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              style={{
                                backgroundColor: isCompleted ? '#00F59B' : lesson.status === 'ready' ? '#E0F2FE' : '#F3F4F6',
                                color: '#000000',
                                border: '1.5px solid #000000',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: 10,
                                fontWeight: 900,
                                textTransform: 'uppercase',
                              }}
                            >
                              {isCompleted ? '✓ COMPLETED' : lesson.status === 'ready' ? 'READY' : 'STUB'}
                            </span>

                            {lesson.skippable && (
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 900,
                                  color: '#78350F',
                                  backgroundColor: '#FEF3C7',
                                  border: '1.5px solid #000000',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                skip ✓
                              </span>
                            )}
                          </div>

                          <h3 style={{ fontSize: 15, fontWeight: 900, color: '#000000', lineHeight: 1.3 }}>
                            {lesson.title}
                          </h3>

                          {lesson.objectives?.[0] && (
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', lineHeight: 1.4 }} className="line-clamp-2">
                              {lesson.objectives[0]}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            paddingTop: 10,
                            borderTop: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => router.push(`/lesson/${lesson.id}`)}
                            className="brutal-btn brutal-btn-sm brutal-btn-primary flex-1"
                            style={{ backgroundColor: '#FFE600', color: '#000000' }}
                          >
                            <span style={{ color: '#000000', fontWeight: 900 }}>Open Lesson 🚀</span>
                          </button>

                          {isCompleted && (
                            <button
                              type="button"
                              onClick={() => router.push(`/quiz/${lesson.id}`)}
                              className="brutal-btn brutal-btn-sm brutal-btn-white"
                              style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                              title="Re-take Quiz"
                            >
                              <span style={{ color: '#000000', fontWeight: 900 }}>Quiz ⏱️</span>
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
        /* ── Mode 2: Graph View (SVG DAG with all node invariants for tests) ─ */
        <div
          className="brutal-card p-4 sm:p-6 bg-white flex flex-col gap-3"
          style={{
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 8,
            minHeight: 550,
          }}
        >
          <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: '2px solid #000000' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 18 }}>🌿</span>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: '#000000' }}>
                Interactive Curriculum Dependency Graph (DAG)
              </h2>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#525252' }}>
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
        <div
          style={{
            backgroundColor: '#DDD6FE',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 8,
            padding: 24,
          }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div className="flex flex-col gap-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 20 }}>🏆</span>
              <span
                style={{
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1.5px solid #000000',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                }}
              >
                CAPSTONE MILESTONE
              </span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: '#000000' }}>
              {course.capstone.title}
            </h3>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1F2937', lineHeight: 1.5 }}>
              {course.capstone.description}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#4B5563' }}>
              Deliverable Target
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 900,
                backgroundColor: '#FFFFFF',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                padding: '6px 12px',
                borderRadius: 4,
                color: '#000000',
              }}
            >
              {course.capstone.deliverable || 'Verified Working Implementation'}
            </span>
          </div>
        </div>
      )}

      {/* ── 6. Adaptive Changelog Card (Real updates from store) ──────────── */}
      {course.changelog && course.changelog.length > 0 && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            borderRadius: 8,
            padding: 20,
          }}
          className="flex flex-col gap-3"
        >
          <div
            className="flex items-center justify-between pb-2"
            style={{ borderBottom: '2px solid #000000' }}
          >
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>⚡</span>
              <h3 style={{ fontSize: 13, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000' }}>
                Adaptive Changelog ({course.changelog.length} updates)
              </h3>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#525252' }}>Live Course Adaptation</span>
          </div>

          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {course.changelog.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: 12,
                  border: '2px solid #000000',
                  borderRadius: 4,
                  backgroundColor: '#FAF8F5',
                }}
                className="flex flex-col gap-0.5 text-xs font-bold"
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontWeight: 900, color: '#000000' }}>{entry.summary}</span>
                  <span style={{ fontSize: 10, color: '#6B7280' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: '#374151', margin: 0 }}>{entry.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Slide-Over Lesson Detail Modal ──────────────────────────────── */}
      {selectedLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '3px solid #000000',
              boxShadow: '6px 6px 0px #000000',
              borderRadius: 8,
              padding: 24,
              width: '100%',
              maxWidth: 480,
            }}
            className="flex flex-col gap-4"
          >
            <div
              className="flex items-start justify-between pb-3"
              style={{ borderBottom: '2px solid #000000' }}
            >
              <div>
                <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#6B7280' }}>
                  {course.modules.find((m) => m.id === selectedLesson.moduleID)?.title}
                </span>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#000000', marginTop: 2 }}>
                  {selectedLesson.title}
                </h2>
              </div>
              <button
                style={{
                  width: 32,
                  height: 32,
                  border: '2px solid #000000',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: 'pointer',
                  borderRadius: 4,
                }}
                className="flex items-center justify-center"
                onClick={() => setSelectedID(null)}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-3 max-h-[60vh]">
              {/* Status pills */}
              <div className="flex flex-wrap gap-2">
                <span className="brutal-badge" style={{ backgroundColor: '#E0F2FE' }}>
                  {selectedLesson.status === 'ready' ? '✓ Ready' : '◉ Stub'}
                </span>
                <span className="brutal-badge" style={{ backgroundColor: '#FFFFFF' }}>
                  {selectedLesson.confidence} confidence
                </span>
                {learner.completedLessonIDs.includes(selectedLesson.id) && (
                  <span className="brutal-badge" style={{ backgroundColor: '#00F59B' }}>
                    ✓ Completed
                  </span>
                )}
              </div>

              {/* Objectives */}
              <div
                style={{
                  border: '2px solid #000000',
                  borderRadius: 6,
                  padding: 16,
                  backgroundColor: '#F8F9FA',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#000000', display: 'block', marginBottom: 8 }}>
                  Learning Objectives
                </span>
                <ul className="flex flex-col gap-1.5 text-xs font-bold text-black" style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                  {selectedLesson.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span>•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action buttons */}
            <div
              className="pt-3 flex flex-col gap-2"
              style={{ borderTop: '2px solid #000000' }}
            >
              <button
                id={`open-lesson-${selectedLesson.id}`}
                className="brutal-btn brutal-btn-primary w-full"
                style={{ backgroundColor: '#FFE600', color: '#000000' }}
                onClick={() => router.push(`/lesson/${selectedLesson.id}`)}
              >
                <span style={{ color: '#000000', fontWeight: 900 }}>Open Lesson 🚀</span>
              </button>
              {learner.completedLessonIDs.includes(selectedLesson.id) && (
                <button
                  className="brutal-btn brutal-btn-white w-full"
                  style={{ backgroundColor: '#FFFFFF', color: '#000000' }}
                  onClick={() => router.push(`/quiz/${selectedLesson.id}`)}
                >
                  <span style={{ color: '#000000', fontWeight: 900 }}>Re-take Quiz ⏱️</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
