'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLockup } from '@/lib/brand';
import {
  FileText,
  Sliders,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileDown,
  Layers,
  Award,
} from 'lucide-react';

export default function AuthShowcasePanel({
  badge = 'PageWise Studio Suite',
  headline = 'Engineered for professionals who refuse distorted previews.',
  subline = 'Real-time multi-page A4 canvas, zero-hallucination AI refinements, and dual native Word & vector PDF export.',
}) {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#0b0d13] via-[#08090d] to-[#050608] border-r border-white/[0.08] relative overflow-hidden select-none">
      {/* Background technical grid and subtle neutral illumination */}
      <div className="absolute inset-0 subtle-grid opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-white/[0.02] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-white/[0.015] blur-[140px] rounded-full pointer-events-none" />

      {/* Top Header: Brand Lockup */}
      <div className="relative z-10">
        <Link href="/" className="inline-block group">
          <BrandLockup size={30} showTagline={true} />
        </Link>
      </div>

      {/* Middle: Live Interactive Resume Preview Simulation */}
      <div className="relative z-10 my-8 space-y-6 max-w-lg">
        {/* Studio Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 font-medium backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wide">{badge}</span>
        </div>

        {/* Headline & Mission statement */}
        <div className="space-y-2">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {headline}
          </h2>
          <p className="text-xs xl:text-sm text-zinc-400 leading-relaxed font-normal">
            {subline}
          </p>
        </div>

        {/* Mini High-Fidelity Studio Document Widget */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0e1017]/95 shadow-2xl backdrop-blur-xl p-5 space-y-3.5 relative">
          {/* Document Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="font-mono text-zinc-300 font-medium">Calibrated A4 Canvas</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                98 ATS Match
              </span>
              <span className="px-2 py-0.5 rounded bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                0 Overflow
              </span>
            </div>
          </div>

          {/* Mini Document Content Preview */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3.5 space-y-2 font-sans text-xs">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-white text-xs">Staff Infrastructure Engineer</span>
              <span className="font-mono text-[10px] text-zinc-400">2021 — Present</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              • Engineered distributed consensus pipeline in Go, handling <strong className="text-white">1.4B messages/day</strong> with &lt;12ms p99 latency.
            </p>
            <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Grounded bullet metrics verified
              </span>
              <span className="font-mono text-zinc-500">Georgia 10.5pt</span>
            </div>
          </div>

          {/* Live Pipeline Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono text-zinc-300">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <FileDown className="w-3 h-3 text-zinc-300" />
              <span>Vector PDF</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Native .DOCX</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-3 h-3 text-zinc-300" />
              <span>No Watermarks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-500">
        <span className="font-mono text-[11px]">Private Local-First Storage • AES-256</span>
        <span className="text-[11px] text-zinc-400 font-medium">PageWise v2.5</span>
      </div>
    </div>
  );
}
