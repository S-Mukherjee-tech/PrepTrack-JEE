import { useState, useEffect, memo } from 'react';
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
        setScrollProgress((window.scrollY / totalHeight) * 100);
      } else {
        setScrollProgress(0);
      }
      setShowScrollTop(window.scrollY > 300);
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
    // Run initial scroll check
    handleScroll();

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, []);

  return (
    <>
      {/* High-Performance Fixed Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 w-full h-[2.5px] z-50 origin-left will-change-transform transition-transform duration-100 ease-out"
        style={{ 
          transform: `scaleX(${scrollProgress / 100})`,
          background: theme === 'cyber' ? '#10b981' :
                      theme === 'light' ? '#f43f5e' :
                      theme === 'slate' ? '#06b6d4' :
                      '#818cf8',
          boxShadow: `0 1px 6px ${
            theme === 'cyber' ? 'rgba(16,185,129,0.5)' :
            theme === 'light' ? 'rgba(244,63,94,0.5)' :
            theme === 'slate' ? 'rgba(6,182,212,0.5)' :
            'rgba(129,140,248,0.5)'
          }`
        }}
      />

      {/* High-Performance Scroll-to-Top Button using CSS transitions */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-20 md:bottom-8 right-6 p-3.5 rounded-2xl border text-white z-40 shadow-xl cursor-pointer transition-all duration-300 ease-out flex items-center justify-center ${
          showScrollTop 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto hover:scale-105' 
            : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}
        style={{
          background: theme === 'cyber' ? 'rgba(5,26,16,0.9)' :
                      theme === 'light' ? 'rgba(255,255,255,0.95)' :
                      theme === 'slate' ? 'rgba(13,18,46,0.9)' :
                      'rgba(19,21,40,0.9)',
          borderColor: theme === 'cyber' ? 'rgba(16,185,129,0.45)' :
                       theme === 'light' ? 'rgba(244,63,94,0.3)' :
                       theme === 'slate' ? 'rgba(6,182,212,0.4)' :
                       'rgba(255,255,255,0.12)',
          color: theme === 'light' ? '#f43f5e' :
                 theme === 'cyber' ? '#10b981' :
                 theme === 'slate' ? '#06b6d4' :
                 '#818cf8',
          boxShadow: `0 8px 30px rgba(0, 0, 0, 0.35)`
        }}
        title="Scroll to Top"
        aria-label="Scroll to Top"
      >
        <ArrowUp className="w-4.5 h-4.5" />
      </button>
    </>
  );
});
