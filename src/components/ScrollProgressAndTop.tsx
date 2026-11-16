import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { ThemeType } from '../types';

interface ScrollProgressAndTopProps {
  theme: ThemeType;
}

export const ScrollProgressAndTop = memo(function ScrollProgressAndTop({ theme }: ScrollProgressAndTopProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const progressPathRef = useRef<SVGPathElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateScrollUI = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = totalHeight > 0
        ? Math.min(1, Math.max(0, window.scrollY / totalHeight))
        : 0;
      const pct = ratio * 100;

      // Update top bar directly on DOM node — zero React re-renders during scroll
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${ratio})`;
      }

      // Update circular progress ring directly on SVG path — zero React re-renders during scroll
      if (progressPathRef.current) {
        progressPathRef.current.style.strokeDashoffset = `${100 - pct}`;
      }

      if (buttonRef.current) {
        buttonRef.current.title = `Back to top (${Math.round(pct)}%)`;
      }

      const shouldShow = window.scrollY > 240;
      setShowScrollTop((prev) => (prev !== shouldShow ? shouldShow : prev));
    };

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateScrollUI();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    updateScrollUI();

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, [showScrollTop]);

  const accentColor =
    theme === 'cyber' ? '#10b981' :
    theme === 'light' ? '#4f46e5' :
    theme === 'slate' ? '#06b6d4' :
    '#818cf8';

  const glowRgb =
    theme === 'cyber' ? '16, 185, 129' :
    theme === 'light' ? '79, 70, 229' :
    theme === 'slate' ? '6, 182, 212' :
    '129, 140, 248';

  return (
    <>
      {/* Zero-rerender Fixed Top Scroll Progress Bar with Crisp Glow */}
      <div
        ref={barRef}
        className="fixed top-0 left-0 w-full h-[2.5px] z-50 origin-left pointer-events-none"
        style={{
          transform: 'scaleX(0)',
          background: accentColor,
          boxShadow: `0 1px 10px rgba(${glowRgb}, 0.55)`,
          willChange: 'transform',
        }}
        aria-hidden="true"
      />

      {/* Floating Interactive Scroll-to-Top Capsule with Circular Progress & Radiant Hover Glow */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            ref={buttonRef}
            key="scroll-to-top"
            type="button"
            initial={{ opacity: 0, y: 18, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 420, damping: 24 }}
            whileHover={{ y: -4, scale: 1.08 }}
            whileTap={{ scale: 0.90 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-24 xl:bottom-8 right-5 sm:right-6 p-2.5 rounded-full border z-40 cursor-pointer flex items-center justify-center group scroll-top-glow-btn"
            style={{
              background:
                theme === 'cyber' ? 'rgba(5, 24, 15, 0.94)' :
                theme === 'light' ? 'rgba(255, 255, 255, 0.96)' :
                theme === 'slate' ? 'rgba(11, 18, 42, 0.94)' :
                'rgba(14, 18, 36, 0.94)',
              borderColor: `rgba(${glowRgb}, 0.42)`,
              boxShadow: `0 10px 28px rgba(0, 0, 0, 0.45), 0 0 18px rgba(${glowRgb}, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.16)`,
            }}
            title="Back to top"
            aria-label="Scroll back to top"
          >
            {/* Pre-diffused Radiant Hover Halo */}
            <span
              aria-hidden="true"
              className="absolute -inset-2.5 rounded-full opacity-45 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                background: `radial-gradient(circle, rgba(${glowRgb}, 0.42) 0%, rgba(${glowRgb}, 0.12) 48%, transparent 72%)`,
              }}
            />

            {/* Crisp Outer Luminous Ring on Hover */}
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
              style={{
                boxShadow: `0 0 0 1.5px rgba(${glowRgb}, 0.7), 0 0 22px 2px rgba(${glowRgb}, 0.55)`,
              }}
            />

            {/* SVG Circular Progress Track */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <path
                  className={theme === 'light' ? 'text-slate-200 stroke-current' : 'text-white/10 stroke-current'}
                  strokeWidth="2.6"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  ref={progressPathRef}
                  stroke={accentColor}
                  strokeWidth="2.8"
                  strokeDasharray="100, 100"
                  strokeDashoffset="100"
                  strokeLinecap="round"
                  fill="none"
                  style={{
                    filter: `drop-shadow(0 0 4px rgba(${glowRgb}, 0.7))`,
                  }}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Kinetic Hover Arrow */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                <ArrowUp
                  className="w-3.5 h-3.5 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:scale-110"
                  style={{
                    color: accentColor,
                    filter: `drop-shadow(0 0 5px rgba(${glowRgb}, 0.65))`,
                  }}
                />
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
});

export default ScrollProgressAndTop;
