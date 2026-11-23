import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface CinematicIntroProps {
  onComplete: () => void;
}

const BRAND_WORDS = ['HER', 'HEALTH', 'JOURNEY'] as const;

/**
 * 6-Scene Emerald & Champagne Gold Cinematic Brand Introduction:
 * Scene 1: Deep emerald (#092820) fades in.
 * Scene 2: Champagne-gold light sweep moves across the screen.
 * Scene 3: The H brand symbol appears.
 * Scene 4: Reveal HER HEALTH JOURNEY in bold typography.
 * Scene 5: Display KNOW YOUR BODY. OWN YOUR JOURNEY.
 * Scene 6: Smooth transition into the real application.
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

  // Auto-advance after Scenes 1–5 complete (~4.8s), or promptly under reduced motion
  useEffect(() => {
    if (prefersReducedMotion) {
      const quickTimer = window.setTimeout(() => {
        onComplete();
      }, 750);
      return () => window.clearTimeout(quickTimer);
    }

    const exitTimer = window.setTimeout(() => {
      finishIntro();
    }, 4800);

    return () => window.clearTimeout(exitTimer);
  }, [prefersReducedMotion, finishIntro, onComplete]);

  // Scene 6 completion callback after smooth dissolve
  useEffect(() => {
    if (!exiting) return;
    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, prefersReducedMotion ? 100 : 600);
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
                className="w-20 h-20 sm:w-24 sm:h-24"
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
