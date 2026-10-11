import { useEffect, useState, memo } from 'react';
import { useReducedMotion } from 'motion/react';
import { ThemeType } from '../types';

interface NavigationProgressBarProps {
  activeKey: string;
  theme: ThemeType;
}

/**
 * Ultra-lightweight top navigation route progress bar.
 * Gives instantaneous visual feedback on route/tab change without blocking navigation.
 * Uses GPU transform exclusively for zero-layout-overhead 120fps animation.
 */
export const NavigationProgressBar = memo(function NavigationProgressBar({
  activeKey,
  theme
}: NavigationProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Trigger subtle top loader pulse on route change
    setIsVisible(true);
    setProgress(35);

    const midTimer = setTimeout(() => {
      setProgress(85);
    }, 80);

    const finishTimer = setTimeout(() => {
      setProgress(100);
    }, 180);

    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 320);

    return () => {
      clearTimeout(midTimer);
      clearTimeout(finishTimer);
      clearTimeout(fadeTimer);
    };
  }, [activeKey, shouldReduceMotion]);

  if (shouldReduceMotion || !isVisible) {
    return null;
  }

  const barColor = 
    theme === 'cyber' ? 'from-emerald-400 via-teal-300 to-emerald-500' :
    theme === 'light' ? 'from-indigo-500 via-violet-400 to-indigo-600' :
    theme === 'slate' ? 'from-cyan-400 via-sky-300 to-cyan-500' :
    'from-indigo-400 via-purple-300 to-indigo-500';

  const glowShadow = 
    theme === 'cyber' ? '0 0 10px rgba(16, 185, 129, 0.7)' :
    theme === 'light' ? '0 0 10px rgba(79, 70, 229, 0.7)' :
    theme === 'slate' ? '0 0 10px rgba(6, 182, 212, 0.7)' :
    '0 0 10px rgba(129, 140, 248, 0.7)';

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        className={`h-full bg-gradient-to-r ${barColor} origin-left transition-all ease-out`}
        style={{
          transform: `scaleX(${progress / 100})`,
          transitionDuration: progress === 100 ? '120ms' : '100ms',
          boxShadow: glowShadow
        }}
      />
    </div>
  );
});

export default NavigationProgressBar;
