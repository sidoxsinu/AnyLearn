'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { RoadmapGraph } from '@/components/RoadmapGraph';
import { MasteryRing } from '@/components/MasteryRing';

export default function RoadmapPage() {
  const router = useRouter();
  const course = useStore(s => s.course);
  const learner = useStore(s => s.learner);
  const [selectedID, setSelectedID] = useState<string | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const reset = useStore(s => s.reset);

  if (!course) {
    router.replace('/goal');
    return null;
  }

  const selectedLesson = selectedID ? course.lessons[selectedID] : null;

  // Overall progress
  const totalLessons = Object.keys(course.lessons).length;
  const completedLessons = learner.completedLessonIDs.length;
  const progressPct = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  // Overall mastery
  const masteryValues = Object.values(learner.mastery).map(r => r.probability);
  const avgMastery = masteryValues.length > 0
    ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length
    : 0;

  // Next best lesson
  const nextLesson = course.modules
    .flatMap(m => m.lessonIDs)
    .map(id => course.lessons[id])
    .filter(l => l && !learner.completedLessonIDs.includes(l.id) && !l.skippable)
    .at(0);

  const recentChanges = course.changelog.filter(e => !e.undone).slice(-5).reverse();

  return (
    <div className="page" style={{ overflow: 'hidden' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">AnyLearn</div>
        <div className="navbar-tabs">
          <button className="nav-tab active">Roadmap</button>
          <button className="nav-tab" onClick={() => router.push('/goal')} style={{ position: 'relative' }}>
            New Course
          </button>
          <button
            id="changelog-btn"
            className="nav-tab"
            onClick={() => setShowChangelog(!showChangelog)}
            style={{ position: 'relative' }}
          >
            Changes
            {recentChanges.length > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, background: 'var(--accent)',
                borderRadius: '50%', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700,
              }}>{recentChanges.length}</span>
            )}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MasteryRing probability={avgMastery} size={36} strokeWidth={3} />
          <button className="btn btn-ghost btn-sm" onClick={() => { reset(); router.replace('/goal'); }}>
            Reset
          </button>
        </div>
      </nav>

      {/* Roadmap canvas */}
      <div className="roadmap-container">
        <RoadmapGraph
          course={course}
          learner={learner}
          selectedID={selectedID ?? undefined}
          onSelect={id => setSelectedID(id === selectedID ? null : id)}
        />

        {/* Goal header */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          maxWidth: 320, pointerEvents: 'none',
        }}>
          <div className="glass" style={{ padding: '10px 14px' }}>
            <div className="text-xs text-dim" style={{ marginBottom: 2 }}>Your goal</div>
            <div className="text-sm" style={{ fontWeight: 500 }}>{course.goal}</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ position: 'absolute', top: 16, right: showChangelog ? 404 : 16 }}>
          <div className="glass" style={{ padding: '10px 14px' }}>
            {[
              { label: 'Not started', color: 'var(--mastery-untouched)' },
              { label: 'In progress', color: 'var(--mastery-ok)' },
              { label: 'Weak', color: 'var(--mastery-weak)' },
              { label: 'Solid', color: 'var(--mastery-solid)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color }} />
                <span className="text-dim">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom rail: progress + next action */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-2)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
            Overall progress — {completedLessons}/{totalLessons} lessons
          </div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {nextLesson && (
          <button
            id="next-lesson-btn"
            className="btn btn-primary"
            onClick={() => router.push(`/lesson/${nextLesson.id}`)}
            style={{ flexShrink: 0 }}
          >
            Next: {nextLesson.title.slice(0, 28)}{nextLesson.title.length > 28 ? '…' : ''} →
          </button>
        )}
      </div>

      {/* Lesson detail panel */}
      {selectedLesson && (
        <div className="panel" style={{ top: 60 }}>
          <div style={{ padding: '20px 20px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div className="text-xs text-muted" style={{ marginBottom: 4 }}>
                  {course.modules.find(m => m.id === selectedLesson.moduleID)?.title}
                </div>
                <h2 className="text-xl" style={{ fontWeight: 700 }}>{selectedLesson.title}</h2>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedID(null)}>✕</button>
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '12px 0' }}>
              <span className={`badge badge-${selectedLesson.status === 'ready' ? 'green' : 'gray'}`}>
                {selectedLesson.status === 'ready' ? '✓ Content ready' : '◉ Stub — generates on open'}
              </span>
              <span className={`badge badge-${selectedLesson.confidence === 'high' ? 'green' : selectedLesson.confidence === 'medium' ? 'blue' : 'amber'}`}>
                {selectedLesson.confidence} confidence
              </span>
              {selectedLesson.skippable && <span className="badge badge-gray">skip ✓ {selectedLesson.skippable.reason}</span>}
              {selectedLesson.unsourced && <span className="badge badge-amber">⚠ unsourced</span>}
              {learner.completedLessonIDs.includes(selectedLesson.id) && <span className="badge badge-green">✓ Completed</span>}
            </div>

            {/* Objectives */}
            <div className="card-sm" style={{ marginBottom: 16 }}>
              <div className="text-xs text-muted" style={{ marginBottom: 8, fontWeight: 600 }}>OBJECTIVES</div>
              {selectedLesson.objectives.map((obj, i) => (
                <div key={i} className="text-sm" style={{ marginBottom: 4 }}>• {obj}</div>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              id={`open-lesson-${selectedLesson.id}`}
              className="btn btn-primary btn-full"
              onClick={() => router.push(`/lesson/${selectedLesson.id}`)}
            >
              Open Lesson →
            </button>
            {learner.completedLessonIDs.includes(selectedLesson.id) && (
              <button
                className="btn btn-secondary btn-full"
                onClick={() => router.push(`/quiz/${selectedLesson.id}`)}
              >
                Re-take Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {/* Changelog panel */}
      {showChangelog && (
        <div className="panel" style={{ top: 60 }}>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="text-xl" style={{ fontWeight: 700 }}>Changelog</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowChangelog(false)}>✕</button>
            </div>
            {course.changelog.length === 0 ? (
              <div className="text-muted text-sm" style={{ textAlign: 'center', padding: 40 }}>
                No changes yet. Complete a quiz to see adaptive updates.
              </div>
            ) : (
              [...course.changelog].reverse().map(entry => (
                <div key={entry.id} className={`changelog-entry ${entry.undone ? 'undone' : ''}`}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className={`badge badge-${entry.source === 'adapt' ? 'blue' : entry.source === 'report' ? 'orange' : 'gray'}`}>
                      {entry.source}
                    </span>
                    <span className="text-xs text-dim">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-sm" style={{ fontWeight: 600, marginBottom: 4 }}>{entry.summary}</div>
                  <div className="text-xs text-muted">{entry.reason}</div>
                  {!entry.undone && entry.inverseOps.length > 0 && (
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ marginTop: 8 }}
                      onClick={() => useStore.getState().undo(entry.id)}
                    >
                      ↩ Undo
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
