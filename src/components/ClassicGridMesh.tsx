import React, { memo } from 'react';

interface ClassicGridMeshProps {
  theme?: string;
}

export const ClassicGridMesh = memo(function ClassicGridMesh({
  theme = 'glass'
}: ClassicGridMeshProps) {
  // Theme-specific color parameters for high-contrast classic grid mesh
  const isLight = theme === 'light';
  const isCyber = theme === 'cyber';
  const isSlate = theme === 'slate';

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Luminous Mesh Gradient Underlay (Multi-node Horizon & Ambient Spheres) */}
      <div 
        className="absolute -top-[120px] inset-x-0 h-[720px] transition-all duration-700 pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.06) 35%, rgba(56, 189, 248, 0.04) 65%, transparent 100%)'
            : isCyber
            ? 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(16, 185, 129, 0.32) 0%, rgba(5, 150, 105, 0.2) 35%, rgba(13, 148, 136, 0.12) 65%, transparent 100%)'
            : isSlate
            ? 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(6, 182, 212, 0.32) 0%, rgba(37, 99, 235, 0.22) 35%, rgba(30, 58, 138, 0.15) 65%, transparent 100%)'
            : 'radial-gradient(ellipse 90% 60% at 50% 10%, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.22) 35%, rgba(236, 72, 153, 0.14) 65%, transparent 100%)'
        }}
      />

      {/* Floating Ambient Mesh Orbs for Organic Depth */}
      <div 
        className="hidden md:block absolute top-[160px] -left-[100px] w-[520px] h-[520px] rounded-full blur-[140px] opacity-70 pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: isLight
            ? 'rgba(99, 102, 241, 0.08)'
            : isCyber
            ? 'rgba(16, 185, 129, 0.18)'
            : isSlate
            ? 'rgba(6, 182, 212, 0.18)'
            : 'rgba(99, 102, 241, 0.22)'
        }}
      />
      <div 
        className="hidden md:block absolute top-[280px] -right-[120px] w-[560px] h-[560px] rounded-full blur-[150px] opacity-60 pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: isLight
            ? 'rgba(236, 72, 153, 0.06)'
            : isCyber
            ? 'rgba(20, 184, 166, 0.16)'
            : isSlate
            ? 'rgba(79, 70, 229, 0.18)'
            : 'rgba(217, 70, 239, 0.18)'
        }}
      />

      {/* Deep Content Horizon Mesh (Mid-page illumination behind trackers) */}
      <div 
        className="hidden lg:block absolute top-[680px] left-[20%] w-[600px] h-[360px] rounded-full blur-[160px] opacity-40 pointer-events-none transition-all duration-700"
        style={{
          backgroundColor: isLight
            ? 'rgba(56, 189, 248, 0.05)'
            : isCyber
            ? 'rgba(16, 185, 129, 0.12)'
            : isSlate
            ? 'rgba(6, 182, 212, 0.14)'
            : 'rgba(129, 140, 248, 0.14)'
        }}
      />

      {/* 2. Precision Architectural Classic Grid Overlay (SVG with Crosshairs) */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          maskImage: 'linear-gradient(to bottom, black 0%, black 75%, rgba(0,0,0,0.6) 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 75%, rgba(0,0,0,0.6) 90%, transparent 100%)'
        }}
      >
        <defs>
          {/* Subgrid Pattern (24px) */}
          <pattern
            id="classic-subgrid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke={
                isLight
                  ? 'rgba(15, 23, 42, 0.035)'
                  : isCyber
                  ? 'rgba(16, 185, 129, 0.045)'
                  : isSlate
                  ? 'rgba(56, 189, 248, 0.04)'
                  : 'rgba(255, 255, 255, 0.035)'
              }
              strokeWidth="0.75"
            />
          </pattern>

          {/* Major Grid Pattern with Crosshair Intersections (48px) */}
          <pattern
            id="classic-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            {/* Major orthogonal grid lines */}
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={
                isLight
                  ? 'rgba(15, 23, 42, 0.09)'
                  : isCyber
                  ? 'rgba(16, 185, 129, 0.14)'
                  : isSlate
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(255, 255, 255, 0.09)'
              }
              strokeWidth="1"
            />
            {/* Engineering crosshair (+) at grid intersections */}
            <path
              d="M 45 48 L 51 48 M 48 45 L 48 51"
              fill="none"
              stroke={
                isLight
                  ? 'rgba(79, 70, 229, 0.35)'
                  : isCyber
                  ? 'rgba(52, 211, 153, 0.45)'
                  : isSlate
                  ? 'rgba(56, 189, 248, 0.4)'
                  : 'rgba(165, 180, 252, 0.45)'
              }
              strokeWidth="1.25"
            />
          </pattern>
        </defs>

        {/* Render Subgrid */}
        <rect width="100%" height="100%" fill="url(#classic-subgrid)" />
        {/* Render Major Architectural Grid */}
        <rect width="100%" height="100%" fill="url(#classic-grid)" />
      </svg>

      {/* 3. Subtle Vignette Border Rim for Cinematic Focus */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: isLight 
            ? 'inset 0 0 100px rgba(15, 23, 42, 0.03)'
            : 'inset 0 0 120px rgba(0, 0, 0, 0.65)'
        }}
      />
    </div>
  );
});

export default ClassicGridMesh;
