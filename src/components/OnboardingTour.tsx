'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

export interface TourStep {
  desktopSelector: string;
  mobileSelector: string;
  badge: string;
  title: string;
  description: string;
  tip?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    desktopSelector: '#tour-brand',
    mobileSelector: '#tour-brand',
    badge: '1 / 6 • WELCOME',
    title: 'Welcome to AnyLearn! 🚀',
    description:
      'AnyLearn generates a living, personalized curriculum engineered for ONE learner and ONE goal. Powered by Gemini AI with a deterministic Bayesian mastery engine.',
    tip: 'Everything you see runs on live, verified state — zero mock data.',
  },
  {
    desktopSelector: '#tour-nav-roadmap',
    mobileSelector: '#tour-mobile-roadmap',
    badge: '2 / 6 • CURRICULUM DAG',
    title: 'Living Curriculum Roadmap 🗺️',
    description:
      'Your curriculum is modeled as an acyclic concept dependency graph (DAG). You can explore modules in the list view or toggle the interactive SVG graph view.',
    tip: 'Track atomic concept dependencies and prerequisite milestones.',
  },
  {
    desktopSelector: '#tour-nav-lesson',
    mobileSelector: '#tour-mobile-lesson',
    badge: '3 / 6 • INTERACTIVE LESSONS',
    title: 'Block-Based Deep Lessons 📖',
    description:
      'Lessons are broken down into bite-sized concept blocks: core explanations, collapsible step-by-step worked examples, callout warnings, and practical hands-on tasks.',
    tip: 'Click any worked example to see the exact derivation steps and "why" explanations.',
  },
  {
    desktopSelector: '#tour-nav-quiz',
    mobileSelector: '#tour-mobile-quiz',
    badge: '4 / 6 • BAYESIAN MASTERY',
    title: 'Concept Mastery Quizzes ⚡',
    description:
      'Formative quizzes probe specific misconceptions. The Bayesian engine updates your mastery probabilities in real time, automatically inserting remedial reviews if you struggle.',
    tip: 'Immediate explanations and common pitfalls are revealed on every question.',
  },
  {
    desktopSelector: '#tour-nav-report',
    mobileSelector: '#tour-mobile-report',
    badge: '5 / 6 • SELF-HEALING ENGINE',
    title: 'Instant Content Diagnoser 📊',
    description:
      'Encountered a confusing formula or broken link? Report any block to trigger a dual-model AI diagnosis and patch that repairs the curriculum in ~15 seconds.',
    tip: 'All patches are verified by an AI judge before being applied to your roadmap.',
  },
  {
    desktopSelector: '#tour-settings-btn',
    mobileSelector: '#tour-settings-btn',
    badge: '6 / 6 • CUSTOMIZE & SETTINGS',
    title: 'Settings, Keys & New Goals ⚙️',
    description:
      'Configure your OpenAi API key, switch between pre-loaded courses (Medical Terminology & PCB Electronics), or create a brand new custom course from the "New Goal" tab.',
    tip: 'You can restart this interactive tour anytime from the header "Tour" button.',
  },
];

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const updateTargetRect = useCallback((stepIdx: number) => {
    if (typeof window === 'undefined') return;
    const step = TOUR_STEPS[stepIdx];
    if (!step) return;

    const isMobile = window.innerWidth < 768;
    const selector = isMobile ? step.mobileSelector : step.desktopSelector;
    const element = document.querySelector(selector) || document.querySelector(step.desktopSelector);

    if (element) {
      // Ensure element is visible
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      setTargetRect(element.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, []);

  const handleClose = useCallback(() => {
    setIsActive(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('anylearn-tour-seen', 'true');
    }
  }, []);

  const handleNext = useCallback(() => {
    setCurrentStep(s => {
      if (s < TOUR_STEPS.length - 1) {
        return s + 1;
      }
      handleClose();
      return s;
    });
  }, [handleClose]);

  const handleBack = useCallback(() => {
    setCurrentStep(s => (s > 0 ? s - 1 : 0));
  }, []);

  // Check initial tour state on mount
  useEffect(() => {
    if (!mounted) return;

    const hasSeenTour = localStorage.getItem('anylearn-tour-seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStep(0);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Listen for manual tour trigger
  useEffect(() => {
    if (!mounted) return;

    const handleStartTour = () => {
      setIsActive(true);
      setCurrentStep(0);
    };

    window.addEventListener('start-anylearn-tour', handleStartTour);
    return () => window.removeEventListener('start-anylearn-tour', handleStartTour);
  }, [mounted]);

  // Update target rect whenever step changes or on window resize / scroll
  useEffect(() => {
    if (!isActive) return;

    let animId: number;
    const scheduleUpdate = () => {
      animId = requestAnimationFrame(() => {
        updateTargetRect(currentStep);
      });
    };

    scheduleUpdate();

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, true);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, true);
    };
  }, [isActive, currentStep, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, handleClose, handleNext, handleBack]);

  if (!mounted || !isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calculate Popover Position
  let popoverStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 99999,
    width: '92%',
    maxWidth: 420,
    boxSizing: 'border-box',
  };

  if (targetRect && typeof window !== 'undefined') {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const popoverHeight = 320;
    const placeAbove = spaceBelow < popoverHeight && targetRect.top > popoverHeight;

    const top = placeAbove
      ? Math.max(16, targetRect.top - popoverHeight - 12)
      : Math.min(window.innerHeight - popoverHeight - 16, targetRect.bottom + 14);

    // Center horizontally relative to target, clamped to viewport margins
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const popoverWidth = Math.min(420, window.innerWidth - 32);
    const left = Math.max(16, Math.min(window.innerWidth - popoverWidth - 16, targetCenterX - popoverWidth / 2));

    popoverStyle = {
      ...popoverStyle,
      top,
      left,
    };
  } else {
    // Fallback centered popover
    popoverStyle = {
      ...popoverStyle,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  }

  return (
    <>
      {/* ── 1. Dim Backdrop ────────────────────────────────────────────── */}
      <div
        className="fixed inset-0"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(2px)',
          zIndex: 99995,
          pointerEvents: 'auto',
          transition: 'all 0.2s ease',
        }}
        onClick={handleClose}
      />

      {/* ── 2. Spotlight Box (anchors smoothly to target element) ───────── */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: 6,
            border: '3px solid #FFE600',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 20px rgba(255, 230, 0, 0.9)',
            zIndex: 99997,
            pointerEvents: 'none',
            transition: 'top 0.25s cubic-bezier(0.16, 1, 0.3, 1), left 0.25s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s cubic-bezier(0.16, 1, 0.3, 1), height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* ── 3. Neo-Brutalist Tour Popover Card ─────────────────────────── */}
      <div
        style={{
          ...popoverStyle,
          backgroundColor: '#FFFFFF',
          border: '3px solid #000000',
          boxShadow: '6px 6px 0px #000000',
          borderRadius: 10,
          padding: 24,
          color: '#000000',
          animation: 'fadeIn 0.2s ease-out',
        }}
        role="dialog"
        aria-label="Product Onboarding Tutorial"
      >
        {/* Step Badge & Close Button */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              style={{
                backgroundColor: '#FFE600',
                border: '2px solid #000000',
                boxShadow: '2px 2px 0px #000000',
                borderRadius: 4,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '0.04em',
                color: '#000000',
              }}
            >
              {step.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              fontWeight: 900,
              cursor: 'pointer',
              color: '#000000',
              padding: '0 4px',
              lineHeight: 1,
            }}
            title="Skip Tour (Esc)"
            aria-label="Close tour"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 18,
            fontWeight: 900,
            lineHeight: 1.25,
            color: '#000000',
            marginBottom: 8,
          }}
        >
          {step.title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            lineHeight: 1.5,
            color: '#262626',
            marginBottom: 12,
          }}
        >
          {step.description}
        </p>

        {/* Tip pill */}
        {step.tip && (
          <div
            style={{
              backgroundColor: '#FAF8F5',
              border: '1.5px solid #000000',
              borderRadius: 6,
              padding: '8px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: '#404040',
              marginBottom: 16,
            }}
            className="flex items-start gap-1.5"
          >
            <span>💡</span>
            <span>{step.tip}</span>
          </div>
        )}

        {/* Footer: Progress Dots & Actions */}
        <div className="flex items-center justify-between gap-3 pt-2" style={{ borderTop: '2px solid #000000' }}>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentStep(i)}
                style={{
                  width: i === currentStep ? 18 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: i === currentStep ? '#000000' : '#D4D4D4',
                  border: '1px solid #000000',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={`Go to step ${i + 1}`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="brutal-btn brutal-btn-sm brutal-btn-white"
                style={{ padding: '6px 12px', fontSize: 12 }}
              >
                ← Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="brutal-btn brutal-btn-sm brutal-btn-primary"
              style={{ padding: '6px 14px', fontSize: 12 }}
            >
              {isLastStep ? 'Get Started 🚀' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
