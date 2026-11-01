'use client';

import React from 'react';

/**
 * Single source of truth for Resumo brand identity and visual styling.
 * Edit this file to change the logo, brand name, tagline, or accent themes across the whole app.
 */
export const BRAND_CONFIG = {
  name: 'PageWise',
  shortName: 'PageWise',
  suffix: 'Studio',
  tagline: 'Resume Craft with Precision',
  description: 'Industrial-grade resume craft with deep ATS analysis and cross-resume intelligence.',
  version: 'v2.5',

  // Theme accents (Warm Bronze / Amber / Precision Titanium - NO generic purple/cyan!)
  colors: {
    primary: '#D97706',       // Warm Amber / Bronze
    primaryHover: '#B45309',
    primaryMuted: '#92400E',
    primaryGlow: 'rgba(217, 119, 6, 0.22)',
    primarySurface: 'rgba(217, 119, 6, 0.08)',
    primaryBorder: 'rgba(217, 119, 6, 0.28)',

    secondary: '#10B981',     // Precision Emerald (for success/matched ATS)
    secondarySurface: 'rgba(16, 185, 129, 0.08)',
    secondaryBorder: 'rgba(16, 185, 129, 0.24)',

    accentDark: '#0A0B0E',    // Deep Void Obsidian
    surfaceCard: '#111319',   // Precision Titanium Slate
    surfaceSubtle: '#161922', // Slightly elevated surface
    borderSubtle: 'rgba(255, 255, 255, 0.07)',
    borderHover: 'rgba(255, 255, 255, 0.14)',

    textPrimary: '#F1F3F9',
    textMuted: '#7E869B',
    textSubtle: '#4A5063',
  },
};

/**
 * PageWise Dynamic Brand Logo Component.
 * Geometric monolith glyph representing structural precision and progressive elevation.
 */
export function BrandLogo({ size = 28, className = '', showDot = false }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform group-hover:scale-105 duration-300"
      >
        {/* Subtle background tile */}
        <rect width="32" height="32" rx="8" fill="#141722" />
        <rect width="32" height="32" rx="8" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

        {/* Primary geometric tier (amber monolith pillar) */}
        <path
          d="M8 23V9L15 6V20L8 23Z"
          fill="url(#amber-pillar-grad)"
        />

        {/* Dynamic rising facet (bronze terrace) */}
        <path
          d="M17 20V6L24 9V23L17 20Z"
          fill="url(#bronze-facet-grad)"
          opacity="0.85"
        />

        {/* Center architectural notch */}
        <path
          d="M15 11.5L17 12.5V17L15 16V11.5Z"
          fill="#F59E0B"
        />

        <defs>
          <linearGradient id="amber-pillar-grad" x1="8" y1="6" x2="16" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <linearGradient id="bronze-facet-grad" x1="17" y1="6" x2="24" y2="23" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" />
            <stop offset="1" stopColor="#78350F" />
          </linearGradient>
        </defs>
      </svg>

      {showDot && (
        <span
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0A0B0E]"
          style={{ background: BRAND_CONFIG.colors.primary }}
        />
      )}
    </div>
  );
}

/**
 * Full Brand Lockup with Logo + Typography + Version Badge
 */
export function BrandLockup({
  size = 28,
  showTagline = false,
  showBadge = true,
  className = '',
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <BrandLogo size={size} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-extrabold text-base tracking-tight text-[#F1F3F9]">
            {BRAND_CONFIG.name}
          </span>
          {showBadge && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wide uppercase font-semibold"
              style={{
                background: BRAND_CONFIG.colors.primarySurface,
                color: BRAND_CONFIG.colors.primary,
                border: `1px solid ${BRAND_CONFIG.colors.primaryBorder}`,
              }}
            >
              {BRAND_CONFIG.version}
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[10px] text-[#7E869B] tracking-wider uppercase font-medium mt-0.5">
            {BRAND_CONFIG.tagline}
          </span>
        )}
      </div>
    </div>
  );
}
