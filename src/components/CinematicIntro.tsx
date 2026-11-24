import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface CinematicIntroProps {
  onComplete: () => void;
}

const BRAND_WORDS = ['HER', 'HEALTH', 'JOURNEY'] as const;

/**
 * 7-Scene Emerald & Champagne Gold Cinematic Brand Introduction:
 * Scene 1: Deep emerald (#092820) ambient background.
 * Scene 2: Champagne-gold light sweep moves across the screen.
 * Scene 3: Reveal HER HEALTH JOURNEY emblem with smooth scale and fade animation.
 * Scene 4: Reveal brand name with elegant typography.
 * Scene 5: Display tagline: KNOW YOUR BODY. OWN YOUR JOURNEY.
 * Scene 6: Add subtle gold shimmer and botanical visual movement.
 * Scene 7: Smooth transition into the main website.
 */
export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const prefersReducedMotion = useReducedMotion();
  const [exiting, setExiting] = useState(false);

  const finishIntro = React.useCallback(() => {
    setExiting((prev) => {
      if (prev) return prev;
      return true;
    });
  }, []);

  // Auto-advance after sequence completes (~4.9s), or promptly under reduced motion (750ms)
  useEffect(() => {
    if (prefersReducedMotion) {
      const quickTimer = window.setTimeout(() => {
        onComplete();
      }, 750);
      return () => window.clearTimeout(quickTimer);
    }

    const exitTimer = window.setTimeout(() => {
      finishIntro();
    }, 4900);

    return () => window.clearTimeout(exitTimer);
  }, [prefersReducedMotion, finishIntro, onComplete]);

  // Scene 7 completion callback after smooth dissolve into main application
  useEffect(() => {
    if (!exiting) return;
    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, prefersReducedMotion ? 100 : 650);
    return () => window.clearTimeout(doneTimer);
  }, [exiting, onComplete, prefersReducedMotion]);

  // Escape key immediately skips intro
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishIntro();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [finishIntro]);

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Her Health Journey cinematic brand introduction"
        data-testid="cinematic-intro"
        initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
        style={{ backgroundColor: '#092820', color: '#F8F5EB' }}
      >
        {/* Scene 1: Deep emerald ambient vignette */}
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.1 : 0.9, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(65% 55% at 50% 45%, rgba(23, 79, 64, 0.55) 0%, rgba(16, 60, 50, 0.25) 48%, rgba(9, 40, 32, 0.98) 100%)',
          }}
        />

        {/* Scene 2: Champagne-gold light sweep moving across the viewport */}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            initial={{ x: '-110%', opacity: 0 }}
            animate={{ x: '130%', opacity: [0, 0.85, 0.65, 0] }}
            transition={{
              delay: 0.45,
              duration: 1.5,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="pointer-events-none absolute inset-y-0 w-[44vw] -skew-x-12"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(197, 166, 107, 0.14) 35%, rgba(228, 210, 165, 0.28) 50%, rgba(197, 166, 107, 0.12) 65%, transparent 100%)',
            }}
          />
        )}

        {/* Scene 6: Botanical visual movement & delicate gold shimmer sparkles */}
        {!prefersReducedMotion && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {/* Drifting botanical leaf accents */}
            <motion.svg
              className="absolute left-[10%] sm:left-[16%] bottom-[18%] w-10 h-10 sm:w-12 sm:h-12 text-[#27836A]/40"
              viewBox="0 0 24 24"
              fill="currentColor"
              initial={{ opacity: 0, y: 35, rotate: -20, scale: 0.8 }}
              animate={{
                opacity: [0, 0.5, 0.4, 0],
                y: [35, -20, -55],
                rotate: [-20, 5, 25],
                scale: [0.8, 1.1, 0.95],
              }}
              transition={{ delay: 3.1, duration: 2.1, ease: 'easeOut' }}
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </motion.svg>

            <motion.svg
              className="absolute right-[12%] sm:right-[18%] top-[20%] w-12 h-12 sm:w-14 sm:h-14 text-[#C5A66B]/35"
              viewBox="0 0 24 24"
              fill="currentColor"
              initial={{ opacity: 0, y: -25, rotate: 25, scale: 0.75 }}
              animate={{
                opacity: [0, 0.45, 0.35, 0],
                y: [-25, 15, 45],
                rotate: [25, 10, -8],
                scale: [0.75, 1.05, 0.9],
              }}
              transition={{ delay: 3.25, duration: 2.1, ease: 'easeOut' }}
            >
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
            </motion.svg>

            {/* Subtle gold shimmer particles */}
            {[
              { top: '34%', left: '28%', delay: 3.15, size: 4 },
              { top: '26%', right: '30%', delay: 3.3, size: 5 },
              { top: '60%', left: '24%', delay: 3.42, size: 3.5 },
              { top: '64%', right: '26%', delay: 3.5, size: 4.5 },
              { top: '42%', left: '49%', delay: 3.2, size: 5 },
            ].map((sparkle, idx) => (
              <motion.div
                key={idx}
                className="absolute rounded-full"
                style={{
                  top: sparkle.top,
                  left: sparkle.left,
                  right: sparkle.right,
                  width: sparkle.size,
                  height: sparkle.size,
                  backgroundColor: '#E4D2A5',
                  boxShadow: '0 0 10px 2px rgba(197, 166, 107, 0.7)',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.95, 0.5, 0.85, 0],
                  scale: [0, 1.4, 0.85, 1.25, 0],
                }}
                transition={{ delay: sparkle.delay, duration: 1.6, ease: 'easeInOut' }}
              />
            ))}
          </div>
        )}

        {/* Skip Intro control aligned to .page-container */}
        <div className="absolute inset-x-0 top-5 sm:top-7 z-20 pointer-events-none">
          <div className="page-container flex justify-end">
            <button
              type="button"
              onClick={finishIntro}
              className="pointer-events-auto inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-[12px] text-xs sm:text-sm font-semibold text-[#F8F5EB] bg-[#103C32]/90 hover:bg-[#174F40] border border-[#C5A66B]/45 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A66B]"
            >
              <span>Skip Intro</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#E4D2A5]" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Centerpiece Composition: Scenes 3, 4, and 5 */}
        <div className="relative z-10 page-container flex flex-col items-center text-center">
          <div className="max-w-2xl flex flex-col items-center">
            {/* Scene 3: The H brand symbol appears */}
            <motion.div
              initial={prefersReducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.84 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 1.05,
                duration: prefersReducedMotion ? 0.1 : 0.85,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mb-8"
            >
              <BrandLogo
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
                showSweep={!prefersReducedMotion}
              />
            </motion.div>

            {/* Scene 4: Reveal HER HEALTH JOURNEY */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 mb-5">
              {BRAND_WORDS.map((word, idx) => (
                <motion.span
                  key={word}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 1, y: 0 }
                      : { opacity: 0, y: 12, letterSpacing: '0.24em' }
                  }
                  animate={{ opacity: 1, y: 0, letterSpacing: '0.16em' }}
                  transition={{
                    delay: prefersReducedMotion ? 0 : 1.75 + idx * 0.25,
                    duration: prefersReducedMotion ? 0.1 : 0.65,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="font-display font-bold text-2xl sm:text-4xl md:text-[2.6rem] text-[#FFFFFF] uppercase"
                >
                  {word}
                </motion.span>
              ))}
            </div>

            {/* Gold Divider Line */}
            <motion.div
              aria-hidden="true"
              initial={prefersReducedMotion ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 2.55,
                duration: prefersReducedMotion ? 0.1 : 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="w-24 h-[1.5px] mb-5 origin-center"
              style={{
                background: 'linear-gradient(90deg, transparent, #C5A66B, transparent)',
              }}
            />

            {/* Scene 5: Tagline */}
            <motion.p
              initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 2.8,
                duration: prefersReducedMotion ? 0.1 : 0.7,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="text-sm sm:text-base font-semibold tracking-[0.14em] uppercase text-[#E4D2A5] max-w-[36ch]"
            >
              KNOW YOUR BODY. OWN YOUR JOURNEY.
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
