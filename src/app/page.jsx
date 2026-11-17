'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { useAuth } from '@/lib/auth-context';
import { RESUME_TEMPLATES as builtInTemplates } from '@/lib/resume/templates';
import { DEFAULT_PLANS } from '@/lib/plans';
import { paymentsApi, blogsApi } from '@/lib/api';
import {
  ArrowRight,
  ChevronDown,
  ArrowUpRight,
  Check,
  Layers,
  Search,
  Download,
  FileText,
  Shield,
  Zap,
  CheckCircle2,
  Clock,
  BookOpen,
} from 'lucide-react';

const FAQS = [
  {
    q: 'Is export really free?',
    a: 'Yes. You can download print-ready vector A4 PDFs and native Microsoft Word (.docx) files without payment gates, watermark traps, or surprise checkout screens.',
  },
  {
    q: 'Will the exported file match what I see on screen?',
    a: 'Yes. The editor enforces exact A4 page geometry (210mm x 297mm) with millimeter margins. The preview reflects your actual print boundaries, so lines and pages don’t shift when downloaded.',
  },
  {
    q: 'How does Wiser AI improve bullets without making things up?',
    a: 'Wiser operates under a strict truthful policy: it never manufactures fake companies, revenue numbers, or unearned achievements. It sharpens technical scope, replaces weak phrasing, and leaves already-effective bullets untouched.',
  },
  {
    q: 'Can I maintain multiple tailored resumes for different roles?',
    a: 'Yes. PageWise supports career asset branching. You can maintain a canonical Master Resume and spawn tailored copies targeted to specific job descriptions without overwriting your history.',
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [latestBlogs, setLatestBlogs] = useState([]);
  const [activeTabDemo, setActiveTabDemo] = useState('editor'); // 'editor' | 'ats'

  useEffect(() => {
    // Fetch live public plans
    paymentsApi
      .getPublicPlans()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((t) => ({
            id: t.tier_key,
            name: t.name,
            tagline: t.tagline || '',
            price: t.discount_price_inr === 0 ? '₹0' : `₹${t.discount_price_inr}`,
            period: t.billing_period_text || (t.duration_days ? `for ${t.duration_days} days` : 'forever'),
            badge: t.badge || '',
            badgeColor:
              t.tier_key === 'pilot'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : t.tier_key === 'pro_monthly'
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]',
            popular: t.tier_key === 'pilot' || t.tier_key === 'pro_monthly',
            buttonText: t.tier_key === 'pilot' ? 'Claim Pilot Access' : 'Get Started',
            features: t.features || [],
          }));
          setPlans(formatted);
        }
      })
      .catch((err) => {
        console.warn('Falling back to static plans:', err);
      });

    // Fetch latest blog posts for visibility
    blogsApi
      .list({ page: 1, limit: 3 })
      .then((res) => {
        setLatestBlogs(res.items || []);
      })
      .catch((err) => {
        console.warn('Failed to load blog posts on landing:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      {/* ─── Modular Site Header ─── */}
      <SiteHeader activePage="home" />

      {/* ─── Hero Section ─── */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C88A58] inline-block animate-pulse" /> Free Vector PDF &amp; Word (.docx) Export · Zero Watermarks
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          Write your resume with CAD precision.{' '}
          <span className="text-zinc-400 font-normal block sm:inline">
            Export vector PDF or native Word.
          </span>
        </h1>

        <p className="mt-5 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Calibrated A4 visual geometry, truthful AI bullet polishing that never hallucinates fake metrics, and deep ATS keyword matching without watermark traps.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={isAuthenticated ? '/dashboard' : '/register'}
            className="py-3 px-6 rounded-xl font-semibold text-xs sm:text-sm bg-white text-zinc-950 hover:bg-zinc-200 shadow-md transition-all inline-flex items-center gap-2 active:scale-[0.98]"
          >
            <span>{isAuthenticated ? 'Open Studio Workspace' : 'Start Building Free'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/builder"
            className="py-3 px-5 rounded-xl font-medium text-xs sm:text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all"
          >
            Open Live Canvas
          </Link>
        </div>

        <p className="mt-4 text-xs text-zinc-500 font-mono">
          Free export • 210x297mm A4 Margins • Zero Paywall Traps
        </p>
      </section>

      {/* ─── Interactive Demonstration Preview ─── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 w-full">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f17] p-2 sm:p-4 shadow-2xl">
          {/* Top Demo Toggle Bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] mb-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-zinc-400 hidden sm:inline">
                pagewise-engine-v2.5 // A4-preview.pdf
              </span>
            </div>

            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/[0.06]">
              <button
                onClick={() => setActiveTabDemo('editor')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTabDemo === 'editor'
                    ? 'bg-white text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Experience Editor
              </button>
              <button
                onClick={() => setActiveTabDemo('ats')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  activeTabDemo === 'ats'
                    ? 'bg-[#C88A58] text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                ATS Matcher View
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left: Editor / ATS Snippet */}
            <div className="md:col-span-5 p-4 rounded-xl bg-[#111420] border border-white/[0.05] space-y-3 text-left">
              {activeTabDemo === 'editor' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                    <span className="font-semibold text-zinc-200">ATS Keyword Telemetry</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">92% Match</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-zinc-400">Hard Competencies</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                          ✓ Go (Golang)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                          ✓ Kafka Event Streaming
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                          ✓ Kubernetes Orchestration
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                      💡 Suggested: Clarify multi-region deployment topology in Bullet 2.
                    </div>
                  </div>
                </>
              )}
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

      {/* ─── 4 Core Architectural Advantages ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.06] w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Designed for high-signal engineering careers
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-zinc-400">
            Traditional resume builders were designed for quick templates. PageWise was engineered for technical rigor.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
          <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[#D49A6A]">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Millimeter A4 Layout</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              What you see in the editor strictly matches your downloaded PDF. Zero surprise second-page overflows or shifting margins.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-emerald-400">
              <Search className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Deconstructed ATS Analysis</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Match your resume against any job description. Identifies missing industry competencies and structural parsing flags.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Grounded Wiser AI</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Sharpens engineering impact without fabricating fake metrics or fake titles. Truth-checked suggestions you can safely verify.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sky-400">
              <Download className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Dual PDF &amp; Word Export</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Native vector PDF and editable Microsoft Word (.docx) formats with selectable text and zero watermark gates.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/features"
            className="text-xs text-[#D49A6A] hover:underline font-mono inline-flex items-center gap-1"
          >
            <span>Read full technical features breakdown</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ─── Typography & Formats ─── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 border-t border-white/[0.06] w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Curated Typography Formats</h2>
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

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 border-t border-white/[0.06] w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/20 text-[#D49A6A] text-[11px] font-mono mb-4">
            <Shield className="w-3.5 h-3.5" /> Transparent, Fair Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Plans built for every stage of your search
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400">
            No sneaky subscriptions or watermark traps. Build free forever, or unlock advanced Wiser AI evaluations and multi-resume workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPilot = plan.id === 'pilot';
            const isPro = plan.id === 'pro_monthly';
            const isDayPass = plan.id === 'day_pass';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                  isPilot
                    ? 'bg-gradient-to-b from-[#181a24] to-[#0d0f17] border-2 border-amber-500/40 shadow-xl shadow-amber-500/5'
                    : isPro
                    ? 'bg-[#0f111a] border border-indigo-500/30 shadow-lg'
                    : 'bg-[#0d0f17] border border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="mb-3">
                    <span
                      className={`inline-block text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                        plan.badgeColor || 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[32px] leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-white/[0.06]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {plan.price}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        {plan.period}
                      </span>
                    </div>
                  </div>

                  {/* Feature list */}
                  <ul className="mt-5 space-y-2.5 text-xs text-zinc-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#C88A58] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action button */}
                <div className="mt-8 pt-4 border-t border-white/[0.04]">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/register'}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                      isPilot
                        ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 font-bold shadow-md'
                        : isPro
                        ? 'bg-white text-zinc-950 hover:bg-zinc-200 shadow'
                        : isDayPass
                        ? 'bg-[#C88A58] text-white hover:bg-[#B87A47]'
                        : 'bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.08]'
                    }`}
                  >
                    <span>{isAuthenticated ? 'Go to Workspace' : plan.buttonText || 'Get Started'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="text-xs text-[#D49A6A] hover:underline font-mono inline-flex items-center gap-1"
          >
            <span>View complete plan comparison &amp; billing FAQ</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* ─── Latest Insights from Blog (SEO & Authority) ─── */}
      {latestBlogs.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.06] w-full">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#D49A6A] font-semibold mb-1">
                Editorial &amp; Insights
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Latest from the Engineering Blog
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-xs text-[#D49A6A] hover:underline font-medium inline-flex items-center gap-1 font-mono"
            >
              <span>View all articles</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestBlogs.map((b) => (
              <article
                key={b.id}
                className="p-5 rounded-2xl border border-white/[0.06] bg-[#0d0f17] flex flex-col justify-between hover:border-white/[0.14] transition-all group text-left"
              >
                <div>
                  {b.cover_image_url && (
                    <div className="rounded-xl overflow-hidden aspect-video mb-3.5 bg-zinc-900 border border-white/[0.04]">
                      <img
                        src={b.cover_image_url}
                        alt={b.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    {b.tags?.[0] && (
                      <span className="text-[10px] font-mono text-[#D49A6A] bg-[#C88A58]/10 px-2 py-0.5 rounded border border-[#C88A58]/20">
                        {b.tags[0]}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {b.reading_time_minutes}m
                    </span>
                  </div>

                  <Link href={`/blog/${b.slug}`}>
                    <h3 className="text-sm font-bold text-white group-hover:text-[#F3D5B5] transition-colors line-clamp-2 leading-snug">
                      {b.title}
                    </h3>
                  </Link>

                  <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {b.summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.04] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 text-[11px] font-mono">{b.author_name}</span>
                  <Link
                    href={`/blog/${b.slug}`}
                    className="text-zinc-300 group-hover:text-white inline-flex items-center gap-1 text-xs"
                  >
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ─── Minimal FAQ ─── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.06] w-full">
        <h2 className="text-xl font-bold text-white text-center mb-6">Frequently Asked Questions</h2>
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

      {/* ─── Bottom High-Conversion Banner ─── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 w-full text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#141624] to-[#0c0e15] border border-white/[0.08] shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Ready to build an industrial-grade resume?
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Design pixel-calibrated resumes with millimeter margins. Clean vector exports, deep ATS scoring, zero surprises.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="py-3 px-6 rounded-xl font-semibold text-xs bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <span>{isAuthenticated ? 'Open Studio Workspace' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Site Footer ─── */}
      <SiteFooter />
    </div>
  );
}
