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

  // Theme accents (Sarvam AI Inspired: Warm Terracotta Sand / Muted Champagne / Soft Stone Slate)
  colors: {
    primary: '#C88A58',       // Soothing Earthen Sand / Terracotta
    primaryHover: '#B87A47',
    primaryMuted: '#8E5A30',
    primaryGlow: 'rgba(200, 138, 88, 0.14)',
    primarySurface: 'rgba(200, 138, 88, 0.07)',
    primaryBorder: 'rgba(200, 138, 88, 0.22)',

    secondary: '#10B981',     // Soft Sage Emerald
    secondarySurface: 'rgba(16, 185, 129, 0.07)',
    secondaryBorder: 'rgba(16, 185, 129, 0.20)',

    accentDark: '#0C0D10',    // Warm Charcoal Obsidian
    surfaceCard: '#13151B',   // Warm Slate Surface
    surfaceSubtle: '#181A22', // Slightly elevated surface
    borderSubtle: 'rgba(255, 255, 255, 0.065)',
    borderHover: 'rgba(255, 255, 255, 0.13)',

    textPrimary: '#EDEDF2',   // Soft eye-soothing off-white
    textMuted: '#8E94A5',     // Stone Gray
    textSubtle: '#545A6D',
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
                  ? 'rgba(99, 102, 241, 0.12)'
                  : displayBadge.toLowerCase().includes('day')
                  ? 'rgba(200, 138, 88, 0.12)'
                  : BRAND_CONFIG.colors.primarySurface,
                color: displayBadge.toLowerCase().includes('pro')
                  ? '#a5b4fc'
                  : displayBadge.toLowerCase().includes('day')
                  ? '#D49A6A'
                  : BRAND_CONFIG.colors.primary,
                borderColor: displayBadge.toLowerCase().includes('pro')
                  ? 'rgba(99, 102, 241, 0.28)'
                  : displayBadge.toLowerCase().includes('day')
                  ? 'rgba(200, 138, 88, 0.28)'
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
