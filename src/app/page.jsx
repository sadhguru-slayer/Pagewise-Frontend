'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
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
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-[#08090e] text-zinc-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* ─── NAVIGATION ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#08090e]/80 border-b border-zinc-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Resumo
            </span>
          </Link>

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#templates" className="hover:text-white transition-colors">
              Templates
            </a>
          </nav>

          {/* Right CTA */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-md shadow-blue-600/25 inline-flex items-center gap-1.5 transition-all"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-xl transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-md shadow-blue-600/25 inline-flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Sign Up Free</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6 shadow-sm">
            <Award className="w-3.5 h-3.5" />
            <span>Next-Gen Professional Resume Builder</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Build Impressive Resumes That{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Win Interviews.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Create pixel-perfect, ATS-compliant resumes with real-time visual editing, custom typography, drag-and-drop sections, and instant export to both PDF and Microsoft Word.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="w-full sm:w-auto py-3.5 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-xl shadow-xl shadow-blue-600/25 inline-flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span>{isAuthenticated ? 'Open Dashboard' : 'Create Free Resume'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            {!isAuthenticated && (
              <Link
                href="/login"
                className="w-full sm:w-auto py-3.5 px-8 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-sm sm:text-base rounded-xl border border-zinc-800 inline-flex items-center justify-center gap-2 transition-all"
              >
                <span>Sign In to Account</span>
              </Link>
            )}
          </div>

          {/* Trust bullets */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>100% Free Workspace</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dual Export: PDF & DOCX</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Credit Card Required</span>
            </div>
          </div>

          {/* ─── HERO INTERACTIVE PREVIEW MOCKUP ──────────────────────────────── */}
          <div className="mt-16 max-w-5xl mx-auto rounded-3xl border border-zinc-800/80 bg-[#12141c]/90 p-3 sm:p-5 shadow-2xl backdrop-blur-xl relative">
            <div className="rounded-2xl border border-zinc-800 bg-[#0d0f17] overflow-hidden">
              {/* Window Controls */}
              <div className="px-4 py-3 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <span className="ml-3 text-xs text-zinc-400 font-medium">Resumo Studio — Live Editor & Preview</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-semibold">
                    Auto-saved
                  </span>
                  <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-md font-semibold">
                    PDF & Word Ready
                  </span>
                </div>
              </div>

              {/* Mockup Body */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-0 min-h-[380px]">
                {/* Mockup Left Sidebar */}
                <div className="hidden md:block md:col-span-4 border-r border-zinc-800/80 p-4 bg-[#090b12] text-left">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Sections</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded">6 Active</span>
                  </div>
                  <div className="space-y-2">
                    {['Header & Contact', 'Professional Summary', 'Work Experience', 'Education', 'Skills & Tools', 'Key Projects'].map((sec, i) => (
                      <div
                        key={sec}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          i === 2
                            ? 'border-blue-500/50 bg-blue-500/10 text-white font-semibold'
                            : 'border-zinc-800/80 bg-zinc-900/30 text-zinc-400'
                        }`}
                      >
                        <span>{sec}</span>
                        {i === 2 && <span className="w-2 h-2 rounded-full bg-blue-400" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mockup Resume Preview */}
                <div className="col-span-12 md:col-span-8 p-6 sm:p-8 flex items-center justify-center bg-[#151722]/60">
                  <div className="w-full max-w-md bg-white text-zinc-900 p-6 rounded-lg shadow-xl text-left font-sans text-[11px]">
                    <div className="text-center border-b pb-3 mb-3 border-zinc-200">
                      <h2 className="text-base font-bold text-zinc-900 tracking-tight">ALEX MORGAN</h2>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        alex.morgan@example.com • +1 (555) 234-5678 • San Francisco, CA
                      </p>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide border-b border-blue-200 pb-0.5 mb-1">
                        Professional Summary
                      </h3>
                      <p className="text-[10px] text-zinc-600 leading-relaxed">
                        Results-driven software engineer with 6+ years of experience architecting cloud systems and leading high-velocity frontend teams.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wide border-b border-blue-200 pb-0.5 mb-1">
                        Work Experience
                      </h3>
                      <div className="flex justify-between font-semibold text-zinc-800">
                        <span>Lead Software Engineer — Apex Labs</span>
                        <span className="text-zinc-500 font-normal">2021 – Present</span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        • Spearheaded microservices refactor delivering 45% reduction in latency.
                      </p>
                      <p className="text-[10px] text-zinc-600">
                        • Mentored 8 junior and mid-level engineers across product teams.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ───────────────────────────────────────────────────── */}
      <section id="features" className="py-20 border-t border-zinc-800/60 bg-[#0a0c13]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Everything You Need</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Crafted for Precision, Speed, and Results
            </p>
            <p className="mt-3 text-base text-zinc-400">
              Stop fighting rigid Word templates or broken PDF converters. Resumo gives you complete control over your job application presentation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-5">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Live Visual Editing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                See exactly how your resume looks on paper in real-time. Edit rich text, drag-and-drop sections, and tweak page margins dynamically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-5">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Dual PDF & Word Export</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Export print-ready A4 PDFs with pixel precision, or generate fully styled Microsoft Word (.docx) documents with bullet lists and headers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Resume Management Dashboard</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Create tailored versions of your resume for different jobs. Save unlimited drafts, duplicate variations, and track export history.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <FileCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Export History & Re-Download</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Every exported resume is securely cataloged in your user dashboard, allowing you to instantly download previous versions anytime.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">ATS Optimization</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Structured HTML and Word hierarchy ensures automated Applicant Tracking Systems parse your contact information, experience, and skills accurately.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl bg-[#12141c]/80 border border-zinc-800/80 hover:border-zinc-700 transition-all">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Secure JWT Authentication</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Your data is protected with industry-standard bcrypt encryption and JWT sessions. Each user strictly accesses only their own resumes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-t border-zinc-800/60 bg-[#08090e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400">Effortless Workflow</h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Three Simple Steps to Your New Resume
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-blue-600/20 text-blue-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                1
              </div>
              <h3 className="font-bold text-white text-base mb-2">Choose a Starter</h3>
              <p className="text-sm text-zinc-400">
                Select from professionally curated templates or start from a blank canvas tailored to your industry.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                2
              </div>
              <h3 className="font-bold text-white text-base mb-2">Customize Content & Styles</h3>
              <p className="text-sm text-zinc-400">
                Fill in your accomplishments, adjust typography, colors, and dividers while previewing changes live.
              </p>
            </div>

            <div className="text-center p-6 rounded-2xl bg-zinc-900/30 border border-zinc-800/80">
              <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 font-bold text-lg flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                3
              </div>
              <h3 className="font-bold text-white text-base mb-2">Export & Apply</h3>
              <p className="text-sm text-zinc-400">
                Download your resume in pixel-perfect PDF or editable Word (.docx) format and send it directly to recruiters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 border-t border-zinc-800/60 bg-gradient-to-b from-[#0a0c13] to-[#08090e] relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Build Your Standout Resume?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-xl mx-auto">
            Join thousands of professionals landing jobs at top tech, finance, and creative companies.
          </p>

          <div className="mt-8">
            <Link
              href={isAuthenticated ? '/dashboard' : '/register'}
              className="py-3.5 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm sm:text-base rounded-xl shadow-xl shadow-blue-600/25 inline-flex items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free Now'}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-800/60 py-8 bg-[#06070a] text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-zinc-300">Resumo</span>
            <span>— Modern Resume Builder & Studio</span>
          </div>

          <p>© {new Date().getFullYear()} Resumo. Built with Next.js & FastAPI.</p>
        </div>
      </footer>
    </div>
  );
}
