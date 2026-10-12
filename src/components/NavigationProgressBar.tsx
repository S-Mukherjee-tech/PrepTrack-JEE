import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { ThemeType } from '../types';

interface NavigationProgressBarProps {
  activeKey: string;
  theme: ThemeType;
}

/**
 * Hyper-smooth top navigation route progress indicator.
 * Provides continuous hardware-accelerated fluid loading sensation
 * with an integrated glowing particle head on route/tab change.
 */
export const NavigationProgressBar = memo(function NavigationProgressBar({
  activeKey,
  theme
}: NavigationProgressBarProps) {
  const [animating, setAnimating] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    setAnimating(true);
    const finishTimer = setTimeout(() => {
      setAnimating(false);
    }, 320);

    return () => {
      clearTimeout(finishTimer);
    };
  }, [activeKey, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return null;
  }

  const barColor = 
    theme === 'cyber' ? 'from-emerald-400 via-teal-300 to-emerald-500' :
    theme === 'light' ? 'from-indigo-500 via-violet-400 to-indigo-600' :
    theme === 'slate' ? 'from-cyan-400 via-sky-300 to-cyan-500' :
    'from-indigo-400 via-purple-300 to-indigo-500';

  const glowShadow = 
    theme === 'cyber' ? 'rgba(16, 185, 129, 0.95)' :
    theme === 'light' ? 'rgba(79, 70, 229, 0.95)' :
    theme === 'slate' ? 'rgba(6, 182, 212, 0.95)' :
    'rgba(129, 140, 248, 0.95)';

  return (
    <AnimatePresence>
      {animating && (
        <motion.div 
          key={activeKey}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: 'easeOut' } }}
          className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* Main animated progress runner */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: 0.28,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`h-full w-full bg-gradient-to-r ${barColor} origin-left relative will-change-transform transform-gpu`}
            style={{
              boxShadow: `0 0 12px ${glowShadow}`,
            }}
          >
            {/* Ultra-luminous leading edge head */}
            <div
              className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent via-white/80 to-white"
              style={{
                boxShadow: `0 0 16px ${glowShadow}, 0 0 6px #ffffff`,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default NavigationProgressBar;
