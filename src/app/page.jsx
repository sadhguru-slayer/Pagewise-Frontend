'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLockup } from '@/lib/brand';
import PilotBanner from '@/components/ui/PilotBanner';
import { RESUME_TEMPLATES as builtInTemplates } from '@/lib/resume/templates';
import {
  FileText,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCode,
  Layout,
  ShieldCheck,
  Zap,
  Sliders,
  Check,
  Target,
  Split,
  ChevronDown,
  ArrowUpRight,
  Eye,
  FileDown,
  Sparkles,
  Layers,
  Lock,
  AlertTriangle,
  ArrowDownToLine,
} from 'lucide-react';

// ─── Curated FAQ Items ────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Does PageWise charge a subscription fee when I click Download?',
    a: 'No. Both print-calibrated A4 PDF export and native Microsoft Word (.docx) export are fully available in your workspace without surprise paywalls, watermark traps, or hidden checkout screens.',
  },
  {
    q: 'Will my exported PDF look exactly like the preview on my screen?',
    a: 'Yes. PageWise renders exported PDFs using an isolated, print-calibrated A4 layout engine. Your typography, millimeter margins, rules, and line wraps match pixel-for-pixel between the visual editor and your downloaded document.',
  },
  {
    q: 'How does Wiser AI improve my resume without fabricating facts?',
    a: 'Wiser operates under a strict factual reliability policy. It never manufactures unearned achievements, company names, or quantitative metrics. Instead, it strengthens active phrasing, clarifies engineering scope, and highlights missing industry competencies for you to verify.',
  },
  {
    q: 'Can I maintain different resumes for different job applications?',
    a: 'Yes. PageWise supports career asset branching. You maintain a single canonical Master Resume with your complete career history, and branch customized copies tailored to specific job listings without losing or overwriting your original accomplishments.',
  },
];

// ─── Comparison: PageWise vs Traditional Builders ───────────────────────────
const COMPARISONS = [
  {
    feature: 'Page Geometry & Pagination',
    pagewise: 'Real-time A4 sheet boundaries with millimeter margin control — zero surprise page breaks',
    others: 'Distorted web previews; single orphan lines pushed onto an unwanted second page',
  },
  {
    feature: 'AI Writing & Suggestions',
    pagewise: 'Grounded, evidence-checked phrasing with explicit confirmation prompts for metrics',
    others: 'Fabricated numbers, generic buzzwords ("spearheaded visionary synergy"), and robotic phrasing',
  },
  {
    feature: 'Export Formats',
    pagewise: 'True vector print-calibrated A4 PDF and native, editable Microsoft Word (.docx)',
    others: 'Low-res raster screenshots, broken Word conversions, or paywalled download buttons',
  },
  {
    feature: 'Version Management',
    pagewise: 'Master career repository with 1-click job-targeted branches',
    others: 'Overwrites existing resume; forces you to start over for each application',
  },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [activePreviewTab, setActivePreviewTab] = useState('editor'); // 'editor' | 'ai' | 'export'
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  return (
    <div className="min-h-screen bg-[#08090D] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/25 selection:text-[#F3D5B5]">
      {/* ─── Top Pilot Announcement ─── */}
      <PilotBanner variant="topbar" />

      {/* ─── Navigation Bar ─── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08090D]/85 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="group flex items-center">
            <BrandLockup size={26} showTagline={false} />
          </Link>

          {/* Centered Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#8E94A5]">
            <a href="#studio" className="hover:text-white transition-colors">
              Studio
            </a>
            <a href="#craft" className="hover:text-white transition-colors">
              Craft &amp; Accuracy
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Typography
            </a>
            <a href="#comparison" className="hover:text-white transition-colors">
              Why PageWise
            </a>
            <a href="#faq" className="hover:text-white transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-medium text-[#8E94A5]">
                  Signed in as <span className="text-white font-semibold">{user?.name?.split(' ')[0] || 'Member'}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5 shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #C88A58, #B87A47)',
                    boxShadow: '0 2px 12px rgba(200, 138, 88, 0.25)',
                  }}
                >
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="py-2 px-3 sm:px-4 text-xs font-medium text-[#8E94A5] hover:text-white hover:bg-white/[0.04] rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-white transition-all inline-flex items-center gap-1.5 shadow-sm hover:opacity-95"
                  style={{
                    background: 'linear-gradient(135deg, #C88A58, #B87A47)',
                    boxShadow: '0 2px 14px rgba(200, 138, 88, 0.25)',
                  }}
                >
                  <span>Start Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-16 sm:pt-24 pb-16 overflow-hidden">
        {/* Subtle Warm Lighting Glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[850px] h-[360px] blur-[160px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(200, 138, 88, 0.12) 0%, rgba(16, 185, 129, 0.04) 50%, transparent 100%)',
          }}
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Subtle Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-[#C88A58] font-medium mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C88A58]" />
            <span>Designed for professionals who value typographic precision</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.08] max-w-4xl mx-auto">
            The resume studio{' '}
            <span className="block mt-1 bg-gradient-to-r from-[#F3D5B5] via-[#C88A58] to-[#E5A874] bg-clip-text text-transparent">
              engineered for craft.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#8E94A5] max-w-2xl mx-auto leading-relaxed font-normal">
            A distraction-free visual workspace with real-time A4 page geometry, grounded AI bullet refinements that never invent facts, and pixel-perfect PDF and Word export.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-sm text-white shadow-lg inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #C88A58, #B87A47)',
                boxShadow: '0 4px 20px rgba(200, 138, 88, 0.28)',
              }}
            >
              <span>{isAuthenticated ? 'Open Studio Workspace' : 'Start Drafting — It’s Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#studio"
              className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-medium text-sm text-[#EDEDF2] hover:bg-white/[0.05] border border-white/[0.08] inline-flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-[#C88A58]" />
              <span>Explore Studio Preview</span>
            </a>
          </div>

          {/* Calm trust strip */}
          <p className="mt-5 text-xs text-[#545A6D] font-mono">
            Zero surprise download paywalls • Print-calibrated A4 layout • Private local-first storage
          </p>
        </div>

        {/* ─── LIVE STUDIO INTERACTIVE SHOWCASE ─── */}
        <div id="studio" className="mt-14 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
          {/* Preview Navigation Tabs */}
          <div className="flex items-center justify-center sm:justify-start gap-1 p-1 mb-3 rounded-2xl bg-[#0D0E14] border border-white/[0.06] max-w-fit mx-auto sm:mx-0 overflow-x-auto">
            {[
              { id: 'editor', label: '1. Visual A4 Canvas', icon: Layout },
              { id: 'ai', label: '2. Grounded AI Writing', icon: Sparkles },
              { id: 'export', label: '3. Dual PDF & Word Export', icon: Download },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activePreviewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#C88A58]/15 text-[#F3D5B5] border border-[#C88A58]/30 shadow-sm'
                      : 'text-[#8E94A5] hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Studio Container Shell */}
          <div
            className="rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-xl bg-[#0F1117] border-white/[0.08]"
          >
            {/* Top Workspace Bar */}
            <div className="px-4 py-3 bg-[#0B0C11] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="h-4 w-px bg-white/[0.08] hidden sm:block" />
                <span className="font-mono text-zinc-300 font-medium">
                  Alexander Vance — Senior Systems Architect
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#8E94A5] border border-white/[0.06]">
                  Sheet 1 of 1 (Calibrated A4)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  0 Overflow
                </span>
                <span className="px-2 py-0.5 rounded bg-[#C88A58]/10 text-[#C88A58] border border-[#C88A58]/20 font-medium">
                  PDF &amp; DOCX Ready
                </span>
              </div>
            </div>

            {/* View 1: Visual A4 Canvas */}
            {activePreviewTab === 'editor' && (
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
                {/* Left: Editor Panel */}
                <div className="col-span-12 md:col-span-5 p-5 bg-[#0C0E14] border-r border-white/[0.06] flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.06] text-xs">
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-[#C88A58]" />
                        <span>Experience Editor</span>
                      </span>
                      <span className="font-mono text-[10px] text-[#8E94A5]">
                        Georgia • 10.5pt
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] text-xs space-y-2">
                      <div className="flex justify-between font-bold text-white">
                        <span>Lead Distributed Systems Architect</span>
                        <span className="text-[#C88A58] font-mono text-[11px]">Apex Labs</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        • Engineered high-throughput event streaming pipeline in Go &amp; Kafka, processing <strong className="text-white">1.2B daily messages</strong> at &lt;18ms p99 latency.
                      </p>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        • Spearheaded multi-region cloud disaster recovery protocol across AWS and GCP, maintaining <strong className="text-white">99.995% SLA</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-[#8E94A5] space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px] uppercase font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Factual Accuracy Check</span>
                      </div>
                      <p>All metrics and technical claims match your candidate profile.</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-[#8E94A5] font-mono">
                    <span>14mm Margins Calibrated</span>
                    <span className="text-emerald-400">Page 1 Fits Perfectly</span>
                  </div>
                </div>

                {/* Right: Rendered A4 Sheet Preview */}
                <div className="col-span-12 md:col-span-7 p-6 bg-[#14161F] flex items-center justify-center overflow-hidden">
                  <div className="w-full max-w-md bg-white text-zinc-900 p-6 rounded-lg shadow-2xl text-[10px] font-sans scale-[0.98] transition-transform">
                    {/* Header */}
                    <div className="text-center pb-2.5 mb-2.5 border-b border-zinc-200">
                      <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">ALEXANDER VANCE</h2>
                      <p className="text-[9px] text-zinc-600 mt-0.5">
                        San Francisco, CA • alex.vance@work.io • +1 (415) 890-1234 • github.com/avance
                      </p>
                    </div>

                    {/* Summary */}
                    <div className="mb-2.5">
                      <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">
                        Executive Summary
                      </h3>
                      <p className="text-[9px] text-zinc-700 leading-relaxed">
                        Systems architect with 8+ years specializing in distributed consensus protocols, resilient cloud primitives, and cloud-native Kubernetes infrastructure.
                      </p>
                    </div>

                    {/* Experience */}
                    <div className="mb-2.5">
                      <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">
                        Work Experience
                      </h3>
                      <div className="flex justify-between font-bold text-zinc-800 text-[9px]">
                        <span>Lead Distributed Systems Architect — Apex Labs</span>
                        <span className="text-zinc-500 font-normal">2022 – Present</span>
                      </div>
                      <p className="text-[8.5px] text-zinc-600 mt-0.5">
                        • Engineered high-throughput event streaming pipeline in Go &amp; Kafka, processing 1.2B daily messages at &lt;18ms p99 latency.
                      </p>
                      <p className="text-[8.5px] text-zinc-600">
                        • Directed zero-downtime failover across multi-region clusters, achieving 99.995% SLA.
                      </p>
                    </div>

                    {/* Skills */}
                    <div>
                      <h3 className="text-[10px] font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-300 pb-0.5 mb-1">
                        Technical Competencies
                      </h3>
                      <p className="text-[8.5px] text-zinc-700">
                        <strong className="text-zinc-900">Languages &amp; Runtimes:</strong> Go, Rust, TypeScript, Python, C++
                      </p>
                      <p className="text-[8.5px] text-zinc-700">
                        <strong className="text-zinc-900">Platforms:</strong> Kubernetes, Kafka, gRPC, PostgreSQL, Redis, AWS
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Grounded AI Writing */}
            {activePreviewTab === 'ai' && (
              <div className="p-6 sm:p-8 space-y-6 bg-[#0C0E14]">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C88A58] font-semibold">
                    Evidence-Based AI Polish
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    Defensible Phrasing. Zero Hallucinations.
                  </h3>
                  <p className="text-xs text-[#8E94A5] mt-1 leading-relaxed">
                    Wiser AI improves your bullet points using the actual scope of your work, rather than generating robotic corporate buzzwords or fabricating unverified metrics.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Unrefined bullet */}
                  <div className="p-5 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-zinc-500 font-semibold">
                        Original Draft (Vague)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        Passive Voice
                      </span>
                    </div>
                    <p className="text-zinc-400 italic leading-relaxed text-[11px] line-through">
                      &quot;Responsible for database caching and helped improve query speed across the backend API.&quot;
                    </p>
                    <p className="text-[11px] text-[#545A6D]">
                      Lacks technical specificity, individual ownership, and concrete engineering outcome.
                    </p>
                  </div>

                  {/* Refined bullet */}
                  <div className="p-5 rounded-xl bg-[#111420] border border-[#C88A58]/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#C88A58] font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#C88A58]" />
                        <span>Wiser Recommended Upgrade</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        ✓ Source Verified
                      </span>
                    </div>
                    <p className="text-white leading-relaxed text-[11px]">
                      &quot;Architected distributed query caching layer using Redis, reducing API p95 response time from 180ms to 42ms.&quot;
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                      <span className="text-[10px] text-[#8E94A5]">
                        Clear technical action + measurable outcome
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ArrowDownToLine className="w-3 h-3" />
                        <span>Apply at Cursor</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View 3: Dual PDF & Word Export */}
            {activePreviewTab === 'export' && (
              <div className="p-6 sm:p-8 space-y-6 bg-[#0C0E14]">
                <div className="max-w-2xl">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#C88A58] font-semibold">
                    Dual Export Pipeline
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                    Print-Calibrated Vector PDF &amp; Native Word DOCX
                  </h3>
                  <p className="text-xs text-[#8E94A5] mt-1 leading-relaxed">
                    Export high-definition PDFs for direct application, or clean Microsoft Word documents for corporate recruiters who need editable files.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-5 rounded-xl bg-black/40 border border-white/[0.06] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#C88A58]/10 border border-[#C88A58]/20 text-[#C88A58] flex items-center justify-center shrink-0">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">Print-Calibrated A4 PDF</h4>
                      <p className="text-xs text-[#8E94A5] mt-1 leading-relaxed">
                        Rendered with exact typography rendering and vector borders. No browser print clipping or unintended page overflow.
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl bg-black/40 border border-white/[0.06] flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-white">Native Microsoft Word (.docx)</h4>
                      <p className="text-xs text-[#8E94A5] mt-1 leading-relaxed">
                        True document headings, clean bullet points, and tabbed dates. Fully editable for legacy corporate recruiter systems.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── 4 PILLARS OF CRAFT ─── */}
      <section id="craft" className="py-20 border-t border-white/[0.06] bg-[#090A0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C88A58] font-bold">
              Engineering Craft
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for people who care about details.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#8E94A5] leading-relaxed">
              Most resume tools rely on distorted web previews and lock your downloads behind surprise subscriptions. PageWise is designed as a professional desktop-grade studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 rounded-2xl bg-[#0E1017] border border-white/[0.06] hover:border-[#C88A58]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#C88A58]/10 text-[#C88A58] flex items-center justify-center">
                <Layout className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Millimeter-Accurate A4</h3>
              <p className="text-xs text-[#8E94A5] leading-relaxed">
                See exact sheet boundaries while editing. Fine-tune margins, section spacing, and font sizes down to the half-point so your resume never spills over.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 rounded-2xl bg-[#0E1017] border border-white/[0.06] hover:border-[#C88A58]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Grounded Writing Policy</h3>
              <p className="text-xs text-[#8E94A5] leading-relaxed">
                Wiser AI never manufactures fake achievements or numbers. It polishes grammar, strengthens active phrasing, and prompts you to confirm your actual metrics.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 rounded-2xl bg-[#0E1017] border border-white/[0.06] hover:border-[#C88A58]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Dual Native Export</h3>
              <p className="text-xs text-[#8E94A5] leading-relaxed">
                Download print-ready vector PDFs and fully formatted Microsoft Word (.docx) documents. Free in your workspace without payment gates.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 rounded-2xl bg-[#0E1017] border border-white/[0.06] hover:border-[#C88A58]/30 transition-all space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Split className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-white">Master &amp; Targeted Branches</h3>
              <p className="text-xs text-[#8E94A5] leading-relaxed">
                Maintain a canonical master resume with your full history. Branch role-specific copies linked to job descriptions without overwriting your master achievements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CURATED TYPOGRAPHY TEMPLATES ─── */}
      <section id="templates" className="py-20 border-t border-white/[0.06] bg-[#08090D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#C88A58] font-bold">
                Typographic Formats
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Designed to pass the human eye and parser tests.
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#8E94A5] max-w-xl">
                Every format in PageWise is typeset with balanced font pairings, clear structural hierarchy, and readable line heights.
              </p>
            </div>

            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="text-xs text-[#C88A58] hover:text-[#F3D5B5] font-semibold inline-flex items-center gap-1 self-start md:self-auto cursor-pointer"
            >
              <span>Explore all templates in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {builtInTemplates.slice(0, 4).map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl p-5 border border-white/[0.06] bg-[#0E1017] flex flex-col justify-between hover:border-[#C88A58]/35 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-white/[0.05] text-[#C88A58] font-semibold uppercase">
                      {tpl.tag || 'Standard'}
                    </span>
                    <span className="text-[#545A6D]">
                      {tpl.settings?.bodyFont?.split(',')[0]}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-white">{tpl.name}</h3>
                  <p className="text-xs text-[#8E94A5] line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="pt-2 text-[11px] font-mono text-[#545A6D] space-y-1">
                    <div className="flex justify-between">
                      <span>Header:</span>
                      <span className="text-zinc-300 capitalize">{tpl.header?.alignment || 'Left'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Focus:</span>
                      <span className="text-zinc-300 truncate max-w-[130px]">{tpl.category?.split(',')[0]}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.05]">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/register'}
                    className="w-full py-2 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-[#C88A58] hover:text-white text-zinc-300 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Use in Studio</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HONEST COMPARISON ─── */}
      <section id="comparison" className="py-20 border-t border-white/[0.06] bg-[#090A0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C88A58] font-bold">
              Transparent Craft
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Why professionals switch to PageWise.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#8E94A5]">
              No hidden paywalls when you click download. No hallucinated AI claims.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-white/[0.06] overflow-hidden bg-[#0D0F15] shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.06] bg-[#08090D] text-[10px] font-mono uppercase tracking-wider text-[#8E94A5]">
                  <tr>
                    <th className="py-3.5 px-5">Standard</th>
                    <th className="py-3.5 px-5 text-[#C88A58] font-bold">PageWise Studio</th>
                    <th className="py-3.5 px-5">Generic Resume Generators</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {COMPARISONS.map((row) => (
                    <tr key={row.feature} className="hover:bg-white/[0.015] transition-colors">
                      <td className="py-4 px-5 font-semibold text-white">{row.feature}</td>
                      <td className="py-4 px-5 font-medium text-emerald-300">
                        <div className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{row.pagewise}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-[#8E94A5]">{row.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="py-20 border-t border-white/[0.06] bg-[#08090D]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#C88A58] font-bold">
              Common Questions
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-white/[0.06] bg-[#0D0F15] transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full py-4 px-5 flex items-center justify-between text-left text-xs sm:text-sm font-semibold text-white hover:text-[#C88A58] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#8E94A5] transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180 text-[#C88A58]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-[#8E94A5] leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ─── */}
      <section className="py-24 border-t border-white/[0.06] relative overflow-hidden text-center bg-[#090A0F]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(200, 138, 88, 0.08) 0%, transparent 65%)',
          }}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-4">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Stop fighting rigid templates.
            <span className="block mt-1 text-[#C88A58]">Start drafting with precision.</span>
          </h2>

          <p className="text-xs sm:text-sm text-[#8E94A5] max-w-lg mx-auto leading-relaxed">
            Create clean, calibrated resumes that stand out to human reviewers and parse cleanly across applicant tracking systems.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-sm text-white shadow-lg inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #C88A58, #B87A47)',
                boxShadow: '0 4px 20px rgba(200, 138, 88, 0.28)',
              }}
            >
              <span>{isAuthenticated ? 'Open Studio Workspace' : 'Start Drafting Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.06] py-10 bg-[#06070A] text-xs text-[#545A6D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <BrandLockup size={22} showTagline={false} />
            <span className="text-[#2A2E3D] hidden sm:inline">•</span>
            <span className="text-[11px] text-[#8E94A5]">
              Resume Craft with Precision
            </span>
          </div>

          <div className="flex items-center gap-5 text-[11px] font-mono flex-wrap justify-center">
            <a
              href="mailto:pagewises@gmail.com?subject=PageWise%20Feedback"
              className="text-[#C88A58] hover:underline"
            >
              pagewises@gmail.com
            </a>
            <span className="text-[#2A2E3D]">•</span>
            <span>Studio Engine v2.5</span>
            <span className="text-[#2A2E3D]">•</span>
            <p>© {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
