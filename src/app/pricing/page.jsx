import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { DEFAULT_PLANS } from '@/lib/plans';
import { Check, Shield, ArrowRight, HelpCircle, BadgeCheck } from 'lucide-react';

export const metadata = {
  title: 'Transparent Pricing — Zero Hidden Paywalls, Free Forever Tier',
  description:
    'Honest, transparent pricing for PageWise Studio. Export vector PDFs and native Microsoft Word resumes without watermarks. Upgrade for deep Wiser AI evaluations and multiple resumes.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingPage() {
  const faqs = [
    {
      q: 'Is vector PDF and Word (.docx) export really free?',
      a: 'Yes. You can draft your complete resume, format it with our calibrated templates, and export high-resolution vector A4 PDFs and Microsoft Word files without entering credit card details or encountering watermarks.',
    },
    {
      q: 'What is the early PageWise Pilot program?',
      a: 'During our current pilot phase, all registered accounts receive our top-tier capabilities (up to 20 workspaces, 100 exports/month, and 50 Wiser Job Help analyses) free of charge as we gather telemetry and feedback.',
    },
    {
      q: 'What is the Wiser Day Pass?',
      a: 'The Day Pass (₹49 for 24 hours) is designed for candidates with an immediate application deadline who need quick ATS evaluations and a few tailored exports without committing to an ongoing subscription.',
    },
    {
      q: 'Will you ever hold my resume hostage?',
      a: 'Never. Your data remains yours. Even if your subscription lapses, all previously created resumes remain safely saved in your account and can be viewed or exported under the Free tier.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <SiteHeader activePage="pricing" />

      {/* Hero */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-4">
          <BadgeCheck className="w-3.5 h-3.5" /> Fair &amp; Transparent
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
          Simple, honest pricing.{' '}
          <span className="text-zinc-400 font-normal block sm:inline">
            Zero checkout traps.
          </span>
        </h1>
        <p className="mt-5 text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          No surprise paywalls when clicking download. Start free forever or unlock advanced Wiser ATS evaluations and multi-resume career branching.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {DEFAULT_PLANS.map((plan) => {
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
                  <h2 className="text-lg font-bold text-white tracking-tight">{plan.name}</h2>
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

                  {/* Features */}
                  <ul className="mt-5 space-y-2.5 text-xs text-zinc-300">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#C88A58] shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-white/[0.04]">
                  <Link
                    href="/register"
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
                    <span>{plan.buttonText || 'Get Started'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Guarantee */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 w-full text-center">
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0c0e15] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">The PageWise No-Watermark Pledge</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Every exported resume is 100% unbranded, clean, and ready for recruiters. We will never slap promotional branding on your career documents.
              </p>
            </div>
          </div>
          <Link
            href="/register"
            className="text-xs text-[#D49A6A] hover:underline font-mono shrink-0"
          >
            Claim Free Pilot →
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-white/[0.06] w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">Frequently Asked Billing Questions</h2>
          <p className="text-xs text-zinc-400 mt-1">Everything you need to know about plans and exports.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/[0.06] bg-[#0d0f17]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#C88A58]" />
                {f.q}
              </h3>
              <p className="text-xs text-zinc-400 mt-2 pl-6 leading-relaxed">
                {f.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
