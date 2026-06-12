'use client';

import React from 'react';

interface CustomIconProps {
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}

/**
 * Lacrosse stick icon — a crossed-stick design representing the sport.
 * Gold-accented for the bracket predictor theme.
 */
export function LacrosseStick({ className = '', style, size = 24 }: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Stick 1: shaft from bottom-left to upper area, head at top */}
      <line x1="4" y1="20" x2="10" y2="8" />
      <path d="M10 8 C10 4, 14 2, 16 4 C18 6, 16 10, 14 10" />
      {/* Stick 2: shaft from bottom-right to upper area, head at top */}
      <line x1="20" y1="20" x2="14" y2="8" />
      <path d="M14 8 C14 4, 10 2, 8 4 C6 6, 8 10, 10 10" />
      {/* Small ball */}
      <circle cx="12" cy="14" r="1.5" />
    </svg>
  );
}

/**
 * Longhorns bull icon for Atlas (New York Atlas — Texas Longhorns reference).
 * Gold-accented for the bracket predictor theme.
 */
export function Longhorns({ className = '', style, size = 24 }: CustomIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Bull head — narrower oval */}
      <ellipse cx="12" cy="14.5" rx="3.5" ry="5.5" />
      {/* Left horn — extends out horizontally then curls UP at tip */}
      <path d="M8.5 11 C6 11, 3 10, 1 5" />
      {/* Right horn — extends out horizontally then curls UP at tip */}
      <path d="M15.5 11 C18 11, 21 10, 23 5" />
      {/* Eyes */}
      <circle cx="10" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
      {/* Nostrils */}
      <ellipse cx="10.5" cy="16.5" rx="0.6" ry="0.4" fill="currentColor" stroke="none" />
      <ellipse cx="13.5" cy="16.5" rx="0.6" ry="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}