import React, { useEffect, useRef, memo } from 'react';

// Lightweight custom event name
const BURST_EVENT_NAME = 'cosmic-milestone-burst';

interface BurstEventDetail {
  x?: number;
  y?: number;
  count?: number;
  hue?: number;
}

/**
 * Imperatively trigger a 3D Cosmic Warp Starburst from anywhere in the app
 * (e.g. on chapter completion, hitting daily goal, or test submission)
 */
export const triggerMilestoneBurst = (x?: number, y?: number, count = 120, hue = 220) => {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent<BurstEventDetail>(BURST_EVENT_NAME, {
    detail: { x, y, count, hue },
  });
  window.dispatchEvent(event);
};

interface Particle3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  prevScreenX: number;
  prevScreenY: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

/**
 * CosmicMilestoneBurst: 3D Relativistic Star-Warp & Milestone Particle Explosion
 * Emits particles in true 3D spatial coordinates with perspective division,
 * producing hyperspace light-streaks projecting outward toward the viewer.
 */
export const CosmicMilestoneBurst = memo(function CosmicMilestoneBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle3D[] = [];
    let animationId: number | null = null;
    const fov = 350; // Camera field of view distance

    const playChime = () => {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const actx = new AudioCtx();
        if (actx.state === 'suspended') {
          actx.resume();
        }
        const now = actx.currentTime;

        // Dual resonant crystal chimes
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0, now + i * 0.06);
          gain.gain.linearRampToValueAtTime(0.08, now + i * 0.06 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.52);
        });
      } catch (e) {
        // Audio is optional and non-blocking
      }
    };

    const render = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        // Store previous screen position for hyperspace light streaks
        const prevScale = fov / Math.max(1, fov + p.z);
        p.prevScreenX = p.x * prevScale + centerX;
        p.prevScreenY = p.y * prevScale + centerY;

        // Kinematics in 3D
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Slight drag
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.vz *= 0.985;

        const lifeRatio = p.life / p.maxLife;
        p.alpha = Math.max(0, 1 - lifeRatio);

        // Perspective 3D division
        const currentScale = fov / Math.max(1, fov + p.z);
        const screenX = p.x * currentScale + centerX;
        const screenY = p.y * currentScale + centerY;

        if (p.life >= p.maxLife || p.z <= -fov + 10 || screenX < -100 || screenX > width + 100 || screenY < -100 || screenY > height + 100) {
          particles.splice(i, 1);
          continue;
        }

        // Draw relativistic warp streak
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = Math.max(1.2, p.size * currentScale * 1.5);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(p.prevScreenX, p.prevScreenY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();

        // Draw particle head spark
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(0.8, p.size * currentScale * 0.8), 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      if (particles.length > 0) {
        animationId = requestAnimationFrame(render);
      } else {
        animationId = null;
        ctx.clearRect(0, 0, width, height);
      }
    };

    const handleBurstEvent = (e: Event) => {
      const customEvent = e as CustomEvent<BurstEventDetail>;
      const count = customEvent.detail?.count || 120;
      const originX = (customEvent.detail?.x ?? width / 2) - width / 2;
      const originY = (customEvent.detail?.y ?? height / 2) - height / 2;
      const baseHue = customEvent.detail?.hue ?? 220;

      const colors = [
        `hsl(${baseHue}, 90%, 65%)`,
        `hsl(${(baseHue + 40) % 360}, 95%, 70%)`,
        `hsl(${(baseHue + 80) % 360}, 100%, 75%)`,
        '#ffffff',
        '#fef08a',
        '#38bdf8',
        '#a7f3d0',
      ];

      for (let i = 0; i < count; i++) {
        // Spherical distribution in 3D
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const speed = Math.random() * 16 + 8;

        particles.push({
          x: originX,
          y: originY,
          z: Math.random() * 40 - 20,
          vx: Math.sin(phi) * Math.cos(theta) * speed,
          vy: Math.sin(phi) * Math.sin(theta) * speed,
          vz: -Math.cos(phi) * speed * 1.6, // Strong forward propulsion toward camera
          prevScreenX: originX + width / 2,
          prevScreenY: originY + height / 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2.8 + 1.2,
          alpha: 1,
          life: 0,
          maxLife: Math.floor(Math.random() * 40 + 35),
        });
      }

      playChime();

      if (!animationId) {
        animationId = requestAnimationFrame(render);
      }
    };

    window.addEventListener(BURST_EVENT_NAME, handleBurstEvent);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener(BURST_EVENT_NAME, handleBurstEvent);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      aria-hidden="true"
    />
  );
});

export default CosmicMilestoneBurst;
