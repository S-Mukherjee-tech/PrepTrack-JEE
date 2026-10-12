import React, { useRef, useEffect, useState, memo } from 'react';
import { useReducedMotion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in seconds (e.g. 0.04, 0.08)
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number; // Distance in pixels
  threshold?: number;
}

/**
 * Hyper-smooth, GPU-accelerated Scroll Reveal component.
 * Uses native IntersectionObserver with zero continuous overhead.
 * Smoothly cascades elements into view with Apple/Stripe-calibrated easing [0.22, 1, 0.36, 1]
 * combining subtle micro-scaling and vertical translation.
 */
export const ScrollReveal = memo(function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 16,
  threshold = 0.06
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Check if already in viewport on mount
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold,
        rootMargin: '0px 0px -20px 0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, shouldReduceMotion]);

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const getTransform = () => {
    if (isVisible) return 'translate3d(0, 0, 0) scale(1)';
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0) scale(0.994)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0) scale(0.994)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0) scale(0.994)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0) scale(0.994)`;
      case 'none':
      default:
        return 'translate3d(0, 0, 0) scale(0.994)';
    }
  };

  return (
    <div
      ref={ref}
      className={`scroll-reveal-container transform-gpu will-change-[transform,opacity] ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: '440ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}s`,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      {children}
    </div>
  );
});

export default ScrollReveal;
