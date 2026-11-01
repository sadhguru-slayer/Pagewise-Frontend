'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { BRAND_CONFIG, BrandLogo, BrandLockup } from '@/lib/brand';
import { RESUME_TEMPLATES as builtInTemplates } from '@/lib/resume/templates';
import {
  FileText,
  Award,
  ArrowRight,
  CheckCircle2,
  Download,
  FileCode,
  Layout,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Eye,
  Sliders,
  Check,
  Target,
  Upload,
  Sparkles,
  Bookmark,
  FileDown,
  Split,
  ChevronDown,
  ArrowUpRight,
  RefreshCw,
  Search,
} from 'lucide-react';

// ─── Interactive Role Previews for the Live ATS Widget ─────────────────────────
const SAMPLE_ATS_ROLES = [
  {
    role: 'Staff Infrastructure Engineer',
    company: 'Stripe',
    score: 96,
    badge: 'Exceptional Alignment',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    matchedSkills: ['Distributed Systems', 'Go / Rust', 'Kubernetes', 'High Throughput', 'Raft Consensus', 'Kafka'],
    missingGaps: ['eBPF Observability'],
    critique: 'Outstanding quantifiable metrics and system impact verbs. Core distributed primitives match recruiter search vectors.',
  },
  {
    role: 'Lead Fullstack Architect',
    company: 'Figma',
    score: 93,
    badge: 'High Interview Probability',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    matchedSkills: ['React / Next.js', 'TypeScript', 'WebAssembly / Canvas', 'System Design', 'Performance Optimization'],
    missingGaps: ['CRDT Synchronization'],
    critique: 'Front-end performance tuning and component architecture are well-documented with concrete percentage improvements.',
  },
  {
    role: 'AI / ML Research Lead',
    company: 'Anthropic',
    score: 91,
    badge: 'ATS Top Tier',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    matchedSkills: ['PyTorch', 'LLM Alignment', 'Distributed Training', 'Transformer Architecture', 'RLHF Pipelines'],
    missingGaps: ['CUDA Kernel Optimization'],
    critique: 'High keyword density across frontier model evaluations. Publication citations and benchmark gains parse cleanly.',
  },
];

// ─── Comparison Data: PageWise vs Generic Tools ──────────────────────────────
const COMPARISONS = [
  {
    feature: 'Dual PDF & DOCX Native Export',
    pagewise: 'Headless browser print A4 PDF + true styled Word (.docx)',
    others: 'Distorted HTML screenshots; Word export broken or paywalled',
  },
  {
    feature: 'Job Description Keyword Audit',
    pagewise: 'Real-time 0-100% ATS score with skill gap extraction',
    others: 'Generic spellcheck or no JD comparison capability',
  },
  {
    feature: 'Career Branching & Versioning',
    pagewise: 'Clone master resumes into role-specific targeted branches',
    others: 'Overwrites existing resume; forces you to start from scratch',
  },
  {
    feature: 'Real-Time A4 Page Geometry',
    pagewise: 'Visual multi-sheet pagination with millimeter margin controls',
    others: 'Surprise page cuts; random single lines pushed onto page 2',
  },
  {
    feature: 'Pricing & Export Access',
    pagewise: '100% Free Workspace during v2.5 release — zero surprise paywalls',
    others: '$19-$29/month subscription traps when you click "Download"',
  },
];

// ─── FAQ Items ────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How does the PageWise ATS Analyzer verify my resume?',
    a: 'Our intelligence engine scans your resume against your target Job Description across four vital dimensions: keyword density, missing core competencies, section structural hierarchy, and quantifiable impact phrasing. It computes a predictive 0–100% match score so you know your resume will clear automated enterprise scanners.',
  },
  {
    q: 'Can I export both PDF and Microsoft Word (.docx)?',
    a: 'Yes. PageWise features a dual export pipeline. You can export pixel-perfect, print-calibrated A4 PDFs rendered via our headless engine, or generate native, fully formatted Microsoft Word (.docx) documents with correct headings and bullet styles.',
  },
  {
    q: 'What is Resume Branching and why does it matter?',
    a: 'Instead of having a single generic resume or repeatedly retyping past experience, PageWise allows you to maintain a single Master Resume Architecture. Whenever you apply to a specific company or role, you create a targeted branch linked to that job description while leaving your master version untouched.',
  },
  {
    q: 'Can I import my existing PDF resume?',
    a: 'Absolutely. The built-in PDF Import modal parses your existing PDF resume, extracts contact headers, work history, education, and skills, and loads them directly into our structured rich-text editor in seconds.',
  },
  {
    q: 'Are my career data and personal information secure?',
    a: 'Yes. Your account is protected by industry-standard bcrypt hashing and JWT token authorization. PageWise does not monetize or sell candidate data to third-party recruiters.',
  },
];

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [activeStudioTab, setActiveStudioTab] = useState('studio'); // 'studio' | 'jd' | 'branches' | 'export'
  const [selectedRoleIdx, setSelectedRoleIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);

  const activeRole = SAMPLE_ATS_ROLES[selectedRoleIdx];

  return (
    <div className="min-h-screen bg-[#090B10] text-[#F1F3F9] flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* ─── NAVIGATION ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#090B10]/85 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo with BrandLockup */}
          <Link href="/" className="group flex items-center">
            <BrandLockup size={28} showTagline={true} />
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-[#7E869B]">
            <a href="#studio-preview" className="hover:text-amber-400 transition-colors">
              Live Studio
            </a>
            <a href="#ats-engine" className="hover:text-amber-400 transition-colors">
              ATS Intelligence
            </a>
            <a href="#features" className="hover:text-amber-400 transition-colors">
              Core Architecture
            </a>
            <a href="#templates" className="hover:text-amber-400 transition-colors">
              Formats Library
            </a>
            <a href="#comparison" className="hover:text-amber-400 transition-colors">
              Why PageWise
            </a>
            <a href="#faq" className="hover:text-amber-400 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs font-medium text-[#7E869B]">
                  Signed in as <span className="text-[#F1F3F9] font-semibold">{user?.name?.split(' ')[0] || 'Architect'}</span>
                </span>
                <Link
                  href="/dashboard"
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                    boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
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
                  className="py-2 px-3 sm:px-4 text-xs font-semibold text-[#7E869B] hover:text-[#F1F3F9] hover:bg-white/[0.04] rounded-xl transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all inline-flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                    boxShadow: `0 4px 18px ${BRAND_CONFIG.colors.primaryGlow}`,
                  }}
                >
                  <span>Launch Free</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-16 sm:pt-24 pb-20 overflow-hidden">
        {/* Subtle Background Glows matching Brand Amber / Titanium */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[440px] blur-[150px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.18) 0%, rgba(16,185,129,0.06) 60%, transparent 100%)' }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold mb-6 shadow-sm">
            <BrandLogo size={16} />
            <span>Industrial-Grade Resume Craft &amp; ATS Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-[#F1F3F9] tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Resume Craft with Precision.{' '}
            <span className="block mt-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Zero ATS Guesswork.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#7E869B] max-w-2xl mx-auto leading-relaxed">
            A high-fidelity visual workspace engineered for ambitious professionals. Draft with live A4 pagination, audit against job descriptions with real-time keyword scoring, branch custom versions per job application, and export print-ready PDF and editable Word DOCX.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-sm text-white shadow-xl inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                boxShadow: `0 8px 24px ${BRAND_CONFIG.colors.primaryGlow}`,
              }}
            >
              <span>{isAuthenticated ? 'Enter Studio Workspace' : 'Launch Studio Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="#studio-preview"
              className="w-full sm:w-auto py-3.5 px-7 rounded-xl font-semibold text-sm text-[#F1F3F9] hover:bg-white/[0.05] border border-white/[0.1] inline-flex items-center justify-center gap-2 transition-all"
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span>Explore Interactive Studio</span>
            </a>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#7E869B] font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[#F1F3F9]">100% Free Workspace during v2.5</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[#F1F3F9]">Real-Time 0–100% ATS Audit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[#F1F3F9]">Headless Dual PDF &amp; DOCX Export</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[#F1F3F9]">Private &amp; Secure JWT Storage</span>
            </div>
          </div>

          {/* ─── INTERACTIVE STUDIO SIMULATION MOCKUP ──────────────────────── */}
          <div id="studio-preview" className="mt-14 max-w-6xl mx-auto text-left scroll-mt-24">
            {/* Interactive Feature Tabs */}
            <div className="flex items-center justify-center sm:justify-start gap-1 p-1 mb-3 rounded-2xl bg-[#0E1118] border border-white/[0.07] max-w-fit mx-auto sm:mx-0 overflow-x-auto">
              {[
                { id: 'studio', label: '3-Pane Visual Studio', icon: Sliders },
                { id: 'jd', label: 'JD Keyword Analyzer', icon: Target },
                { id: 'branches', label: 'Job-Targeted Branches', icon: Split },
                { id: 'export', label: 'Dual Export Engine', icon: Download },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeStudioTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStudioTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'text-[#7E869B] hover:text-[#F1F3F9]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Studio Frame */}
            <div
              className="rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderHover,
              }}
            >
              {/* Top Studio Control Bar */}
              <div className="px-4 py-3 bg-[#0B0D13] border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />
                  <span className="text-xs font-mono text-[#F1F3F9] font-bold flex items-center gap-1.5">
                    <span className="text-amber-500">Staff Distributed Systems Engineer</span>
                    <span className="text-[#7E869B] font-normal hidden sm:inline">— Targeted for Stripe</span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>ATS 96% Aligned</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] text-[#7E869B] border border-white/[0.06] hidden md:inline">
                    Inter Tech • 10.5pt
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    Dual Export Ready
                  </span>
                </div>
              </div>

              {/* Dynamic Tab Views */}
              {activeStudioTab === 'studio' && (
                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
                  {/* Left Pane: Section Architect */}
                  <div className="hidden md:block md:col-span-3 border-r border-white/[0.07] p-4 bg-[#0B0D13] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#7E869B] font-bold">
                        Section Layout
                      </span>
                      <span className="text-[10px] font-mono bg-white/[0.06] px-1.5 py-0.5 rounded text-[#7E869B]">
                        5 Active
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { title: 'Contact & Identity', active: false },
                        { title: 'Executive Summary', active: false },
                        { title: 'Work Experience', active: true, count: '4 roles' },
                        { title: 'Education & Honors', active: false },
                        { title: 'Technical Stack', active: false },
                      ].map((sec) => (
                        <div
                          key={sec.title}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                            sec.active
                              ? 'bg-amber-500/10 border-amber-500/40 text-[#F1F3F9] font-bold'
                              : 'bg-white/[0.02] border-white/[0.05] text-[#7E869B]'
                          }`}
                        >
                          <span className="truncate">{sec.title}</span>
                          {sec.active ? (
                            <span className="text-[10px] font-mono text-amber-400">{sec.count}</span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-white/[0.2]" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Section Margin & Divider Preview */}
                    <div className="pt-3 border-t border-white/[0.07] space-y-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E869B]">
                        Geometry &amp; Dividers
                      </span>
                      <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 text-[11px] font-mono text-[#7E869B]">
                        <div className="flex justify-between">
                          <span>Margins:</span>
                          <span className="text-[#F1F3F9]">14mm A4 Standard</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Divider:</span>
                          <span className="text-[#F1F3F9]">Solid Warm Titanium</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle Pane: Rich Editor */}
                  <div className="col-span-12 md:col-span-4 border-r border-white/[0.07] p-5 bg-[#0F1219] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.06]">
                        <span className="text-xs font-bold text-[#F1F3F9] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" />
                          <span>Experience Editor</span>
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Tiptap Rich Engine
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-[#0B0D13] border border-white/[0.06] text-xs">
                          <div className="flex justify-between font-bold text-[#F1F3F9] text-xs mb-1">
                            <span>Principal Distributed Systems Engineer</span>
                            <span className="text-amber-500 font-mono text-[11px]">Apex Labs</span>
                          </div>
                          <p className="text-[11px] text-[#7E869B] leading-relaxed">
                            • Architected event-driven ingestion pipeline processing <span className="text-amber-300 font-semibold">1.4B messages/day</span> with p99 latency &lt; 18ms using Go &amp; Apache Kafka.
                          </p>
                          <p className="text-[11px] text-[#7E869B] leading-relaxed mt-1.5">
                            • Led multi-region failover migration across AWS and GCP, achieving <span className="text-emerald-400 font-semibold">99.995% service uptime</span> SLA.
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-[11px] text-[#7E869B]">
                          <span className="font-semibold text-[#F1F3F9]">💡 Real-Time AI Suggestion:</span> Strong quantifiable verbs detected. Keyword &quot;Raft Consensus&quot; matches Stripe&apos;s JD.
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#7E869B]">
                      <span>Page Status: Sheet 1 of 1</span>
                      <span className="text-amber-500 font-mono">0 Overflow Detected</span>
                    </div>
                  </div>

                  {/* Right Pane: Live Rendered A4 Preview */}
                  <div className="col-span-12 md:col-span-5 p-6 bg-[#161922] flex items-center justify-center overflow-hidden">
                    <div className="w-full max-w-sm bg-white text-zinc-900 p-5 rounded-lg shadow-2xl text-[10px] font-sans scale-[0.98] transition-transform">
                      {/* Resume Header */}
                      <div className="text-center pb-2.5 mb-2.5 border-b border-zinc-200">
                        <h2 className="text-base font-extrabold text-zinc-900 tracking-tight">ALEXANDER VANCE</h2>
                        <p className="text-[9px] text-zinc-600 mt-0.5">
                          San Francisco, CA • alex.vance@work.io • +1 (415) 890-1234 • github.com/avance
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="mb-2.5">
                        <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-0.5 mb-1">
                          Executive Summary
                        </h3>
                        <p className="text-[9.5px] text-zinc-700 leading-relaxed">
                          Distributed systems engineer with 8+ years specializing in high-throughput consensus protocols, resilient cloud architectures, and cloud-native Kubernetes infrastructure.
                        </p>
                      </div>

                      {/* Experience */}
                      <div className="mb-2.5">
                        <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-0.5 mb-1">
                          Work Experience
                        </h3>
                        <div className="flex justify-between font-bold text-zinc-800 text-[9.5px]">
                          <span>Lead Infrastructure Architect — Apex Labs</span>
                          <span className="text-zinc-500 font-normal">2022 – Present</span>
                        </div>
                        <p className="text-[9px] text-zinc-600 mt-0.5">
                          • Designed event streaming pipeline scaling to 1.4B msgs/day with &lt;18ms p99 latency.
                        </p>
                        <p className="text-[9px] text-zinc-600">
                          • Directed zero-downtime failover across US-East and EU-West regions.
                        </p>
                      </div>

                      {/* Education */}
                      <div>
                        <h3 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider border-b border-amber-200 pb-0.5 mb-1">
                          Technical Competencies
                        </h3>
                        <p className="text-[9px] text-zinc-700">
                          <strong className="text-zinc-900">Languages &amp; Runtimes:</strong> Go, Rust, TypeScript, Python, C++
                        </p>
                        <p className="text-[9px] text-zinc-700">
                          <strong className="text-zinc-900">Platforms &amp; Systems:</strong> Kubernetes, Kafka, gRPC, PostgreSQL, Redis, AWS
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: JD Analyzer */}
              {activeStudioTab === 'jd' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="max-w-2xl">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                      Built-in Intelligence
                    </span>
                    <h3 className="text-xl font-bold text-[#F1F3F9] mt-1">
                      Paste Any Job Description. Extract Missing Skills in 2 Seconds.
                    </h3>
                    <p className="text-xs text-[#7E869B] mt-1">
                      PageWise parses the recruiter&apos;s exact job requirements and maps them against your resume content.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-4 rounded-2xl bg-[#0B0D13] border border-white/[0.07] space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#F1F3F9]">Stripe Staff Engineer Job Description</span>
                        <span className="text-[10px] font-mono text-amber-500">Parsed 840 words</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] font-mono text-[#7E869B] leading-relaxed max-h-40 overflow-y-auto">
                        &quot;We are looking for a Staff Engineer to own our distributed ledger primitives. Required: Deep experience in consensus protocols (Raft/Paxos), multi-region active-active architectures, Go or Rust, high-throughput message buses...&quot;
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0B0D13] border border-white/[0.07] space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[#F1F3F9]">Audit Score Breakdown</span>
                        <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          96% Ready
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-[#7E869B]">Core Primitives Matched:</span>
                          <span className="text-emerald-400 font-mono font-semibold">6 of 7 Detected</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-[#7E869B]">Missing Skill Gap:</span>
                          <span className="text-amber-400 font-mono font-semibold">eBPF Observability</span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                          <span className="text-[#7E869B]">Quantified Bullet Score:</span>
                          <span className="text-emerald-400 font-mono font-semibold">100% Impact Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Job-Targeted Branches */}
              {activeStudioTab === 'branches' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                      Cross-Resume Architecture
                    </span>
                    <h3 className="text-xl font-bold text-[#F1F3F9] mt-1">
                      One Master Career Inventory. Infinite Job-Targeted Clones.
                    </h3>
                    <p className="text-xs text-[#7E869B] mt-1">
                      Never overwrite your career achievements. Branch tailored resumes for specific job listings with 1 click.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-[#0B0D13] border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-amber-500 font-bold">Core Master</span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <h4 className="font-bold text-sm text-[#F1F3F9]">Master Architectural Inventory</h4>
                      <p className="text-[11px] text-[#7E869B]">Canonical repository of all career roles, credentials, and achievements.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0B0D13] border border-white/[0.07] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Targeted Clone</span>
                        <span className="text-[10px] font-mono text-emerald-400">96% Match</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#F1F3F9]">Staff Systems Engineer — Stripe</h4>
                      <p className="text-[11px] text-[#7E869B]">Calibrated for consensus, distributed primitives, and financial ledger scale.</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0B0D13] border border-white/[0.07] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Targeted Clone</span>
                        <span className="text-[10px] font-mono text-emerald-400">93% Match</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#F1F3F9]">Lead Cloud Platform — Datadog</h4>
                      <p className="text-[11px] text-[#7E869B]">Emphasis on telemetry, high-cardinality databases, and Kubernetes clusters.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Dual Export Engine */}
              {activeStudioTab === 'export' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 font-bold">
                      Dual Output Pipeline
                    </span>
                    <h3 className="text-xl font-bold text-[#F1F3F9] mt-1">
                      True Headless PDF &amp; Native Word DOCX Generation
                    </h3>
                    <p className="text-xs text-[#7E869B] mt-1">
                      Export print-calibrated A4 PDFs for humans and structured Word documents for strict legacy recruiter portals.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="p-5 rounded-2xl bg-[#0B0D13] border border-white/[0.07] flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <FileDown className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#F1F3F9]">Pixel-Perfect A4 PDF</h4>
                        <p className="text-xs text-[#7E869B] mt-1 leading-relaxed">
                          Rendered via an isolated headless browser engine. Exact typography rendering, vector lines, and no accidental browser print clipping.
                        </p>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#0B0D13] border border-white/[0.07] flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#F1F3F9]">Fully Styled Microsoft Word (.docx)</h4>
                        <p className="text-xs text-[#7E869B] mt-1 leading-relaxed">
                          Clean XML document structure with native Word headings, paragraphs, and list numbering. 100% editable by recruiters.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LIVE ATS ENGINE INTERACTIVE AUDIT SHOWCASE ─────────────────────── */}
      <section id="ats-engine" className="py-20 border-t border-white/[0.08] bg-[#0B0D13] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Predictive ATS Engine
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight">
              Test What Recruiter Scanners Actually See
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#7E869B]">
              Select a benchmark enterprise position below to inspect how PageWise maps keywords, evaluates density, and audits ATS pass probability in real-time.
            </p>
          </div>

          {/* Interactive Role Switcher */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {SAMPLE_ATS_ROLES.map((r, idx) => (
              <button
                key={r.role}
                onClick={() => setSelectedRoleIdx(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  selectedRoleIdx === idx
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'bg-white/[0.03] text-[#7E869B] border border-white/[0.06] hover:text-[#F1F3F9]'
                }`}
              >
                <span>{r.role}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-zinc-400">
                  {r.company}
                </span>
              </button>
            ))}
          </div>

          {/* Live Analysis Display Card */}
          <div
            className="max-w-4xl mx-auto rounded-3xl p-6 sm:p-8 border shadow-xl relative"
            style={{
              background: BRAND_CONFIG.colors.surfaceCard,
              borderColor: BRAND_CONFIG.colors.borderSubtle,
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/[0.07]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E869B]">
                  Target Profile
                </span>
                <h3 className="text-xl font-bold text-[#F1F3F9] mt-0.5">
                  {activeRole.role} @ {activeRole.company}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E869B] block">
                    Predicted Match
                  </span>
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {activeRole.score}%
                  </span>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${activeRole.badgeColor}`}>
                  {activeRole.badge}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Matched Keywords */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#F1F3F9] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Verified Keyword Matches</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {activeRole.matchedSkills.length} High-Weight Terms
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeRole.matchedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/25"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Competencies */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#F1F3F9] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Recommended Skill Inclusions</span>
                  </span>
                  <span className="text-[10px] font-mono text-amber-400">
                    {activeRole.missingGaps.length} Suggested Term
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeRole.missingGaps.map((gap) => (
                    <span
                      key={gap}
                      className="text-xs px-2.5 py-1 rounded-lg font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                    >
                      + {gap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Critique Feedback */}
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/[0.06] text-xs text-[#7E869B] flex items-start gap-3">
              <span className="text-amber-500 font-bold shrink-0">💡 Engine Evaluation:</span>
              <span className="text-zinc-300">{activeRole.critique}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CORE ARCHITECTURE & FEATURES GRID ───────────────────────────────── */}
      <section id="features" className="py-20 border-t border-white/[0.08] bg-[#090B10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Engineering Excellence
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight">
              Architected for Precision, Speed, and Results
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#7E869B]">
              Say goodbye to broken Word formatting and rigid PDF templates. PageWise puts complete, granular control over your professional career assets in your hands.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-amber-400 transition-colors">
                Real-Time Multi-Pane Live Studio
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Watch your resume render simultaneously on authentic A4 paper as you type. Reorder sections with drag-and-drop handles, customize divider thicknesses, and dial in page margins down to the millimeter.
              </p>
            </div>

            {/* Feature 2 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-emerald-400 transition-colors">
                Deep JD Keyword Intelligence
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Paste any job description from LinkedIn, Greenhouse, or Lever. Our analyzer automatically extracts critical technical terms, highlights missing competencies, and scores ATS alignment before you submit.
              </p>
            </div>

            {/* Feature 3 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-sky-400 transition-colors">
                Dual Headless PDF &amp; Word Export
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Generate high-definition print-ready A4 PDFs via our dedicated headless browser rendering engine, or export native Microsoft Word (.docx) documents with proper header hierarchies and clean bullet styling.
              </p>
            </div>

            {/* Feature 4 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Split className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-purple-400 transition-colors">
                Career Asset Branching &amp; Versioning
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Maintain a canonical Master Resume Architecture. Branch role-specific copies tailored to individual companies without losing or overwriting your original accomplishments.
              </p>
            </div>

            {/* Feature 5 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-orange-400 transition-colors">
                PDF Resume Import &amp; Auto-Parse
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Already have a resume in PDF format? Upload it directly into PageWise. Our parser extracts your contact info, work experiences, skills, and dates into editable rich-text sections in seconds.
              </p>
            </div>

            {/* Feature 6 */}
            <div
              className="p-7 rounded-2xl border transition-all duration-300 group hover:border-amber-500/40"
              style={{
                background: BRAND_CONFIG.colors.surfaceCard,
                borderColor: BRAND_CONFIG.colors.borderSubtle,
              }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-600/20 text-amber-500 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F1F3F9] mb-2 group-hover:text-amber-400 transition-colors">
                Export Vault &amp; Custom Presets
              </h3>
              <p className="text-xs text-[#7E869B] leading-relaxed">
                Every exported resume file is logged with its target job title, company name, and template in your personal archive for instant re-download. Save your custom typography styles as reusable templates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEMPLATES & FORMAT LIBRARY SHOWCASE ─────────────────────────────── */}
      <section id="templates" className="py-20 border-t border-white/[0.08] bg-[#0B0D13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                Industry-Calibrated Formats
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight">
                Curated Typography &amp; Layout Architectures
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#7E869B] max-w-xl">
                Every template in PageWise is designed to pass the 6-second recruiter visual scan and conform to strict Applicant Tracking System parser standards.
              </p>
            </div>

            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 self-start md:self-auto cursor-pointer"
            >
              <span>Explore all formats in Studio</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {builtInTemplates.slice(0, 4).map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl p-5 border flex flex-col justify-between transition-all duration-300 group hover:border-amber-500/40"
                style={{
                  background: BRAND_CONFIG.colors.surfaceCard,
                  borderColor: BRAND_CONFIG.colors.borderSubtle,
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-semibold">
                      {tpl.tag || 'Standard'}
                    </span>
                    <span className="text-[10px] font-mono text-[#7E869B]">
                      {tpl.settings?.bodyFont?.split(',')[0]}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-[#F1F3F9] group-hover:text-amber-400 transition-colors">
                    {tpl.name}
                  </h3>

                  <p className="text-xs text-[#7E869B] mt-2 line-clamp-3 leading-relaxed">
                    {tpl.description}
                  </p>

                  <div className="mt-4 p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-1.5 text-[11px] font-mono text-[#7E869B]">
                    <div className="flex justify-between">
                      <span>Target Field:</span>
                      <span className="text-[#F1F3F9] font-sans truncate max-w-[110px]">{tpl.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Header Style:</span>
                      <span className="text-[#F1F3F9] font-sans capitalize">{tpl.header?.alignment || 'Left'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/[0.06]">
                  <Link
                    href={isAuthenticated ? '/dashboard' : '/register'}
                    className="w-full py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-amber-600 hover:text-white text-[#F1F3F9] transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Use Format</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPARISON TABLE: PAGEWISE VS GENERIC TOOLS ────────────────────── */}
      <section id="comparison" className="py-20 border-t border-white/[0.08] bg-[#090B10]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              The Transparent Alternative
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight">
              Why Professionals Choose PageWise
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#7E869B]">
              No hidden download fees, no broken Word layouts, and zero automated lock-ins.
            </p>
          </div>

          <div
            className="max-w-4xl mx-auto rounded-3xl border overflow-hidden shadow-2xl"
            style={{
              background: BRAND_CONFIG.colors.surfaceCard,
              borderColor: BRAND_CONFIG.colors.borderSubtle,
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/[0.07] bg-[#0B0D13] text-[10px] font-mono uppercase tracking-wider text-[#7E869B]">
                  <tr>
                    <th className="py-3.5 px-5">Capability / Workflow</th>
                    <th className="py-3.5 px-5 text-amber-400 font-bold">PageWise Studio</th>
                    <th className="py-3.5 px-5">Traditional Resume Builders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {COMPARISONS.map((row) => (
                    <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5 font-semibold text-[#F1F3F9]">{row.feature}</td>
                      <td className="py-4 px-5 font-medium text-emerald-300">
                        <div className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{row.pagewise}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-[#7E869B]">{row.others}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ACCORDION ───────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-white/[0.08] bg-[#0B0D13]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#F1F3F9] tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border transition-all overflow-hidden"
                  style={{
                    background: BRAND_CONFIG.colors.surfaceCard,
                    borderColor: isOpen ? 'rgba(217, 119, 6, 0.35)' : BRAND_CONFIG.colors.borderSubtle,
                  }}
                >
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full py-4 px-5 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-[#F1F3F9] hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#7E869B] transition-transform duration-200 shrink-0 ml-3 ${
                        isOpen ? 'rotate-180 text-amber-500' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs text-[#7E869B] leading-relaxed border-t border-white/[0.04] pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM HERO CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-white/[0.08] relative overflow-hidden text-center bg-[#090B10]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(217,119,6,0.12) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ready to Elevate Your Applications?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#F1F3F9] tracking-tight">
            Stop Fighting Rigid Templates.
            <span className="block mt-1 text-amber-400">Start Crafting with Precision.</span>
          </h2>

          <p className="mt-4 text-xs sm:text-sm text-[#7E869B] max-w-xl mx-auto leading-relaxed">
            Join software architects, engineering leaders, and data scientists using PageWise to land interviews at top-tier companies.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="py-3.5 px-8 rounded-xl font-bold text-sm text-white shadow-xl inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${BRAND_CONFIG.colors.primary}, ${BRAND_CONFIG.colors.primaryHover})`,
                boxShadow: `0 8px 24px ${BRAND_CONFIG.colors.primaryGlow}`,
              }}
            >
              <span>{isAuthenticated ? 'Open Studio Workspace' : 'Launch Studio Free Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] py-10 bg-[#07080C] text-xs text-[#7E869B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <BrandLockup size={24} showTagline={false} />
            <span className="text-[#4A5063] hidden sm:inline">•</span>
            <span className="text-[11px] text-[#7E869B]">
              Industrial-Grade Resume Craft with Deep ATS Intelligence
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Studio Engine v2.5 Online</span>
            </span>
            <p>© {new Date().getFullYear()} {BRAND_CONFIG.name}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
