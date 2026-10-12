import { useEffect, useState, useRef, memo } from 'react';
import { useReducedMotion } from 'motion/react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in ms, default 600ms
  decimals?: number; // decimal places, default 0
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * High-performance smooth numeric counter ticker.
 * Uses requestAnimationFrame with ease-out cubic curve.
 * Aligns vertically with tabular-nums and prevents any layout shift.
 */
export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  duration = 600,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = ''
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Quartic ease-out for hyper-smooth velvet deceleration: 1 - Math.pow(1 - progress, 4)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const current = startVal + (endVal - startVal) * easeProgress;
      
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [value, duration, shouldReduceMotion]);

  const formatted = decimals > 0 
    ? displayValue.toFixed(decimals) 
    : Math.round(displayValue).toString();

  return (
    <span className={`font-numeric tabular-nums tracking-tight ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
});

export default AnimatedCounter;
