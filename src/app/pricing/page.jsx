'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { DEFAULT_PLANS } from '@/lib/plans';
import { paymentsApi } from '@/lib/api';
import { Check, Shield, ArrowRight, HelpCircle, BadgeCheck } from 'lucide-react';

export default function PricingPage() {
  const [plans, setPlans] = useState(DEFAULT_PLANS);

  useEffect(() => {
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
              t.tier_key === 'pro_monthly'
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                : t.tier_key === 'day_pass'
                ? 'bg-[#C88A58]/10 text-[#D49A6A] border-[#C88A58]/25'
                : 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]',
            popular: t.tier_key === 'pro_monthly',
            buttonText: t.tier_key === 'pro_monthly' ? 'Upgrade to Pro' : t.tier_key === 'day_pass' ? 'Get 24h Day Pass' : 'Current Free Tier',
            features: t.features || [],
          }));
          setPlans(formatted);
        }
      })
      .catch((err) => {
        console.warn('Falling back to static plans:', err);
      });
  }, []);

  const faqs = [
    {
      q: 'Is vector PDF and Word (.docx) export really free?',
      a: 'Yes. You can draft your complete resume, format it with our calibrated templates, and export high-resolution vector A4 PDFs and Microsoft Word files without entering credit card details or encountering watermarks.',
    },
    {
      q: 'What is the Wiser Day Pass?',
      a: 'The Day Pass (₹49 for 24 hours) is designed for candidates with an immediate application deadline who need quick ATS evaluations and a few tailored exports without committing to an ongoing subscription.',
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Yes. All subscriptions can be managed from your account dashboard with instant effect. There are no lock-in contracts or cancellation penalties.',
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPro = plan.id === 'pro_monthly';

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 flex flex-col justify-between transition-all relative ${
                  isPro
                    ? 'bg-[#0f111a] border-2 border-indigo-500/40 shadow-xl shadow-indigo-500/5'
                    : 'bg-[#0d0f17] border border-white/[0.06] hover:border-white/[0.12]'
                }`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-6">
                    <span
                      className={`text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full border ${plan.badgeColor}`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  <div className="mt-1">
                    <h2 className="text-lg font-bold text-white tracking-tight">{plan.name}</h2>
                    <p className="text-xs text-zinc-400 mt-1 min-h-[32px] leading-relaxed">
                      {plan.tagline}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-baseline gap-1.5">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {plan.price}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      {plan.period}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-zinc-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-[#C88A58] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-white/[0.06]">
                  <Link
                    href="/register"
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      isPro
                        ? 'bg-gradient-to-r from-[#D49A6A] to-[#C88A58] text-[#090A0F] hover:brightness-110 shadow-lg shadow-[#C88A58]/20'
                        : 'bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/[0.08]'
                    }`}
                  >
                    <span>{plan.buttonText}</span>
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
            Start Free Forever →
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
