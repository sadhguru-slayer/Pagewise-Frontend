'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLockup } from '@/lib/brand';
import {
  FileText,
  Sliders,
  CheckCircle2,
  ShieldCheck,
  FileDown,
  Layers,
  Award,
  ArrowLeft,
  Layout,
  Zap,
} from 'lucide-react';

export default function AuthShowcasePanel({
  badge = 'PageWise Studio Suite',
  headline = 'Engineered for professionals who refuse distorted previews.',
  subline = 'Real-time multi-page A4 canvas, zero-hallucination AI refinements, and dual native Word & vector PDF export.',
}) {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-[#0C0E14] via-[#08090D] to-[#050608] border-r border-white/[0.08] relative overflow-hidden select-none">
      {/* Background warm atmospheric glow and subtle grid */}
      <div className="absolute inset-0 subtle-grid opacity-20 pointer-events-none" />
      <div
        className="absolute top-1/4 -left-20 w-80 h-80 blur-[130px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(200, 138, 88, 0.16) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-10 right-0 w-96 h-96 blur-[150px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%)',
        }}
      />

      {/* Top Header: Brand Lockup & Back Link */}
      <div className="relative z-10 flex items-center justify-between">
        <Link href="/" className="inline-block group">
          <BrandLockup size={30} showTagline={true} />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Site</span>
        </Link>
      </div>

      {/* Middle: Live Interactive Resume Preview Simulation */}
      <div className="relative z-10 my-8 space-y-6 max-w-lg">
        {/* Studio Status Pill with Amber Accent */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-xs text-[#F3D5B5] font-medium backdrop-blur-md shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#C88A58] animate-pulse" />
          <span className="text-[11px] font-mono tracking-wide">{badge}</span>
        </div>

        {/* Headline & Mission statement */}
        <div className="space-y-2">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {headline}
          </h2>
          <p className="text-xs xl:text-sm text-[#8E94A5] leading-relaxed font-normal">
            {subline}
          </p>
        </div>

        {/* Mini High-Fidelity Studio Document Widget */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0E1017]/95 shadow-2xl backdrop-blur-xl p-5 space-y-3.5 relative">
          {/* Document Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C88A58]" />
              <span className="font-mono text-zinc-300 font-medium">Sheet 1 of 1 (Calibrated A4)</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                98 ATS Match
              </span>
              <span className="px-2 py-0.5 rounded bg-[#C88A58]/10 text-[#F3D5B5] border border-[#C88A58]/25">
                0 Overflow
              </span>
            </div>
          </div>

          {/* Mini Document Content Preview */}
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-3.5 space-y-2 font-sans text-xs">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-white text-xs">Lead Systems Architect — Apex Labs</span>
              <span className="font-mono text-[10px] text-zinc-400">2022 — Present</span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              • Engineered event streaming pipeline in Go &amp; Kafka, processing <strong className="text-white">1.2B daily messages</strong> at &lt;18ms p99 latency.
            </p>
            <div className="pt-1.5 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-400">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3 h-3" /> Factual metrics verified
              </span>
              <span className="font-mono text-[#8E94A5]">Georgia 10.5pt • 14mm</span>
            </div>
          </div>

          {/* Live Pipeline Badges */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-mono text-zinc-300">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <FileDown className="w-3 h-3 text-[#C88A58]" />
              <span>Vector PDF</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <FileText className="w-3 h-3 text-emerald-400" />
              <span>Native .DOCX</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <ShieldCheck className="w-3 h-3 text-sky-400" />
              <span>No Watermarks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="relative z-10 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#6F768A]">
        <span className="font-mono text-[11px]">Private Local-First Storage • AES-256</span>
        <span className="text-[11px] text-zinc-400 font-medium">PageWise v2.5</span>
      </div>
    </div>
  );
}
