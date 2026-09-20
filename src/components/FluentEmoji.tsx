'use client';

import React from 'react';

export type FluentEmojiType =
  | '🎓'
  | '🧠'
  | '🗺️'
  | '🎯'
  | '🔒'
  | '✅'
  | '❌'
  | '🎉'
  | '👏'
  | '⏱️'
  | '🔧'
  | '✨'
  | '🚀'
  | '📚'
  | '🧬'
  | '💡'
  | string;

interface FluentEmojiProps {
  emoji: FluentEmojiType;
  size?: number | string;
  className?: string;
  alt?: string;
}

export function FluentEmoji({ emoji, size = 24, className = '', alt }: FluentEmojiProps) {
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const label = alt || emoji;

  // Normalized emoji string lookup (handling variation selectors)
  const cleanEmoji = emoji.replace(/\uFE0F/g, '');

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: dimension, height: dimension, minWidth: dimension, minHeight: dimension }}
    >
      {renderEmojiSvg(cleanEmoji, dimension)}
    </span>
  );
}

function renderEmojiSvg(emoji: string, size: string) {
  switch (emoji) {
    case '🎓':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="grad-cap-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--sky)" />
              <stop offset="100%" stopColor="var(--black)" />
            </linearGradient>
            <linearGradient id="grad-tassel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--butter)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          <path d="M16 4 L30 11 L16 18 L2 11 Z" fill="url(#grad-cap-top)" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))" />
          <path d="M7 14.5 V21 C7 25 25 25 25 21 V14.5 L16 19 Z" fill="var(--black)" />
          <circle cx="16" cy="11" r="1.5" fill="var(--butter)" />
          <path d="M16 11 Q19 14 21 19 L21 24" stroke="url(#grad-tassel)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="21" cy="24.5" r="1.5" fill="var(--butter)" />
        </svg>
      );

    case '🧠':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="grad-brain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--pink)" />
              <stop offset="60%" stopColor="var(--lavender)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          <path
            d="M16 6 C13 3 8 4 6 8 C4 12 5 17 8 19 C7 22 9 26 13 26 C15 26 16 25 16 24 C16 25 17 26 19 26 C23 26 25 22 24 19 C27 17 28 12 26 8 C24 4 19 3 16 6 Z"
            fill="url(#grad-brain)"
            filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))"
          />
          <path d="M16 7 V23" stroke="var(--black)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 11 Q13 15 10 18" stroke="var(--off-white)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M21 11 Q19 15 22 18" stroke="var(--off-white)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case '🗺':
    case '🗺️':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="map-fold-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--sky)" />
              <stop offset="100%" stopColor="var(--mint)" />
            </linearGradient>
            <linearGradient id="map-fold-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--mint)" />
              <stop offset="100%" stopColor="var(--sky)" />
            </linearGradient>
          </defs>
          <path d="M3 7 L11 4 L11 25 L3 28 Z" fill="url(#map-fold-1)" />
          <path d="M11 4 L21 8 L21 29 L11 25 Z" fill="url(#map-fold-2)" />
          <path d="M21 8 L29 5 L29 26 L21 29 Z" fill="url(#map-fold-1)" />
          <circle cx="16" cy="14" r="3" fill="var(--pink)" />
          <circle cx="16" cy="14" r="1.2" fill="var(--off-white)" />
        </svg>
      );

    case '🎯':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <circle cx="16" cy="16" r="14" fill="var(--pink)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
          <circle cx="16" cy="16" r="10.5" fill="var(--off-white)" />
          <circle cx="16" cy="16" r="7" fill="var(--pink)" />
          <circle cx="16" cy="16" r="3.5" fill="var(--butter)" />
          <circle cx="16" cy="16" r="1.5" fill="var(--black)" />
        </svg>
      );

    case '🔒':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="lock-body" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--butter)" />
              <stop offset="100%" stopColor="var(--butter)" />
            </linearGradient>
          </defs>
          <path d="M10 14 V9 C10 5.68 12.68 3 16 3 C19.32 3 22 5.68 22 9 V14" stroke="var(--grey)" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="6" y="13" width="20" height="16" rx="4" fill="url(#lock-body)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.25))" />
          <circle cx="16" cy="20" r="2" fill="var(--black)" />
          <path d="M16 22 V25" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case '✅':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="check-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--mint)" />
              <stop offset="100%" stopColor="var(--mint)" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#check-bg)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          <path d="M9 16.5 L14 21.5 L23 10.5" stroke="var(--black)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case '❌':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="cross-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--pink)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#cross-bg)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
          <path d="M10 10 L22 22 M22 10 L10 22" stroke="var(--black)" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case '🎉':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="party-cone" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--butter)" />
              <stop offset="100%" stopColor="var(--pink)" />
            </linearGradient>
          </defs>
          <path d="M4 28 L14 6 L26 18 Z" fill="url(#party-cone)" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))" />
          <circle cx="24" cy="7" r="2.5" fill="var(--sky)" />
          <circle cx="28" cy="14" r="2" fill="var(--pink)" />
          <circle cx="18" cy="4" r="2" fill="var(--lavender)" />
          <circle cx="29" cy="22" r="1.5" fill="var(--mint)" />
          <path d="M17 9 Q22 7 24 11" stroke="var(--pink)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M21 16 Q26 13 28 17" stroke="var(--sky)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );

    case '👏':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <defs>
            <linearGradient id="clap-skin" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--butter)" />
              <stop offset="100%" stopColor="var(--butter)" />
            </linearGradient>
          </defs>
          <path d="M14 18 L19 13 C20 12 22 12 23 13 C24 14 24 16 23 17 L19 21 L23 23 C24 24 24 26 23 27 C22 28 20 28 19 27 L11 21 L9 20 L5 24 L3 22 L11 14 Z" fill="url(#clap-skin)" />
          <path d="M20 7 Q23 9 24 12" stroke="var(--butter)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <path d="M16 5 Q20 6 22 9" stroke="var(--butter)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        </svg>
      );

    case '⏱':
    case '⏱️':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <circle cx="16" cy="18" r="12" fill="var(--off-white)" stroke="var(--black)" strokeWidth="2.5" />
          <path d="M16 18 L16 11 M16 18 L20 18" stroke="var(--pink)" strokeWidth="2" strokeLinecap="round" />
          <path d="M14 3 H18 V6 H14 Z" fill="var(--black)" />
          <path d="M23 7 L25 9" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case '🔧':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path
            d="M26 6 C23 3 19 4 17 6 L19 9 L17 11 L14 9 C12 11 11 15 14 18 L5 27 C4 28 4 29 5 30 C6 31 7 31 8 30 L17 21 C20 24 24 23 26 21 L24 18 L26 16 L29 18 C31 16 32 12 29 9 L26 6 Z"
            fill="var(--grey)"
            stroke="var(--black)"
            strokeWidth="1.5"
            filter="drop-shadow(0 2px 3px rgba(0,0,0,0.25))"
          />
        </svg>
      );

    case '✨':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path d="M16 2 Q16 14 2 16 Q16 16 16 30 Q16 16 30 16 Q16 16 16 2 Z" fill="var(--butter)" filter="drop-shadow(0 0 6px rgba(0,0,0,0.2))" />
          <path d="M25 3 Q25 7 21 8 Q25 8 25 13 Q25 8 29 8 Q25 8 25 3 Z" fill="var(--butter)" />
        </svg>
      );

    case '🚀':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path d="M8 24 Q6 28 3 29 Q4 26 8 24 Z" fill="var(--pink)" />
          <path d="M29 3 C22 2 13 8 9 15 L17 23 C24 19 30 10 29 3 Z" fill="var(--off-white)" />
          <path d="M29 3 C26 3 23 5 21 7 L25 11 C27 9 29 6 29 3 Z" fill="var(--pink)" />
          <circle cx="19" cy="13" r="2.5" fill="var(--sky)" stroke="var(--black)" strokeWidth="1" />
          <path d="M9 15 L5 17 L7 21 L12 20 Z" fill="var(--mint)" />
          <path d="M17 23 L15 27 L19 29 L20 24 Z" fill="var(--mint)" />
        </svg>
      );

    case '📚':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <rect x="4" y="6" width="22" height="6" rx="2" fill="var(--sky)" />
          <rect x="4" y="13" width="24" height="6" rx="2" fill="var(--pink)" />
          <rect x="4" y="20" width="22" height="6" rx="2" fill="var(--mint)" />
          <path d="M7 6 V12 M7 13 V19 M7 20 V26" stroke="var(--black)" strokeWidth="1.5" />
        </svg>
      );

    case '🧬':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path d="M8 4 Q16 12 24 20 Q16 28 8 28" stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M24 4 Q16 12 8 20 Q16 28 24 28" stroke="var(--pink)" strokeWidth="3" strokeLinecap="round" fill="none" />
          <line x1="12" y1="8" x2="20" y2="8" stroke="var(--butter)" strokeWidth="2" strokeLinecap="round" />
          <line x1="10" y1="16" x2="22" y2="16" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="24" x2="20" y2="24" stroke="var(--lavender)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case '💡':
      return (
        <svg viewBox="0 0 32 32" width={size} height={size} fill="none">
          <path d="M16 4 C10.5 4 6 8.5 6 14 C6 18 9 20.5 11 23 H21 C23 20.5 26 18 26 14 C26 8.5 21.5 4 16 4 Z" fill="var(--butter)" filter="drop-shadow(0 0 8px rgba(0,0,0,0.15))" />
          <rect x="12" y="24" width="8" height="4" rx="1" fill="var(--grey)" stroke="var(--black)" strokeWidth="1" />
          <path d="M13 28 Q16 30 19 28" stroke="var(--black)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    default:
      return (
        <span style={{ fontSize: size, lineHeight: 1 }} className="filter drop-shadow-sm">
          {emoji}
        </span>
      );
  }
}

export default FluentEmoji;
