'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { FluentEmoji } from '@/components/FluentEmoji';

export function AvatarDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { course, reset } = useStore();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleResetProgress = () => {
    if (confirm('Reset your current course progress?')) {
      reset();
      setIsOpen(false);
      window.location.href = '/';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User profile and settings"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="w-10 h-10 rounded-full bg-butter border-2 border-black flex items-center justify-center font-bold text-black text-sm shadow-sm hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <span className="sr-only">User profile and settings</span>
        <FluentEmoji emoji="🎓" size={20} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="User Options"
          className="absolute right-0 mt-2 w-64 bg-black border border-white/15 rounded-2xl shadow-toolbar p-3 z-50 flex flex-col gap-2 text-white"
        >
          <div className="px-3 py-2 border-b border-white/10">
            <p className="text-xs font-medium text-white/60">ACTIVE LEARNER</p>
            <p className="text-sm font-bold truncate text-white">
              {course ? (course.profile?.topic || course.goal) : 'Ready to Learn'}
            </p>
          </div>

          <Link
            href="/goal"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FluentEmoji emoji="🎯" size={16} />
            <span>Create New Course</span>
          </Link>

          <Link
            href="/roadmap"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <FluentEmoji emoji="🗺️" size={16} />
            <span>View Living Roadmap</span>
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleResetProgress}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl text-pink hover:bg-white/10 transition-colors text-left w-full"
          >
            <FluentEmoji emoji="⏱️" size={16} />
            <span>Reset Course Progress</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default AvatarDropdown;
