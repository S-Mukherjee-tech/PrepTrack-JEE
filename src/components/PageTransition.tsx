import React, { memo } from 'react';
import { motion, useReducedMotion } from 'motion/react';

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
  direction?: number;
  variant?: 'page' | 'subview';
  className?: string;
}

/**
 * Zero-blocking instant page transition wrapper.
 * Immediately mounts the incoming tab without waiting for an exit animation,
 * eliminating click-to-render lag on desktop and mobile.
 */
export const PageTransition = memo(function PageTransition({
  children,
  activeKey,
  direction = 1,
  variant = 'page',
  className = '',
}: PageTransitionProps) {
  const shouldReduceMotion = useReducedMotion();
  const isSubview = variant === 'subview';
  const xOffset = isSubview ? 6 : 8;

  return (
    <div className={`relative w-full page-transition-wrapper ${className}`}>
      <motion.div
        key={activeKey}
        initial={shouldReduceMotion ? { opacity: 0.9 } : { opacity: 0, x: direction * xOffset }}
        animate={{ opacity: 1, x: 0 }}
        transition={{
          duration: shouldReduceMotion ? 0.05 : 0.14,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
});

export default PageTransition;
