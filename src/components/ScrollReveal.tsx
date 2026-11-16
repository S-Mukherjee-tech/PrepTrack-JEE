import React, { useRef, useEffect, useState, memo } from 'react';
import { useReducedMotion } from 'motion/react';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  threshold?: number;
}

/**
 * Lightweight, zero-jank Scroll Reveal component.
 * Pre-reveals generously ahead of the viewport (rootMargin: 120px) with fast 200ms settling
 * and immediately clears compositor properties after reveal.
 */
export const ScrollReveal = memo(function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 8,
  threshold = 0.01
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [animationCompleted, setAnimationCompleted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsVisible(true);
      setAnimationCompleted(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: '120px 0px 80px 0px'
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, shouldReduceMotion]);

  useEffect(() => {
    if (isVisible && !animationCompleted) {
      const timer = setTimeout(() => {
        setAnimationCompleted(true);
      }, (delay + 0.25) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animationCompleted, delay]);

  if (shouldReduceMotion || animationCompleted) {
    return <div className={className}>{children}</div>;
  }

  const getTransform = () => {
    if (isVisible) return 'none';
    switch (direction) {
      case 'up':
        return `translate3d(0, ${distance}px, 0)`;
      case 'down':
        return `translate3d(0, -${distance}px, 0)`;
      case 'left':
        return `translate3d(${distance}px, 0, 0)`;
      case 'right':
        return `translate3d(-${distance}px, 0, 0)`;
      case 'none':
      default:
        return 'none';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: 'opacity, transform',
        transitionDuration: '200ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${Math.min(delay, 0.05)}s`,
      }}
    >
      {children}
    </div>
  );
});

export default ScrollReveal;
