'use client';

import React from 'react';

/**
 * Single source of truth for PageWise brand identity and visual styling.
 * Edit this file to change the logo, brand name, tagline, or accent themes across the whole app.
 */
export const BRAND_CONFIG = {
  name: 'PageWise',
  shortName: 'PageWise',
  suffix: 'Studio',
  tagline: 'Resume Craft with Precision',
  description: 'Industrial-grade resume craft with deep ATS analysis and cross-resume intelligence.',
  version: 'v2.5',
  supportEmail: 'pagewises@gmail.com',

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
 * PageWise Official Brand Logo Component.
 * Displays the high-resolution PageWise brand emblem with crisp scaling and hover dynamics.
 */
export function BrandLogo({ size = 28, className = '', showDot = false, alt = 'PageWise Studio Logo' }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-lg overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/pagewise_logo.png"
        alt={alt}
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-lg transition-transform group-hover:scale-105 duration-300 shadow-sm"
      />

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
 * Full Brand Lockup with Logo + Typography + Plan Tier Badge
 */
export function BrandLockup({
  size = 28,
  showTagline = false,
  showBadge = true,
  badgeText = null,
  className = '',
}) {
  const displayBadge = badgeText || 'Free';

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
              className="text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wide uppercase font-semibold border"
              style={{
                background: displayBadge.toLowerCase().includes('pro')
                  ? 'rgba(79, 70, 229, 0.15)'
                  : displayBadge.toLowerCase().includes('day')
                  ? 'rgba(217, 119, 6, 0.15)'
                  : BRAND_CONFIG.colors.primarySurface,
                color: displayBadge.toLowerCase().includes('pro')
                  ? '#818cf8'
                  : displayBadge.toLowerCase().includes('day')
                  ? '#fbbf24'
                  : BRAND_CONFIG.colors.primary,
                borderColor: displayBadge.toLowerCase().includes('pro')
                  ? 'rgba(79, 70, 229, 0.35)'
                  : displayBadge.toLowerCase().includes('day')
                  ? 'rgba(217, 119, 6, 0.35)'
                  : BRAND_CONFIG.colors.primaryBorder,
              }}
            >
              {displayBadge}
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
