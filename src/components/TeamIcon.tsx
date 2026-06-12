'use client';

import React from 'react';
import {
  Dog, TreePine, Lasso,
  Tornado, Shield, Bolt, Star, TreePalm,
} from 'lucide-react';

// Custom SVG components for teams without matching Lucide icons
// Styled to match Lucide's line icon aesthetic: strokeWidth=2, round caps/joins

function LonghornsIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Bull head — horns go horizontal then curve up */}
      <path d="M2 10h5" />
      <path d="M2 10c0-3 1-5 3-7" />
      <path d="M22 10h-5" />
      <path d="M22 10c0-3-1-5-3-7" />
      <path d="M7 10c0 2 2 4 5 4s5-2 5-4" />
      <path d="M10 14v3" />
      <path d="M14 14v3" />
    </svg>
  );
}

function CannonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Simple cannon: rectangular barrel on round wagon wheel */}
      <path d="M3 8h14" />
      <path d="M17 8l2-1" />
      <path d="M3 12h14" />
      <path d="M3 8v4" />
      <path d="M17 8v4" />
      <circle cx="10" cy="18" r="4" />
      <path d="M10 14v-2" />
      <line x1="6" y1="18" x2="14" y2="18" />
      <line x1="10" y1="14" x2="10" y2="22" />
    </svg>
  );
}

function SnakeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* S-curve snake with head and forked tongue */}
      <path d="M18 4c1 0 2 1 2 2s-1 2-2 2c-2 0-3 1-3 3s1 3 3 3c1 0 2 1 2 2s-1 2-2 2c-2 0-3 1-3 2" />
      <path d="M19 3.5v1.5" />
      <path d="M20.5 3.5v1.5" />
    </svg>
  );
}

function BowArrowIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Bow with nocked arrow */}
      <path d="M6 3c3 4 3 14 0 18" />
      <path d="M6 3c-2 2-3 5-3 9s1 7 3 9" />
      <path d="M6 12h13" />
      <path d="M14 7l5 5-5 5" />
    </svg>
  );
}

// Map lucide icon names to components (gold color)
const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Dog, TreePine, Lasso,
  Tornado, Shield, Bolt, Star, TreePalm,
  Longhorns: LonghornsIcon,
  Cannon: CannonIcon,
  Snake: SnakeIcon,
  BowArrow: BowArrowIcon,
};

interface TeamIconProps {
  team: {
    id: string;
    flag: string;
    shortName: string;
    name: string;
    lucideIcon?: string;
  };
  className?: string;
  size?: number;
}

export default function TeamIcon({ team, className = '', size = 20 }: TeamIconProps) {
  const iconName = team.lucideIcon;
  const IconComponent = iconName ? ICON_MAP[iconName] : null;

  if (IconComponent) {
    // PLL/WLL team — render icon in gold
    return (
      <span className={className} style={{ color: '#ffd700', display: 'inline-block', verticalAlign: 'middle' }}>
        <IconComponent size={size} />
      </span>
    );
  }

  // Olympic team — render country flag emoji
  return (
    <span className={className} style={{ fontSize: size, lineHeight: 1, display: 'inline-block', verticalAlign: 'middle' }}>
      {team.flag}
    </span>
  );
}