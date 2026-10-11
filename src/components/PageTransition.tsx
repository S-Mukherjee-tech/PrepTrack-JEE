import React, { memo } from 'react';
import { motion, AnimatePresence, useReducedMotion, Variants } from 'motion/react';

export const TAB_ORDER: Record<string, number> = {
  dashboard: 0,
  analytics: 1,
  questions: 2,
  syllabus: 3,
  notes: 4,
  mock_tests: 5,
  settings: 6,
};

export const MOCK_SUBTAB_ORDER: Record<string, number> = {
  log: 0,
  analytics: 1,
  history: 2,
};

export const NOTES_SUBTAB_ORDER: Record<string, number> = {
  error: 0,
  special: 1,
};

interface PageTransitionProps {
  children: React.ReactNode;
  activeKey: string;
  direction?: number; // 1 for forward, -1 for backward
  variant?: 'page' | 'subview';
  className?: string;
  onExitComplete?: () => void;
}

/**
 * High-velocity, subtle, and fluid page transition wrapper.
 * Calibrated with Apple/Stripe-grade settling physics [0.16, 1, 0.3, 1].
 * Animates GPU compositor properties (opacity and transform) with mode="wait"
 * to completely eliminate layout jumping, scroll glitches, and visual disruption.
 */
export const PageTransition = memo(function PageTransition({
  children,
  activeKey,
  direction = 1,
  variant = 'page',
  className = '',
  onExitComplete
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const isSubview = variant === 'subview';
  const xOffset = isSubview ? 8 : 10;
  const yOffset = isSubview ? 4 : 6;

  const variants: Variants = {
    initial: (dir: number) => {
      if (shouldReduceMotion) {
        return {
          opacity: 0,
          y: 0,
          scale: 1,
        };
      }
      return {
        opacity: 0,
        x: dir * xOffset,
        y: yOffset,
        scale: 0.998,
        filter: 'blur(2px)',
      };
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      pointerEvents: 'auto' as const,
      transition: {
        duration: shouldReduceMotion ? 0.08 : isSubview ? 0.16 : 0.2,
        ease: [0.16, 1, 0.3, 1] as const,
        opacity: {
          duration: shouldReduceMotion ? 0.08 : 0.15,
          ease: [0.16, 1, 0.3, 1] as const,
        },
        filter: {
          duration: 0.16,
          ease: 'easeOut',
        },
      },
    },
    exit: (dir: number) => {
      if (shouldReduceMotion) {
        return {
          opacity: 0,
          y: 0,
          scale: 1,
          pointerEvents: 'none' as const,
          transition: {
            duration: 0.06,
          },
        };
      }
      return {
        opacity: 0,
        x: -dir * Math.round(xOffset * 0.5),
        y: -4,
        scale: 0.998,
        filter: 'blur(2px)',
        pointerEvents: 'none' as const,
        transition: {
          duration: isSubview ? 0.11 : 0.13,
          ease: [0.4, 0, 1, 1] as const,
          opacity: {
            duration: 0.1,
          },
        },
      };
    },
  };

  return (
    <div className={`relative w-full overflow-x-clip page-transition-wrapper ${className}`}>
      <AnimatePresence
        mode="wait"
        initial={false}
        custom={direction}
        onExitComplete={onExitComplete}
      >
        <motion.div
          key={activeKey}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full page-transition-layer will-change-[transform,opacity]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
});

export default PageTransition;
