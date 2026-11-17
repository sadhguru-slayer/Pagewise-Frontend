import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import {
  FileText,
  Search,
  Download,
  Layers,
  ShieldCheck,
  Zap,
  Cpu,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Engineered Features — Real A4 Canvas, Deep ATS & Truthful AI',
  description:
    'Deep architectural breakdown of PageWise Studio: millimeter A4 geometry, ATS parser reverse-engineering, Wiser factual AI polish, and dual vector PDF + Word .docx exports.',
  alternates: {
    canonical: '/features',
  },
};

export default function FeaturesPage() {
  const pillars = [
    {
      icon: Layers,
      tag: 'Geometry Engine',
      title: 'True Millimeter A4 Visual Geometry',
      desc: 'Most web resume builders are fluid HTML blobs that unpredictably wrap or create awkward 2-line page spill-overs. PageWise renders on a strict 210mm x 297mm virtual canvas with real-time page break projections.',
      points: [
        'Deterministic line wrap and millimeter margins',
        'Multi-page pagination calculated continuously as you type',
        'Zero accidental overflow bullets or orphaned headers',
        'Visual section reordering with real-time spatial budget indicators',
      ],
    },
    {
      icon: Search,
      tag: 'Deep ATS Intelligence',
      title: 'Deconstructed Applicant Tracking Parser',
      desc: 'Stop guessing what Workday, Greenhouse, or Taleo see. We evaluate your resume against your target Job Description across hard technical skills, keyword frequency, and structural parsing legality.',
      points: [
        'Identifies missing required competencies and semantic synonyms',
        'Calculates real match percentages without arbitrary scoring penalties',
        'Tests font encoding, ligature parsing, and heading hierarchy',
        'Provides precise recommendations for targeted resume branching',
      ],
    },
    {
      icon: Zap,
      tag: 'Truthful Intelligence',
      title: 'Wiser AI: Grounded Evidence-First Polisher',
      desc: 'Generic AI chatbots hallucinate fake metric gains (e.g. "boosted revenue by 400% on day one"). Wiser operates under a strict factual integrity rule: it sharpens action scope and eliminates passive fluff without inventing numbers.',
      points: [
        'Enforces the Google XYZ accomplishment standard',
        'Replaces weak verbs with technical ownership language',
        'Never fabricates unearned titles, company scopes, or numbers',
        'One-click apply or manual side-by-side diff review',
      ],
    },
    {
      icon: Download,
      tag: 'Export Pipeline',
      title: 'Dual Vector PDF & Native Word (.docx) Export',
      desc: 'Unlike canvas screenshot tools that export blurry images disguised as PDFs, PageWise compiles clean vector text and native OpenXML Word documents.',
      points: [
        'Selectable, copy-pasteable vector text with standard font embedding',
        '100% compliant with enterprise ATS automated text extractors',
        'Native editable Word (.docx) for recruiters demanding Word files',
        'Zero watermark traps, zero surprise download gates',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <SiteHeader activePage="features" />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-6">
          <Cpu className="w-3.5 h-3.5" /> Engineered From The Ground Up
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          Built like high-precision CAD,{' '}
          <span className="text-zinc-400 font-normal block sm:inline">
            not a generic text editor.
          </span>
        </h1>
        <p className="mt-5 text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Every component in PageWise was engineered to solve a specific point of failure in modern job hunting: margin shifting, ATS parser drop-off, AI hallucinations, and predatory paywalls.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/register"
            className="py-3 px-6 rounded-xl font-semibold text-xs bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-md active:scale-[0.98]"
          >
            <span>Start Building With PageWise</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/builder"
            className="py-3 px-5 rounded-xl font-medium text-xs text-zinc-300 hover:text-white hover:bg-white/[0.05] border border-white/[0.08] transition-all"
          >
            Open Live Canvas
          </Link>
        </div>
      </section>

      {/* 4 Pillars Breakdown */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {pillars.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-2xl border border-white/[0.07] bg-[#0d0f17] hover:border-white/[0.14] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono text-[#D49A6A] uppercase tracking-wider bg-[#C88A58]/10 px-2.5 py-0.5 rounded border border-[#C88A58]/20">
                      {p.tag}
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-300">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-white tracking-tight">{p.title}</h2>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">{p.desc}</p>

                  <ul className="mt-6 space-y-2.5 pt-6 border-t border-white/[0.04]">
                    {p.points.map((pt, ptIdx) => (
                      <li key={ptIdx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                        <CheckCircle2 className="w-4 h-4 text-[#C88A58] shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technical Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.06] w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How PageWise Compares</h2>
          <p className="text-xs text-zinc-400 mt-2">
            Why engineering professionals and senior specialists leave traditional builders for PageWise.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#0d0f17]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 font-mono">
                <th className="py-4 px-5">Capability</th>
                <th className="py-4 px-5 text-[#D49A6A] font-bold">PageWise Studio</th>
                <th className="py-4 px-5">Standard Online Builders</th>
                <th className="py-4 px-5">Raw LaTeX / Word</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-zinc-300">
              <tr>
                <td className="py-3.5 px-5 font-medium text-white">A4 Page Breaks</td>
                <td className="py-3.5 px-5 text-emerald-400 font-semibold">Real-time millimeter calibration</td>
                <td className="py-3.5 px-5 text-zinc-500">Unpredictable PDF export overflow</td>
                <td className="py-3.5 px-5 text-zinc-400">Manual compile / spacing hacks</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-white">ATS Keyword Matching</td>
                <td className="py-3.5 px-5 text-emerald-400 font-semibold">Live Job Description analysis</td>
                <td className="py-3.5 px-5 text-zinc-500">None or paid upsell ($20/mo)</td>
                <td className="py-3.5 px-5 text-zinc-400">Manual review</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-white">AI Fact Integrity</td>
                <td className="py-3.5 px-5 text-emerald-400 font-semibold">Strict truth policy (no hallucinations)</td>
                <td className="py-3.5 px-5 text-zinc-500">Invented metrics &amp; buzzwords</td>
                <td className="py-3.5 px-5 text-zinc-400">None</td>
              </tr>
              <tr>
                <td className="py-3.5 px-5 font-medium text-white">Export Freedom</td>
                <td className="py-3.5 px-5 text-emerald-400 font-semibold">Vector PDF &amp; Word (.docx) Free</td>
                <td className="py-3.5 px-5 text-rose-400">Watermarks or surprise paywalls</td>
                <td className="py-3.5 px-5 text-zinc-400">Free, complex setup</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#141622] to-[#0d0f17] border border-white/[0.08] shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Experience the difference of engineered craft
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
            Build your resume with exact A4 visual boundaries, verify ATS keywords, and export without friction.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/register"
              className="py-3 px-6 rounded-xl font-semibold text-xs bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center gap-2 shadow-lg"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
