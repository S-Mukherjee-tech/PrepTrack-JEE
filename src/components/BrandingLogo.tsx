import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const BrandingLogo: React.FC<LogoProps> = React.memo(({ className = '', size = 38 }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
    >
      <defs>
        {/* Sky to Deep Navy Blue Gradient for curved tracks and arrows */}
        <linearGradient id="logoBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        {/* Lime to Deep Emerald Green Gradient for the checkmark overlay */}
        <linearGradient id="logoGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bef264" />
          <stop offset="45%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>

        {/* Shadow filter for realistic depth and premium feel */}
        <filter id="logoShadow" x="-10%" y="-10%" width="125%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Background Columns/Bars (representing IIT structures and academic milestones) */}
      <rect x="33" y="38" width="6" height="13" rx="1.5" fill="url(#logoBlueGrad)" opacity="0.45" />
      <rect x="42" y="32" width="6" height="19" rx="1.5" fill="url(#logoBlueGrad)" opacity="0.6" />
      <rect x="51" y="27" width="6" height="12" rx="1.5" fill="url(#logoBlueGrad)" opacity="0.45" />

      {/* Main Outer Blue Radial Curve System */}
      <path
        d="M 45 92 C 18 92 8 68 8 46 C 8 22 26 8 52 8 C 68 8 78 15 82 23 C 74 17 62 14 52 14 C 30 14 15 29 15 49 C 15 69 28 85 49 85 C 60 85 70 81 76 72 C 69 83 58 92 45 92 Z"
        fill="url(#logoBlueGrad)"
        filter="url(#logoShadow)"
      />

      {/* Interweaving crescent boundary arc */}
      <path
        d="M 85 41 C 86 47 86 54 84 61 C 81 74 69 86 53 86 C 48 86 43 83 38 80 C 44 83 49 84 53 84 C 67 84 78 74 81 61 C 82 56 82 50 80 44 Z"
        fill="url(#logoBlueGrad)"
        opacity="0.8"
      />

      {/* Ascending Action Arrow (Targeting top-right success and peak scoring) */}
      <path
        d="M 23 68 L 84 15"
        stroke="url(#logoBlueGrad)"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      <path
        d="M 72 13 L 88 12 L 85 28 Z"
        fill="url(#logoBlueGrad)"
      />

      {/* Frontmost Bold Checkmark Swoosh in Lime-Green Gradient (representing finished goals & PYQ mastery) */}
      <path
        d="M 27 59 L 46 73 L 81 31"
        fill="none"
        stroke="url(#logoGreenGrad)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#logoShadow)"
      />
    </svg>
  );
});
