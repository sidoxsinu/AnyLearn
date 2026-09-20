'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function ReportIndexPage() {
  const router = useRouter();
  const { course, learner } = useStore();

  useEffect(() => {
    const allLessonIDs = course?.modules.flatMap((m) => m.lessonIDs) || [];
    const completedIDs = learner?.completedLessonIDs || [];
    const targetID = allLessonIDs.find((id) => !completedIDs.includes(id)) || allLessonIDs[0];

    if (targetID) {
      router.replace(`/report/${targetID}`);
    } else {
      router.replace('/roadmap');
    }
  }, [course, learner, router]);

  return (
    <div className="w-full flex items-center justify-center py-20">
      <div className="spinner" />
    </div>
  );
}
