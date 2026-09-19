'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ApiKeyStore } from '@/lib/llmClient';

export default function RootPage() {
  const router = useRouter();
  const course = useStore(s => s.course);

  useEffect(() => {
    // Small delay to let zustand hydrate from localStorage
    const t = setTimeout(() => {
      if (course) {
        router.replace('/roadmap');
      } else {
        router.replace('/goal');
      }
    }, 100);
    return () => clearTimeout(t);
  }, [course, router]);

  return (
    <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );
}
