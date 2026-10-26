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
 * Automatically clears will-change and compositor textures after transition to maximize 120Hz scroll fluidity on mobile.
 */
export const ScrollReveal = memo(function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 14,
  threshold = 0.05
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
        rootMargin: '20px 0px 0px 0px'
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, shouldReduceMotion]);

  // Clean up GPU compositor layer after animation finishes to prevent mobile memory thrashing
  useEffect(() => {
    if (isVisible && !animationCompleted) {
      const timer = setTimeout(() => {
        setAnimationCompleted(true);
      }, (delay + 0.45) * 1000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, animationCompleted, delay]);

  if (shouldReduceMotion) {
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
      className={`scroll-reveal-container ${animationCompleted ? '' : 'will-change-[opacity,transform]'} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transitionProperty: animationCompleted ? 'none' : 'opacity, transform',
        transitionDuration: '400ms',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
});

export default ScrollReveal;
