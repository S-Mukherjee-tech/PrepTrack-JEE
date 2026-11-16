import React, { useRef, useState, useCallback, memo } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // max tilt in degrees (default 12)
  scale?: number; // scale on hover (default 1.02)
  glare?: boolean; // enable specular glare (default true)
  glareOpacity?: number; // glare intensity (default 0.25)
  perspective?: number; // CSS perspective in px (default 1000)
}

/**
 * TiltCard: High-performance 3D Holographic Tilt Card with Spring Physics & Dynamic Glare
 * Renders buttery 60-120fps CSS 3D transforms with transform-style: preserve-3d,
 * allowing child elements with `translate-z-[XXpx]` to float in physical 3D space.
 */
export const TiltCard = memo(function TiltCard({
  children,
  className = '',
  maxTilt = 12,
  scale = 1.02,
  glare = true,
  glareOpacity = 0.25,
  perspective = 1000,
  ...rest
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center (-1 to +1)
    const mouseX = (e.clientX - rect.left) / width;
    const mouseY = (e.clientY - rect.top) / height;

    const xVal = (mouseX - 0.5) * 2;
    const yVal = (mouseY - 0.5) * 2;

    // 3D rotation angles (inverted Y for natural tilt)
    const rotateX = -yVal * maxTilt;
    const rotateY = xVal * maxTilt;

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 0.08s cubic-bezier(0.2, 0.8, 0.4, 1)',
    });

    if (glare) {
      setGlareStyle({
        opacity: glareOpacity,
        background: `radial-gradient(circle 240px at ${(mouseX * 100).toFixed(1)}% ${(mouseY * 100).toFixed(1)}%, rgba(255, 255, 255, 0.35) 0%, rgba(255, 255, 255, 0.05) 50%, transparent 80%)`,
        transition: 'opacity 0.15s ease',
      });
    }
  }, [maxTilt, scale, glare, glareOpacity, perspective]);

  const handleMouseLeave = useCallback(() => {
    // Smooth spring return to zero
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    });
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transition: 'opacity 0.4s ease',
      });
    }
  }, [perspective, glare]);

  // Touch gesture support on mobile
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || e.touches.length === 0) return;

    const touch = e.touches[0];
    const rect = card.getBoundingClientRect();
    const mouseX = (touch.clientX - rect.left) / rect.width;
    const mouseY = (touch.clientY - rect.top) / rect.height;

    if (mouseX < 0 || mouseX > 1 || mouseY < 0 || mouseY > 1) return;

    const xVal = (mouseX - 0.5) * 2;
    const yVal = (mouseY - 0.5) * 2;

    const rotateX = -yVal * (maxTilt * 0.7);
    const rotateY = xVal * (maxTilt * 0.7);

    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.01, 1.01, 1.01)`,
      transition: 'transform 0.08s ease-out',
    });
  }, [maxTilt, perspective]);

  const handleTouchEnd = useCallback(() => {
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    });
  }, [perspective]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        ...tiltStyle,
        transformStyle: 'preserve-3d',
      }}
      className={`relative will-change-transform ${className}`}
      {...rest}
    >
      {/* 3D Content Container with preserve-3d to enable floating child elements */}
      <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>

      {/* Holographic Specular Glare Overlay */}
      {glare && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[inherit] pointer-events-none mix-blend-overlay z-30"
          style={glareStyle}
        />
      )}
    </div>
  );
});

export default TiltCard;
