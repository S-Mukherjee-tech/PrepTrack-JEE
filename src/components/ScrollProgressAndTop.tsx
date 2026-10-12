import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { ThemeType } from '../types';

interface ScrollProgressAndTopProps {
  theme: ThemeType;
}

export const ScrollProgressAndTop = memo(function ScrollProgressAndTop({ theme }: ScrollProgressAndTopProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(current);
      } else {
        setScrollProgress(0);
      }
      setShowScrollTop(window.scrollY > 280);
    };

    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  const accentColor = 
    theme === 'cyber' ? '#10b981' :
    theme === 'light' ? '#4f46e5' :
    theme === 'slate' ? '#06b6d4' :
    '#818cf8';

  const strokeDashoffset = 100 - scrollProgress;

  return (
    <>
      {/* High-Performance Fixed Top Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 w-full h-[2.5px] z-50 origin-left will-change-transform transition-transform duration-100 ease-out pointer-events-none"
        style={{ 
          transform: `scaleX(${scrollProgress / 100})`,
          background: accentColor,
          boxShadow: `0 1px 8px ${
            theme === 'cyber' ? 'rgba(16,185,129,0.5)' :
            theme === 'light' ? 'rgba(79,70,229,0.5)' :
            theme === 'slate' ? 'rgba(6,182,212,0.5)' :
            'rgba(129,140,248,0.5)'
          }`
        }}
        aria-hidden="true"
      />

      {/* Floating Interactive Scroll-to-Top Capsule with Circular Progress */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-to-top"
            initial={{ opacity: 0, y: 16, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-20 md:bottom-8 right-6 p-2.5 rounded-full border z-40 shadow-xl cursor-pointer flex items-center justify-center group"
            style={{
              background: theme === 'cyber' ? 'rgba(5,26,16,0.92)' :
                          theme === 'light' ? 'rgba(255,255,255,0.95)' :
                          theme === 'slate' ? 'rgba(13,18,46,0.92)' :
                          'rgba(14,18,34,0.92)',
              borderColor: theme === 'cyber' ? 'rgba(16,185,129,0.3)' :
                           theme === 'light' ? 'rgba(226,232,240,0.9)' :
                           theme === 'slate' ? 'rgba(6,182,212,0.3)' :
                           'rgba(255,255,255,0.14)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(20px)'
            }}
            title={`Back to top (${Math.round(scrollProgress)}%)`}
            aria-label="Scroll back to top"
          >
            {/* SVG Circular Progress Track */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-8 h-8 transform -rotate-90 pointer-events-none" viewBox="0 0 36 36">
                <path
                  className="text-white/10 dark:text-white/10 stroke-current"
                  strokeWidth="2.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  stroke={accentColor}
                  strokeWidth="2.5"
                  strokeDasharray="100, 100"
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-[stroke-dashoffset] duration-150 ease-out"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <ArrowUp 
                className="w-3.5 h-3.5 absolute transition-transform duration-200 group-hover:-translate-y-0.5" 
                style={{ color: accentColor }}
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
});

export default ScrollProgressAndTop;
