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

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
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

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Palette per theme
    const isDark = theme !== 'light';
    const isCyber = theme === 'cyber';
    const isSlate = theme === 'slate';

    const starColors = isDark
      ? isCyber
        ? ['#ffffff', '#a7f3d0', '#6ee7b7', '#ecfdf5', '#99f6e4']
        : isSlate
        ? ['#ffffff', '#bae6fd', '#7dd3fc', '#e0f2fe', '#c7d2fe']
        : ['#ffffff', '#e0e7ff', '#c7d2fe', '#ddd6fe', '#fef08a']
      : ['#334155', '#475569', '#64748b', '#4338ca', '#6366f1'];

    // Star count scaled for screen size
    const isMobile = width < 768;
    const starCount = isMobile ? 85 : 175;

    // Generate natural celestial distribution
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      const radius = Math.random() < 0.85
        ? Math.random() * 0.9 + 0.5 // small distant micro-stars
        : Math.random() * 1.3 + 1.2; // mid & beacon stars

      const isBeacon = radius > 1.8;
      const baseAlpha = isDark
        ? (isBeacon ? Math.random() * 0.4 + 0.6 : Math.random() * 0.5 + 0.35)
        : (isBeacon ? Math.random() * 0.3 + 0.4 : Math.random() * 0.25 + 0.15);

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        baseAlpha,
        alpha: baseAlpha,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)],
        hasSpikes: isBeacon && !isMobile,
        spikeSize: radius * 3.5,
      });
    }

    // Shooting stars & Majestic Comets state
    const shootingStars: ShootingStar[] = [];
    let nextShootingStarTime = Date.now() + 4000;

    // Comet structures
    interface CometPoint {
      x: number;
      y: number;
    }

    interface CometDust {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }

    interface Comet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      speed: number;
      angle: number;
      nucleusRadius: number;
      comaRadius: number;
      tailLength: number;
      tailWidth: number;
      opacity: number;
      maxOpacity: number;
      life: number;
      maxLife: number;
      history: CometPoint[];
      colorCore: string;
      colorComa: string;
      colorTail: string;
      colorDust: string[];
    }

    const comets: Comet[] = [];
    const cometDustParticles: CometDust[] = [];
    // Spawn first comet quickly (1.2s after mount) so user sees it right away
    let nextCometTime = Date.now() + 1200;

    const spawnComet = () => {
      if (prefersReducedMotion) return;

      // Choose starting edge: top or top-left
      const fromTop = Math.random() > 0.35;
      let startX: number;
      let startY: number;
      let angle: number;

      if (fromTop) {
        startX = Math.random() * (width * 0.7) + (width * 0.05);
        startY = -30;
        // Travel down and across (between 35 and 55 degrees)
        angle = (Math.PI / 180) * (Math.random() * 22 + 38);
      } else {
        startX = -30;
        startY = Math.random() * (height * 0.45);
        // Travel across and down (between 25 and 45 degrees)
        angle = (Math.PI / 180) * (Math.random() * 20 + 26);
      }

      // Majestic comet speed: smooth, observable transit (3.8 - 5.5 px/frame)
      const speed = isMobile ? Math.random() * 1.2 + 3.2 : Math.random() * 1.6 + 3.8;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      // Expected duration across screen: 4 to 8 seconds
      const maxLife = Math.floor(Math.max(width, height) / speed) + 90;

      // Color scheme based on active theme
      let colorComa = 'rgba(129, 140, 248, 0.55)';
      let colorTail = 'rgba(165, 180, 252, 0.45)';
      let colorDust = ['#ffffff', '#c7d2fe', '#818cf8', '#a78bfa', '#38bdf8'];

      if (isCyber) {
        colorComa = 'rgba(52, 211, 153, 0.55)';
        colorTail = 'rgba(110, 231, 183, 0.45)';
        colorDust = ['#ffffff', '#a7f3d0', '#34d399', '#2dd4bf', '#6ee7b7'];
      } else if (isSlate) {
        colorComa = 'rgba(56, 189, 248, 0.55)';
        colorTail = 'rgba(125, 211, 252, 0.45)';
        colorDust = ['#ffffff', '#bae6fd', '#38bdf8', '#818cf8', '#60a5fa'];
      } else if (!isDark) {
        colorComa = 'rgba(99, 102, 241, 0.35)';
        colorTail = 'rgba(129, 140, 248, 0.3)';
        colorDust = ['#4338ca', '#6366f1', '#818cf8', '#94a3b8'];
      }

      comets.push({
        x: startX,
        y: startY,
        vx,
        vy,
        speed,
        angle,
        nucleusRadius: isMobile ? 2.4 : 3.4,
        comaRadius: isMobile ? 18 : 28,
        tailLength: isMobile ? 160 : 260,
        tailWidth: isMobile ? 8 : 14,
        opacity: 0,
        maxOpacity: isDark ? 0.95 : 0.75,
        life: 0,
        maxLife,
        history: [],
        colorCore: '#ffffff',
        colorComa,
        colorTail,
        colorDust,
      });
    };

    const spawnShootingStar = () => {
      if (!isDark || prefersReducedMotion) return;
      const startX = Math.random() * (width * 0.85);
      const startY = Math.random() * (height * 0.4);
      shootingStars.push({
        x: startX,
        y: startY,
        length: Math.random() * 70 + 60,
        speed: Math.random() * 8 + 11,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.25,
        opacity: 0,
        maxOpacity: Math.random() * 0.5 + 0.3,
        life: 0,
        maxLife: Math.random() * 30 + 25,
      });
    };

    // Resize handler
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      stars.forEach((s) => {
        if (s.x > width) s.x = Math.random() * width;
        if (s.y > height) s.y = Math.random() * height;
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Subtle interactive mouse tracker for constellation thread effects
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

    // Rendering loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle constellation connections around cursor (desktop only)
      if (mouseRef.current.active && !isMobile && isDark) {
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const connectionRadius = 110;

        for (let i = 0; i < stars.length; i++) {
          const s1 = stars[i];
          const distMouse = Math.hypot(s1.x - mx, s1.y - my);
          if (distMouse < connectionRadius) {
            const mouseAlpha = (1 - distMouse / connectionRadius) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = isCyber ? `rgba(110, 231, 183, ${mouseAlpha})` : `rgba(165, 180, 252, ${mouseAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.moveTo(s1.x, s1.y);
            ctx.lineTo(mx, my);
            ctx.stroke();

            for (let j = i + 1; j < stars.length; j++) {
              const s2 = stars[j];
              const distStars = Math.hypot(s1.x - s2.x, s1.y - s2.y);
              if (distStars < 90) {
                const linkAlpha = (1 - distStars / 90) * mouseAlpha * 0.8;
                ctx.beginPath();
                ctx.strokeStyle = isCyber ? `rgba(52, 211, 153, ${linkAlpha})` : `rgba(129, 140, 248, ${linkAlpha})`;
                ctx.lineWidth = 0.5;
                ctx.moveTo(s1.x, s1.y);
                ctx.lineTo(s2.x, s2.y);
                ctx.stroke();
              }
            }
          }
        }
      }

      // 2. Render all background stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        if (!prefersReducedMotion) {
          s.twinklePhase += s.twinkleSpeed;
          s.alpha = s.baseAlpha + Math.sin(s.twinklePhase) * (s.baseAlpha * 0.35);
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, s.alpha));

        // Soft halo on brighter beacon stars
        if (s.hasSpikes && isDark) {
          const glowGrad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 4.5);
          glowGrad.addColorStop(0, s.color);
          glowGrad.addColorStop(0.3, isCyber ? 'rgba(52, 211, 153, 0.4)' : 'rgba(129, 140, 248, 0.4)');
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 4.5, 0, Math.PI * 2);
          ctx.fill();

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
        ctx.restore();
      }

      // 3. Render Shooting Stars (subtle distant streaks)
      if (Date.now() > nextShootingStarTime) {
        spawnShootingStar();
        nextShootingStarTime = Date.now() + Math.random() * 9000 + 8000;
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        ss.life++;

        const progress = ss.life / ss.maxLife;
        if (progress < 0.25) {
          ss.opacity = (progress / 0.25) * ss.maxOpacity;
        } else {
          ss.opacity = (1 - (progress - 0.25) / 0.75) * ss.maxOpacity;
        }

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;

        if (ss.life >= ss.maxLife || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, ss.opacity);
        const tailX = ss.x - Math.cos(ss.angle) * ss.length;
        const tailY = ss.y - Math.sin(ss.angle) * ss.length;

        const meteorGrad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        meteorGrad.addColorStop(0, 'transparent');
        meteorGrad.addColorStop(0.7, isCyber ? 'rgba(110, 231, 183, 0.5)' : 'rgba(165, 180, 252, 0.5)');
        meteorGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = meteorGrad;
        ctx.lineWidth = 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Majestic Comets & Shedding Stardust Trails
      if (Date.now() > nextCometTime) {
        // Keep max 2 active comets
        if (comets.length < 2) {
          spawnComet();
        }
        // Next comet every 8 to 15 seconds
        nextCometTime = Date.now() + Math.random() * 7000 + 8000;
      }

      // Update and draw comets
      for (let i = comets.length - 1; i >= 0; i--) {
        const c = comets[i];
        c.life++;

        // Smooth fade-in (15% of life) and gentle fade-out at end (last 20%)
        const progress = c.life / c.maxLife;
        if (progress < 0.15) {
          c.opacity = (progress / 0.15) * c.maxOpacity;
        } else if (progress > 0.8) {
          c.opacity = (1 - (progress - 0.8) / 0.2) * c.maxOpacity;
        } else {
          c.opacity = c.maxOpacity;
        }

        // Advance position
        c.x += c.vx;
        c.y += c.vy;

        // Record history for smooth trailing ribbon
        c.history.push({ x: c.x, y: c.y });
        // Max history length proportional to tail
        const maxHistory = Math.floor(c.tailLength / c.speed);
        if (c.history.length > maxHistory) {
          c.history.shift();
        }

        // Spawn trailing stardust crumbs from the comet head
        if (!prefersReducedMotion && Math.random() < 0.85) {
          const spawnAngle = c.angle + Math.PI + (Math.random() - 0.5) * 0.6;
          const dustSpeed = Math.random() * 1.2 + 0.4;
          cometDustParticles.push({
            x: c.x + (Math.random() - 0.5) * 6,
            y: c.y + (Math.random() - 0.5) * 6,
            vx: Math.cos(spawnAngle) * dustSpeed,
            vy: Math.sin(spawnAngle) * dustSpeed,
            size: Math.random() * 1.6 + 0.6,
            alpha: Math.random() * 0.7 + 0.3,
            color: c.colorDust[Math.floor(Math.random() * c.colorDust.length)],
            life: 0,
            maxLife: Math.floor(Math.random() * 35 + 30),
          });
        }

        // Remove if offscreen or expired
        if (c.life >= c.maxLife || (c.x > width + 250 && c.y > height + 250)) {
          comets.splice(i, 1);
          continue;
        }

        // DRAW COMET
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, c.opacity));

        // A. Primary Ion Tail (Straight, high-velocity luminous beam)
        const tailBackX = c.x - Math.cos(c.angle) * c.tailLength;
        const tailBackY = c.y - Math.sin(c.angle) * c.tailLength;

        // Draw soft, tapered dust tail polygon
        const perpAngle = c.angle + Math.PI / 2;
        const halfHeadWidth = c.tailWidth * 0.5;
        const halfTailWidth = c.tailWidth * 1.8;

        const h1x = c.x + Math.cos(perpAngle) * halfHeadWidth;
        const h1y = c.y + Math.sin(perpAngle) * halfHeadWidth;
        const h2x = c.x - Math.cos(perpAngle) * halfHeadWidth;
        const h2y = c.y - Math.sin(perpAngle) * halfHeadWidth;

        const t1x = tailBackX + Math.cos(perpAngle) * halfTailWidth;
        const t1y = tailBackY + Math.sin(perpAngle) * halfTailWidth;
        const t2x = tailBackX - Math.cos(perpAngle) * halfTailWidth;
        const t2y = tailBackY - Math.sin(perpAngle) * halfTailWidth;

        const dustTailGrad = ctx.createLinearGradient(tailBackX, tailBackY, c.x, c.y);
        dustTailGrad.addColorStop(0, 'transparent');
        dustTailGrad.addColorStop(0.35, isCyber ? 'rgba(16, 185, 129, 0.08)' : 'rgba(129, 140, 248, 0.08)');
        dustTailGrad.addColorStop(0.7, isCyber ? 'rgba(52, 211, 153, 0.28)' : 'rgba(165, 180, 252, 0.28)');
        dustTailGrad.addColorStop(1, isCyber ? 'rgba(167, 243, 208, 0.65)' : 'rgba(224, 231, 255, 0.65)');

        ctx.fillStyle = dustTailGrad;
        ctx.beginPath();
        ctx.moveTo(h1x, h1y);
        ctx.lineTo(t1x, t1y);
        ctx.lineTo(t2x, t2y);
        ctx.lineTo(h2x, h2y);
        ctx.closePath();
        ctx.fill();

        // B. Intense Center Ion Tail Filament
        const ionGrad = ctx.createLinearGradient(tailBackX, tailBackY, c.x, c.y);
        ionGrad.addColorStop(0, 'transparent');
        ionGrad.addColorStop(0.5, isCyber ? 'rgba(52, 211, 153, 0.35)' : 'rgba(129, 140, 248, 0.35)');
        ionGrad.addColorStop(0.85, isCyber ? 'rgba(110, 231, 183, 0.75)' : 'rgba(199, 210, 254, 0.75)');
        ionGrad.addColorStop(1, '#ffffff');

        ctx.strokeStyle = ionGrad;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailBackX, tailBackY);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();

        // C. Outer Luminescent Coma (Volumetric Aura around Head)
        const comaGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.comaRadius);
        comaGrad.addColorStop(0, '#ffffff');
        comaGrad.addColorStop(0.2, isCyber ? 'rgba(110, 231, 183, 0.9)' : 'rgba(199, 210, 254, 0.9)');
        comaGrad.addColorStop(0.5, c.colorComa);
        comaGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = comaGrad;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.comaRadius, 0, Math.PI * 2);
        ctx.fill();

        // D. Luminous Core Nucleus (Pure white solid center)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.nucleusRadius, 0, Math.PI * 2);
        ctx.fill();

        // E. Delicate Optical Diffraction Cross on Head
        if (!isMobile) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8;
          const spike = c.nucleusRadius * 2.8;
          ctx.beginPath();
          ctx.moveTo(c.x - spike, c.y);
          ctx.lineTo(c.x + spike, c.y);
          ctx.moveTo(c.x, c.y - spike);
          ctx.lineTo(c.x, c.y + spike);
          ctx.stroke();
        }

        ctx.restore();
      }

      // 5. Render Stardust Particles shedding behind Comets
      for (let i = cometDustParticles.length - 1; i >= 0; i--) {
        const p = cometDustParticles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;

        const pLifeRatio = p.life / p.maxLife;
        const currentAlpha = (1 - pLifeRatio) * p.alpha;

        if (p.life >= p.maxLife || currentAlpha <= 0.01) {
          cometDustParticles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = currentAlpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - pLifeRatio * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    // Pause rendering loop when document is hidden to conserve battery
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelAnimationFrame(animationFrameId);
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
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: isDark
            ? isCyber
              ? 'radial-gradient(ellipse 110% 80% at 50% 0%, #03150d 0%, #020b06 45%, #010603 100%)'
              : isSlate
              ? 'radial-gradient(ellipse 110% 80% at 50% 0%, #081124 0%, #050a17 45%, #03050c 100%)'
              : 'radial-gradient(ellipse 110% 80% at 50% 0%, #0c1026 0%, #080a1c 45%, #040510 100%)'
            : 'radial-gradient(ellipse 110% 80% at 50% 0%, #f1f5f9 0%, #f8fafc 55%, #ffffff 100%)',
        }}
      />

      {/* 2. Deep Volumetric Galactic Nebula Dust Clouds (Subtle, Organic & Cinematic) */}
      {isDark && (
        <>
          {/* Primary Celestial Core Nebula (Top-Center Drift) */}
          <div 
            className="absolute top-[-10%] left-[15%] w-[70vw] h-[650px] rounded-[100%] blur-[120px] opacity-35 mix-blend-screen transition-all duration-1000 animate-[pulse_14s_ease-in-out_infinite]"
            style={{
              background: isCyber
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(6, 95, 70, 0.12) 40%, transparent 75%)'
                : isSlate
                ? 'radial-gradient(circle, rgba(14, 165, 233, 0.22) 0%, rgba(30, 58, 138, 0.12) 40%, transparent 75%)'
                : 'radial-gradient(circle, rgba(99, 102, 241, 0.24) 0%, rgba(139, 92, 246, 0.14) 45%, transparent 75%)',
            }}
          />

          {/* Deep Violet / Interstellar Dust Pocket (Right Horizon) */}
          <div 
            className="hidden md:block absolute top-[25%] right-[-5%] w-[55vw] h-[600px] rounded-[100%] blur-[140px] opacity-25 mix-blend-screen transition-all duration-1000"
            style={{
              background: isCyber
                ? 'radial-gradient(circle, rgba(20, 184, 166, 0.2) 0%, rgba(4, 120, 87, 0.08) 50%, transparent 75%)'
                : isSlate
                ? 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(15, 23, 42, 0.08) 50%, transparent 75%)'
                : 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(76, 29, 149, 0.1) 50%, transparent 75%)',
            }}
          />

          {/* Starlight Sapphire Deep Well (Lower-Left Field) */}
          <div 
            className="hidden lg:block absolute bottom-[5%] left-[-10%] w-[50vw] h-[500px] rounded-[100%] blur-[130px] opacity-20 mix-blend-screen transition-all duration-1000"
            style={{
              background: isCyber
                ? 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 70%)'
                : isSlate
                ? 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(59, 130, 246, 0.18) 0%, transparent 70%)',
            }}
          />

          {/* Cosmic Micro-Vignette Edge for Ultra-High Depth */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 95% 95% at 50% 50%, transparent 60%, rgba(2, 4, 10, 0.5) 100%)',
            }}
          />
        </>
      )}

      {/* 3. High-Precision HTML5 Cosmic Starfield Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
});

export default CosmicBackground;
