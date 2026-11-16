import React, { useEffect, useRef, memo } from 'react';

interface CosmicBackgroundProps {
  theme?: 'glass' | 'slate' | 'cyber' | 'light';
}

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  hasSpikes: boolean;
  spikeSize: number;
}

export const CosmicBackground = memo(function CosmicBackground({ theme = 'glass' }: CosmicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({ x: -1000, y: -1000, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isDark = theme !== 'light';
    const isCyber = theme === 'cyber';
    const isSlate = theme === 'slate';

    const starColors = isDark
      ? isCyber
        ? ['#ffffff', '#a7f3d0', '#6ee7b7', '#ecfdf5', '#99f6e4']
        : isSlate
        ? ['#ffffff', '#bae6fd', '#7dd3fc', '#e0f2fe', '#c7d2fe']
        : ['#ffffff', '#e0e7ff', '#c7d2fe', '#ddd6fe', '#fef08a']
      : ['#475569', '#64748b', '#4338ca', '#6366f1'];

    const isMobile = width < 768;
    const starCount = isMobile ? 70 : 140;

    // Pre-bake a soft glow sprite once so we never call createRadialGradient inside the animation loop
    const glowSpriteSize = 32;
    const glowSprite = document.createElement('canvas');
    glowSprite.width = glowSpriteSize;
    glowSprite.height = glowSpriteSize;
    const glowCtx = glowSprite.getContext('2d');
    if (glowCtx) {
      const half = glowSpriteSize / 2;
      const grad = glowCtx.createRadialGradient(half, half, 0, half, half, half);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.28, isCyber ? 'rgba(52, 211, 153, 0.42)' : isSlate ? 'rgba(56, 189, 248, 0.42)' : 'rgba(129, 140, 248, 0.42)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      glowCtx.fillStyle = grad;
      glowCtx.fillRect(0, 0, glowSpriteSize, glowSpriteSize);
    }

    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() < 0.86
        ? Math.random() * 0.85 + 0.5
        : Math.random() * 1.2 + 1.15;

      const isBeacon = radius > 1.75;
      const baseAlpha = isDark
        ? (isBeacon ? Math.random() * 0.35 + 0.6 : Math.random() * 0.45 + 0.3)
        : (isBeacon ? Math.random() * 0.25 + 0.35 : Math.random() * 0.2 + 0.14);

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Math.random() * 0.03 + 0.012,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        hasSpikes: isBeacon && !isMobile,
        spikeSize: radius * 3.2,
      });
    }

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        stars.forEach((s) => {
          if (s.x > width) s.x = Math.random() * width;
          if (s.y > height) s.y = Math.random() * height;
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    // Cap gentle starfield twinkle at ~24 FPS so scrolling & UI clicks always get full 120Hz headroom
    const FRAME_INTERVAL = 1000 / 24;
    let lastDrawTime = 0;

    const renderFrame = (time: number) => {
      animationFrameId = requestAnimationFrame(renderFrame);

      if (prefersReducedMotion && lastDrawTime !== 0) {
        return;
      }

      if (time - lastDrawTime < FRAME_INTERVAL && lastDrawTime !== 0) {
        return;
      }
      lastDrawTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Subtle constellation connections near cursor (desktop only)
      if (mouseRef.current.active && !isMobile && isDark) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const connectionRadius = 105;
        const rSq = connectionRadius * connectionRadius;

        ctx.lineWidth = 0.6;
        for (let i = 0; i < stars.length; i++) {
          const s1 = stars[i];
          const dx = s1.x - mx;
          const dy = s1.y - my;
          const dSq = dx * dx + dy * dy;
          if (dSq < rSq) {
            const distMouse = Math.sqrt(dSq);
            const mouseAlpha = (1 - distMouse / connectionRadius) * 0.16;
            ctx.beginPath();
            ctx.strokeStyle = isCyber ? `rgba(110, 231, 183, ${mouseAlpha})` : `rgba(165, 180, 252, ${mouseAlpha})`;
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(mx, my);
            ctx.stroke();

            for (let j = i + 1; j < stars.length; j++) {
              const s2 = stars[j];
              const sdx = s1.x - s2.x;
              const sdy = s1.y - s2.y;
              const sdSq = sdx * sdx + sdy * sdy;
              if (sdSq < 7225) { // 85^2
                const distStars = Math.sqrt(sdSq);
                const linkAlpha = (1 - distStars / 85) * mouseAlpha * 0.75;
                ctx.beginPath();
                ctx.strokeStyle = isCyber ? `rgba(52, 211, 153, ${linkAlpha})` : `rgba(129, 140, 248, ${linkAlpha})`;
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // 2. Render calm deep-space starfield (zero comets, zero heavy radial gradients per frame)
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (!prefersReducedMotion) {
          s.twinklePhase += s.twinkleSpeed;
          s.alpha = s.baseAlpha + Math.sin(s.twinklePhase) * (s.baseAlpha * 0.32);
        }

        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));

        if (s.hasSpikes && isDark) {
          const haloSize = s.radius * 9;
          ctx.drawImage(glowSprite, s.x - haloSize / 2, s.y - haloSize / 2, haloSize, haloSize);

          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - s.spikeSize, s.y);
          ctx.lineTo(s.x + s.spikeSize, s.y);
          ctx.moveTo(s.x, s.y - s.spikeSize);
          ctx.lineTo(s.x, s.y + s.spikeSize);
          ctx.stroke();
        }

        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    animationFrameId = requestAnimationFrame(renderFrame);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        lastDrawTime = 0;
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme]);

  const isDark = theme !== 'light';
  const isCyber = theme === 'cyber';
  const isSlate = theme === 'slate';

  return (
    <div className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden" aria-hidden="true">
      {/* 1. Deep Celestial Base Gradient Atmosphere */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? isCyber
              ? 'radial-gradient(ellipse 110% 80% at 50% 0%, #03150d 0%, #020b06 45%, #010603 100%)'
              : isSlate
              ? 'radial-gradient(ellipse 110% 80% at 50% 0%, #081124 0%, #050a17 45%, #03050c 100%)'
              : 'radial-gradient(ellipse 110% 80% at 50% 0%, #0c1026 0%, #080a1c 45%, #040510 100%)'
            : 'radial-gradient(ellipse 120% 85% at 50% 0%, #e0e7ff 0%, #eef2ff 24%, #f1f5f9 62%, #f8fafc 100%)',
        }}
      />

      {/* 2. Smooth Zero-Blur Radial Nebulae (Pre-diffused gradients: identical depth with zero GPU blur cost) */}
      {isDark ? (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isCyber
                ? 'radial-gradient(ellipse 55% 42% at 32% 12%, rgba(16, 185, 129, 0.11) 0%, rgba(6, 95, 70, 0.04) 45%, transparent 75%), radial-gradient(ellipse 48% 40% at 82% 45%, rgba(20, 184, 166, 0.08) 0%, transparent 70%), radial-gradient(ellipse 45% 38% at 12% 82%, rgba(5, 150, 105, 0.07) 0%, transparent 70%)'
                : isSlate
                ? 'radial-gradient(ellipse 55% 42% at 32% 12%, rgba(14, 165, 233, 0.11) 0%, rgba(30, 58, 138, 0.04) 45%, transparent 75%), radial-gradient(ellipse 48% 40% at 82% 45%, rgba(99, 102, 241, 0.08) 0%, transparent 70%), radial-gradient(ellipse 45% 38% at 12% 82%, rgba(6, 182, 212, 0.07) 0%, transparent 70%)'
                : 'radial-gradient(ellipse 55% 42% at 32% 12%, rgba(99, 102, 241, 0.13) 0%, rgba(139, 92, 246, 0.05) 45%, transparent 75%), radial-gradient(ellipse 48% 40% at 82% 45%, rgba(168, 85, 247, 0.09) 0%, transparent 70%), radial-gradient(ellipse 45% 38% at 12% 82%, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 95% 95% at 50% 50%, transparent 62%, rgba(2, 4, 10, 0.48) 100%)',
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 55% 42% at 22% 10%, rgba(99, 102, 241, 0.1) 0%, transparent 70%), radial-gradient(ellipse 50% 42% at 84% 38%, rgba(14, 165, 233, 0.09) 0%, transparent 70%)',
          }}
        />
      )}

      {/* 3. Calm Starfield Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
});

export default CosmicBackground;
