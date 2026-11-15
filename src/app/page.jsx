'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import { RESUME_TEMPLATES as builtInTemplates } from '@/lib/resume/templates';
import {
  ArrowRight,
  ChevronDown,
  ArrowUpRight,
  Check,
} from 'lucide-react';

const FAQS = [
  {
    q: 'Is export really free?',
    a: 'Yes. You can download print-ready vector A4 PDFs and native Microsoft Word (.docx) files without payment gates, watermark traps, or surprise checkout screens.',
  },
  {
    q: 'Will the exported file match what I see on screen?',
    a: 'Yes. The editor enforces exact A4 page geometry with millimeter margins. The preview reflects your actual print boundaries, so lines and pages don’t shift when downloaded.',
  },
  {
    q: 'How does Wiser AI improve bullets without making things up?',
    a: 'Wiser operates under a strict truthful policy: it never manufactures fake companies, revenue numbers, or unearned achievements. If a bullet is already well phrased and effective, it leaves it alone.',
  },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      {/* ─── Minimal Header ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#090a0f]/90 border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLockup size={24} showTagline={false} />
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs text-zinc-400">
                  {user?.name?.split(' ')[0] || 'Member'}
                </span>
                <Link
                  href="/dashboard"
                  className="py-2 px-3.5 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-1.5"
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-1.5 px-3.5 rounded-lg text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-1"
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          Write your resume.{' '}
          <span className="text-zinc-400 font-normal block sm:inline">
            Export clean PDF or Word.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Real A4 page layout, grounded bullet upgrades that don’t invent facts, and instant export without watermark traps or subscriptions.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="py-3 px-6 rounded-xl font-semibold text-sm bg-white text-zinc-950 hover:bg-zinc-200 shadow-md transition-all inline-flex items-center gap-2 active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Open Studio Workspace' : 'Start Building Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/builder"
            className="py-3 px-5 rounded-xl font-medium text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all"
          >
            Open Live Canvas
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-500 font-mono">
          Free export • Calibrated A4 margins • Zero paywalls
        </p>
      </section>

      {/* ─── Clean Product Preview ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f17] p-2 sm:p-4 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Editor snippet */}
            <div className="md:col-span-5 p-4 rounded-xl bg-[#111420] border border-white/[0.05] space-y-3 text-left">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                <span className="font-semibold text-zinc-200">Experience Editor</span>
                <span className="font-mono text-[10px] text-zinc-500">Georgia • 10pt</span>
              </div>
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-white text-[11px]">
                  <span>Lead Systems Architect</span>
                  <span className="text-[#C88A58] font-mono">Apex Labs</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  • Engineered event streaming pipeline in Go &amp; Kafka, processing 1.2B daily messages at &lt;18ms p99 latency.
                </p>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  • Directed multi-region cloud disaster recovery protocol across AWS and GCP, maintaining 99.995% SLA.
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono pt-1">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3 h-3" /> Factual scope verified
                </span>
                <span>14mm Margins</span>
              </div>
            </div>

            {/* Right: Rendered A4 Sheet preview */}
            <div className="md:col-span-7 bg-[#161822] p-4 sm:p-6 rounded-xl flex justify-center">
              <div className="w-full max-w-sm bg-white text-zinc-900 p-5 rounded shadow-lg text-[9px] font-sans border border-zinc-200 text-left">
                <div className="text-center pb-2 mb-2 border-b border-zinc-300">
                  <h2 className="text-sm font-bold text-zinc-900 tracking-tight font-serif">ALEXANDER VANCE</h2>
                  <p className="text-[8px] text-zinc-600 mt-0.5">
                    San Francisco, CA • alex.vance@work.io • +1 (415) 890-1234
                  </p>
                </div>
                <div className="mb-2">
                  <h3 className="text-[9px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-0.5 mb-1 font-serif">
                    Experience
                  </h3>
                  <div className="flex justify-between font-bold text-zinc-800 text-[8.5px]">
                    <span>Lead Systems Architect — Apex Labs</span>
                    <span className="text-zinc-500 font-normal">2022 – Present</span>
                  </div>
                  <p className="text-[8px] text-zinc-600 mt-0.5">
                    • Engineered event streaming pipeline in Go &amp; Kafka, processing 1.2B daily messages at &lt;18ms latency.
                  </p>
                  <p className="text-[8px] text-zinc-600">
                    • Directed multi-region disaster recovery protocol across AWS and GCP, maintaining 99.995% SLA.
                  </p>
                </div>
                <div>
                  <h3 className="text-[9px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-200 pb-0.5 mb-1 font-serif">
                    Technical Stack
                  </h3>
                  <p className="text-[8px] text-zinc-700">
                    Go, Rust, TypeScript, Python, Kubernetes, Kafka, PostgreSQL, Redis, AWS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3 Clear Essentials ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 border-t border-white/[0.06] w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Print-exact A4 layout</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              What you see in the editor matches your downloaded PDF. No surprise second-page overflows, awkward line wraps, or margin shifting.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Grounded AI upgrades</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Wiser AI clarifies your engineering outcomes without fabricating fake numbers, fake companies, or buzzwords. If a bullet is already good, it leaves it alone.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Free PDF &amp; Word export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Export high-resolution vector PDF and native Microsoft Word (.docx) files directly. No watermark traps or subscription walls.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Curated Formats ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 border-t border-white/[0.06] w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Curated Typography Formats</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Typeset with balanced font pairings and clear visual hierarchy.</p>
          </div>
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="text-xs text-[#D49A6A] hover:underline font-medium inline-flex items-center gap-1"
          >
            <span>Browse all</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {builtInTemplates.slice(0, 4).map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-xl border border-white/[0.06] bg-[#0d0f17] flex flex-col justify-between hover:border-white/[0.15] transition-all text-left"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                  {tpl.tag || 'Standard'}
                </span>
                <h3 className="text-sm font-semibold text-white">{tpl.name}</h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-white/[0.04]">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/register'}
                  className="text-xs text-zinc-300 hover:text-white font-medium inline-flex items-center gap-1 transition-colors"
                >
                  <span>Use format</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Minimal FAQ ─── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14 border-t border-white/[0.06] w-full">
        <h2 className="text-lg font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
        <div className="space-y-2.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIdx === idx;
            return (
              <div
                key={faq.q}
                className="rounded-xl border border-white/[0.06] bg-[#0d0f17] overflow-hidden text-left"
              >
                <button
                  onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                  className="w-full py-3.5 px-4 flex items-center justify-between text-xs sm:text-sm font-medium text-white hover:text-[#F3D5B5] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 shrink-0 ml-2 ${
                      isOpen ? 'rotate-180 text-[#C88A58]' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04] pt-2.5">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto border-t border-white/[0.06] py-8 text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrandLockup size={20} showTagline={false} />
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <a href="mailto:pagewises@gmail.com" className="hover:text-zinc-300 transition-colors">
              pagewises@gmail.com
            </a>
            <span>•</span>
            <p>© {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}