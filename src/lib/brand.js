'use client';

import React from 'react';

/**
 * Single source of truth for PageWise brand identity and visual styling.
 * Minimalist, engineering-first aesthetic: deep obsidian blacks, calibrated greys, crisp whites,
 * with restrained, surgical accents.
 */
export const BRAND_CONFIG = {
  name: 'PageWise',
  shortName: 'PageWise',
  suffix: 'Studio',
  tagline: 'Resume Craft with Precision',
  description: 'Industrial-grade resume craft with deep ATS analysis and cross-resume intelligence.',
  version: 'v2.5',
  supportEmail: 'pagewises@gmail.com',

  // Minimalist SaaS Theme (Linear / Vercel monochrome precision)
  colors: {
    primary: '#FFFFFF',
    primaryHover: '#E4E4E7',
    primaryMuted: '#A1A1AA',
    primaryGlow: 'rgba(255, 255, 255, 0.05)',
    primarySurface: 'rgba(255, 255, 255, 0.06)',
    primaryBorder: 'rgba(255, 255, 255, 0.12)',

    // Warm Amber / Copper Studio Accent (Unified across Landing, Auth, Dashboard, Settings)
    accent: '#C88A58',
    accentHover: '#B87A47',
    accentLight: '#F3D5B5',
    accentDarker: '#A66A3A',
    accentSurface: 'rgba(200, 138, 88, 0.10)',
    accentBorder: 'rgba(200, 138, 88, 0.25)',
    accentGlow: 'rgba(200, 138, 88, 0.18)',

    secondary: '#10B981',
    secondarySurface: 'rgba(16, 185, 129, 0.08)',
    secondaryBorder: 'rgba(16, 185, 129, 0.20)',

    accentDark: '#08090D',
    surfaceCard: '#0E1017',
    surfaceSubtle: '#14161F',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderHover: 'rgba(255, 255, 255, 0.18)',

    textPrimary: '#F4F4F5',
    textMuted: '#A1A1AA',
    textSubtle: '#71717A',
  },
};

/**
 * Standardized Button Styling Classes across PageWise.
 * Enforces crisp text contrast (strictly dark text on white backgrounds, never white-on-white).
 */
export const BUTTON_STYLES = {
  // Primary CTA: High-contrast crisp white with deep dark text
  primary:
    'bg-white text-zinc-950 hover:bg-zinc-100 font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  // Accent CTA: Studio warm copper-amber with white text
  accent:
    'bg-[#C88A58] hover:bg-[#B87A47] text-white font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  // Secondary: Subtle translucent glass card with light text and subtle border
  secondary:
    'bg-white/[0.05] hover:bg-white/[0.09] text-zinc-200 hover:text-white border border-white/[0.08] transition-all cursor-pointer disabled:opacity-50',
  // Ghost: Text-only with subtle hover background
  ghost:
    'text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer',
};

/**
 * PageWise Official Brand Logo Component.
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
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-black bg-white"
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
          <span className="font-extrabold text-base tracking-tight text-white">
            {BRAND_CONFIG.name}
          </span>
          {showBadge && (
            <span
              className="text-[9px] font-mono px-1.5 py-0.5 rounded tracking-wide uppercase font-semibold border bg-white/[0.06] text-zinc-300 border-white/[0.12]"
            >
              {displayBadge}
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-medium mt-0.5">
            {BRAND_CONFIG.tagline}
          </span>
        )}
      </div>
    </div>
  );
}
