import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { ArrowRight, Code, ShieldCheck, Heart, Terminal, Compass } from 'lucide-react';

export const metadata = {
  title: 'About PageWise Studio — Craft, Engineering & Truth in Hiring',
  description:
    'The story behind PageWise Studio: why we built an engineering-grade resume platform designed to eliminate deceptive paywalls, blurry canvas PDFs, and AI hallucinations.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <SiteHeader activePage="about" />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-4">
          <Compass className="w-3.5 h-3.5" /> Our Mission &amp; Craft
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          Built out of frustration with{' '}
          <span className="text-[#D49A6A] font-normal block sm:inline">
            predatory resume tools.
          </span>
        </h1>
        <p className="mt-5 text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Almost every engineer has experienced it: spending 45 minutes carefully filling out an online resume builder, only to be hit with a mandatory $29.99 subscription pop-up the second they click "Download".
        </p>
      </section>

      {/* Core narrative */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-12 leading-relaxed text-sm text-zinc-300">
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[#C88A58]" /> The Engineering Philosophy
          </h2>
          <p>
            PageWise was conceived with a straightforward premise: <strong>your career documents should be treated with the precision of engineering CAD</strong>.
          </p>
          <p>
            When a candidate applies for senior technical roles, recruitment software (ATS) and hiring committees examine structure, margin geometry, and signal density. Generic WYSIWYG builders fail because they wrap lines haphazardly, embed unreadable canvas images, or produce broken character encodings.
          </p>
        </div>

        {/* 3 Core Pledges */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Our 3 Permanent Principles</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0e15] space-y-2">
              <div className="text-[#C88A58] font-mono text-xs font-bold uppercase">1. Zero Traps</div>
              <h3 className="text-sm font-semibold text-white">No Hostage Downloads</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clean, vector PDF and native Word (.docx) export is free. We will never hide the download button behind sudden checkouts.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0e15] space-y-2">
              <div className="text-[#C88A58] font-mono text-xs font-bold uppercase">2. Truthful AI</div>
              <h3 className="text-sm font-semibold text-white">No Fake Numbers</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Wiser AI clarifies your engineering outcomes without fabricating metrics or unearned titles. If a bullet is good, it leaves it alone.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0e15] space-y-2">
              <div className="text-[#C88A58] font-mono text-xs font-bold uppercase">3. A4 Precision</div>
              <h3 className="text-sm font-semibold text-white">Visual Geometry</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Millimeter margin rules and live multi-page canvas boundary calculation prevent ugly second-page line spills.
              </p>
            </div>
          </div>
        </div>

        {/* Creator message */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0f111a] space-y-3">
          <h3 className="text-base font-bold text-white">Crafted by Engineers, for Professionals</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            PageWise Studio is continuously updated by <span className="text-white font-medium">Sadguru Chenu</span> and the editorial engineering team. If you have questions, feedback, or need pilot guidance, reach out directly at{' '}
            <a href="mailto:pagewises@gmail.com" className="text-[#D49A6A] hover:underline">
              pagewises@gmail.com
            </a>.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <Link
            href="/register"
            className="py-3 px-6 rounded-xl font-semibold text-xs bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-md"
          >
            <span>Start Building With PageWise Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
