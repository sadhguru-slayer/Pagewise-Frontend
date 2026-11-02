'use client';

import { useState, useEffect } from 'react';
import { Check, X, Loader2, Shield, Sparkles, ArrowRight, BarChart2, Zap, Layers, FileDown, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/lib/api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth-context';

export const PLANS = [
  {
    id: 'pilot',
    name: 'PageWise Pilot',
    tagline: 'All premium capabilities unlocked during our early pilot program',
    price: '₹0',
    period: 'Pilot Access (Free)',
    badge: 'Early Pilot Active',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    buttonText: 'Current Active Plan',
    popular: true,
    features: [
      '70 resume workspaces',
      'Unlimited manual editing',
      '100 exports per month',
      '50 Wiser Job Help analyses',
      '50 Wiser ATS evaluations',
      '30 custom templates',
      'All premium layout architectures unlocked',
      'AI improvement suggestions and instant application',
      'Early Pilot Access (No payment required)'
    ]
  },
  {
    id: 'free',
    name: 'Pagewise Free',
    tagline: 'Essential resume building forever',
    price: '₹0',
    period: 'forever',
    badge: 'Free Forever',
    badgeColor: 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]',
    buttonText: 'Current Free Tier',
    features: [
      '1 resume workspace',
      'Unlimited manual editing',
      '1 export per calendar month',
      '1 Wiser AI evaluation (Job Help & ATS)',
      '1 standard customizable template',
      'Basic resume editor',
      'Resume remains saved'
    ]
  },
  {
    id: 'day_pass',
    name: 'Wiser Day Pass',
    tagline: 'High speed power for urgent job applications',
    price: '₹49',
    period: 'one-time purchase (24 hours)',
    badge: '24 Hours · 1 Resume',
    badgeColor: 'bg-[#C88A58]/10 text-[#D49A6A] border-[#C88A58]/25',
    buttonText: 'Get 24h Day Pass',
    popular: false,
    features: [
      '1 resume workspace',
      'Unlimited manual editing',
      '3 premium templates',
      '5 exports',
      '3 Wiser Job Help analyses',
      '3 Wiser ATS evaluations',
      'AI improvement suggestions & application'
    ]
  },
  {
    id: 'pro_monthly',
    name: 'Pagewise Pro',
    tagline: 'The ultimate career growth & job hunting toolkit',
    price: '₹199',
    period: '/ month',
    badge: 'Recommended',
    badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    buttonText: 'Upgrade to Pro',
    popular: true,
    features: [
      '5 resume workspaces',
      'Unlimited manual editing',
      '30 exports',
      '15 Wiser Job Help analyses',
      '15 Wiser ATS evaluations',
      'All premium templates',
      'AI improvement suggestions & application',
      'Resume version management',
      'All export formats (PDF, DOCX, PNG, HTML)'
    ]
  }
];

export default function PricingModal({
  isOpen,
  onClose,
  currentPlan = 'free',
  planStatus = null,
  onPlanUpdated = null,
  onNavigateUsage = null,
}) {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('benefits'); // 'benefits' | 'plans'
  const [plansList, setPlansList] = useState(PLANS);

  useEffect(() => {
    if (isOpen) {
      paymentsApi.getPlans()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            const formatted = data.map((t) => ({
              id: t.tier_key,
              name: t.name,
              tagline: t.tagline || '',
              price: t.discount_price_inr === 0 ? '₹0' : `₹${t.discount_price_inr}`,
              basePrice: t.base_price_inr > t.discount_price_inr ? `₹${t.base_price_inr}` : null,
              discountPercent: t.discount_percent || 0,
              period: t.billing_period_text || (t.tier_key === 'pro_monthly' ? '/ month' : t.tier_key === 'day_pass' ? 'one-time purchase (24 hours)' : 'forever'),
              badge: t.badge || (t.tier_key === 'pro_monthly' ? 'Recommended' : t.tier_key === 'day_pass' ? '24 Hours · 1 Resume' : 'Free Forever'),
              badgeColor: t.tier_key === 'pro_monthly' ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : t.tier_key === 'day_pass' ? 'bg-[#C88A58]/10 text-[#D49A6A] border-[#C88A58]/25' : 'bg-white/[0.04] text-[#8E94A5] border-white/[0.08]',
              buttonText: t.tier_key === 'pro_monthly' ? 'Upgrade to Pro' : t.tier_key === 'day_pass' ? 'Get 24h Day Pass' : t.tier_key === 'pilot' ? 'Current Active Plan' : 'Current Free Tier',
              popular: t.tier_key === 'pro_monthly',
              features: t.features || [],
              is_archived: t.is_archived,
            }));
            setPlansList(formatted);
          }
        })
        .catch((err) => console.warn('Could not load dynamic plans, using fallback:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isPilot = currentPlan === 'pilot' || planStatus?.plan_type === 'pilot';
  const planName = planStatus?.plan_name || (isPilot ? 'PageWise Pilot' : currentPlan === 'pro_monthly' ? 'Pagewise Pro' : currentPlan === 'day_pass' ? 'Wiser Day Pass' : 'Pagewise Free');
  const limits = planStatus?.limits || {};
  const usage = planStatus?.usage || {};
  const remaining = planStatus?.remaining || {};

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free' || plan.id === 'pilot') {
      toast(`You are currently on the ${plan.name}.`, { icon: 'ℹ️' });
      return;
    }

    try {
      setLoadingPlan(plan.id);
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Could not connect to Razorpay gateway. Please check your internet connection.');
        setLoadingPlan(null);
        return;
      }

      // Create Razorpay Order
      const orderData = await paymentsApi.createOrder(plan.id);

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'PageWise Studio',
        description: `Upgrade to ${orderData.plan_name}`,
        order_id: orderData.order_id,
        prefill: {
          name: orderData.user_name || user?.name || '',
          email: orderData.user_email || user?.email || '',
        },
        theme: {
          color: '#C88A58',
        },
        handler: async function (response) {
          try {
            const verifyRes = await paymentsApi.verifyPayment({
              razorpay_order_id: response.razorpay_order_id || orderData.order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'test_verified_sig',
            });

            toast.success(verifyRes.message || `Activated ${plan.name}!`);
            if (onPlanUpdated) onPlanUpdated(verifyRes.plan_status);
            onClose();
          } catch (err) {
            toast.error(err.message || 'Payment verification failed');
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Could not initiate payment');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#111319] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0E0F14]/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#C88A58]/10 text-[#D49A6A] border border-[#C88A58]/20 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                <span>Subscription &amp; Allowances</span>
              </span>
              <span className="text-xs text-[#8E94A5]">· Razorpay Encrypted</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#EDEDF2] mt-1.5 tracking-tight">
              {activeTab === 'benefits' ? 'Your Plan & Active Allowances' : 'Compare Plans & Upgrades'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8E94A5] mt-0.5">
              {activeTab === 'benefits'
                ? `Review your active ${planName} quota, live benefits, and usage limits.`
                : 'Choose the ideal tier for your job applications and career growth.'}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-[#8E94A5] hover:text-[#EDEDF2] rounded-lg hover:bg-white/[0.05] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs (Sarvam AI style) */}
        <div className="px-6 pt-3 pb-1 border-b border-white/[0.06] bg-[#0E0F14]/30 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('benefits')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'benefits'
                ? 'bg-white/[0.08] text-[#EDEDF2] border border-white/[0.12] shadow-sm'
                : 'text-[#8E94A5] hover:text-[#EDEDF2] hover:bg-white/[0.03]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#D49A6A]" />
            <span>Active Plan &amp; Allowances</span>
          </button>
          
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'plans'
                ? 'bg-white/[0.08] text-[#EDEDF2] border border-white/[0.12] shadow-sm'
                : 'text-[#8E94A5] hover:text-[#EDEDF2] hover:bg-white/[0.03]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D49A6A]" />
            <span>All Pricing Plans</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-[#0C0D11]">
          {activeTab === 'benefits' ? (
            /* ── VIEW 1: ACTIVE PLAN BENEFITS & ALLOWANCES ── */
            <div className="space-y-6">
              {/* Active Plan Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#181A22] to-[#14161C] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-[#C88A58]/15 text-[#D49A6A] border border-[#C88A58]/30">
                      Active Tier
                    </span>
                    {planStatus?.expires_at && (
                      <span className="text-[11px] text-[#8E94A5] flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-[#D49A6A]" />
                        Valid until: {new Date(planStatus.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-[#EDEDF2] mt-1.5">{planName}</h3>
                  <p className="text-xs text-[#8E94A5] mt-0.5">
                    {isPilot
                      ? '70 workspaces · 100 high-fidelity exports · 100 Wiser AI evaluations · All formats unlocked'
                      : currentPlan === 'pro_monthly'
                      ? '5 workspaces · 30 high-fidelity exports · 30 Wiser AI runs per cycle'
                      : currentPlan === 'day_pass'
                      ? '1 workspace · 5 exports · 6 Wiser AI runs (24-hour speed pass)'
                      : 'Essential resume building workspace · 1 export/month'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPilot ? (
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono">
                      Early Pilot Active
                    </span>
                  ) : (
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#C88A58] hover:bg-[#B87A47] text-white shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Change Plan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quota Progress Cards Grid */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E94A5] mb-3">
                  Current Billing Cycle Allowances
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Resumes */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8E94A5]">Workspaces</span>
                      <span className="font-mono font-semibold text-[#EDEDF2]">
                        {usage.active_resumes ?? 0} / {limits.resumes ?? 1}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round(((usage.active_resumes ?? 0) / (limits.resumes ?? 1)) * 100))}%`,
                          background: 'linear-gradient(90deg, #C88A58, #E0A97E)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8E94A5] mt-2 font-mono">
                      {remaining.resumes ?? 0} workspace(s) remaining
                    </p>
                  </div>

                  {/* Exports */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8E94A5]">Exports</span>
                      <span className="font-mono font-semibold text-[#EDEDF2]">
                        {usage.exports_used ?? 0} / {limits.exports ?? 1}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round(((usage.exports_used ?? 0) / (limits.exports ?? 1)) * 100))}%`,
                          background: 'linear-gradient(90deg, #C88A58, #E0A97E)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8E94A5] mt-2 font-mono">
                      {remaining.exports ?? 0} export(s) remaining
                    </p>
                  </div>

                  {/* Wiser AI */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8E94A5]">Wiser AI Evals</span>
                      <span className="font-mono font-semibold text-[#EDEDF2]">
                        {usage.wiser_ai_total_used ?? 0} / {limits.wiser_ai_combined ?? 1}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round(((usage.wiser_ai_total_used ?? 0) / (limits.wiser_ai_combined ?? 1)) * 100))}%`,
                          background: 'linear-gradient(90deg, #C88A58, #E0A97E)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8E94A5] mt-2 font-mono">
                      {remaining.wiser_ai_combined ?? 0} evaluation(s) remaining
                    </p>
                  </div>

                  {/* Custom Templates */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#8E94A5]">Custom Templates</span>
                      <span className="font-mono font-semibold text-[#EDEDF2]">
                        {usage.custom_templates_count ?? 0} / {limits.custom_templates ?? 1}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.05] rounded-full mt-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.round(((usage.custom_templates_count ?? 0) / (limits.custom_templates ?? 1)) * 100))}%`,
                          background: 'linear-gradient(90deg, #C88A58, #E0A97E)',
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-[#8E94A5] mt-2 font-mono">
                      {remaining.custom_templates ?? 0} template(s) remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Included Benefits List */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.07]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#8E94A5] mb-3">
                  Included In Your Active Tier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#EDEDF2]">
                  {(planStatus?.features || PLANS.find(p => p.id === currentPlan)?.features || []).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 py-1">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Action to Intelligence / Telemetry */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.07]">
                <div className="flex items-center gap-2.5 text-xs text-[#8E94A5]">
                  <BarChart2 className="w-4 h-4 text-[#D49A6A]" />
                  <span>Looking for per-resume analytics, ATS breakdowns, and export logs?</span>
                </div>
                {onNavigateUsage && (
                  <button
                    onClick={() => {
                      onNavigateUsage();
                      onClose();
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-[#EDEDF2] border border-white/[0.1] transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Intelligence &amp; Usage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* ── VIEW 2: COMPARE PLANS & UPGRADE ── */
            (() => {
              const visiblePlans = plansList.filter((p) => !p.is_archived);
              const onlyPilot = visiblePlans.length === 1 && visiblePlans[0].id === 'pilot';

              return (
                <div className="space-y-6">
                  {isPilot && (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        <strong>Early Pilot Access Active:</strong> All premium tools, workspaces, high-speed exports, and Wiser AI evaluations are unlocked for your account. No payment or credit card is required.
                      </span>
                    </div>
                  )}

                  <div className={`grid gap-6 ${onlyPilot ? 'max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
                    {visiblePlans.map((plan) => {
                      const isCurrent = currentPlan === plan.id || (isPilot && plan.id === 'pilot');
                      const isLoading = loadingPlan === plan.id;
                      const isPlanPilot = plan.id === 'pilot';

                      return (
                        <div
                          key={plan.id}
                          className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 ${
                            isPlanPilot
                              ? 'bg-gradient-to-b from-amber-950/20 via-[#161822] to-[#14161F] border-2 border-amber-500/40 shadow-xl'
                              : plan.popular
                              ? 'bg-gradient-to-b from-indigo-950/30 via-[#14161F] to-[#14161F] border-2 border-indigo-500/40 shadow-xl'
                              : isCurrent
                              ? 'bg-[#161822] border-2 border-[#C88A58]/50'
                              : 'bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15]'
                          }`}
                        >
                          {isPlanPilot ? (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-black text-[11px] font-bold rounded-full shadow-md">
                              Early Pilot Active
                            </div>
                          ) : plan.popular ? (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-full shadow-md">
                              Recommended
                            </div>
                          ) : null}

                          <div>
                            <div className="flex items-center justify-between">
                              <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${plan.badgeColor}`}>
                                {plan.badge}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-mono text-[#D49A6A] font-bold uppercase">
                                  Active Plan
                                </span>
                              )}
                            </div>

                            <h3 className="text-xl font-bold text-[#EDEDF2] mt-3">{plan.name}</h3>
                            <p className="text-xs text-[#8E94A5] mt-1 min-h-[32px]">{plan.tagline}</p>

                            <div className="mt-4 flex items-baseline gap-2">
                              <span className="text-3xl font-extrabold text-[#EDEDF2] tracking-tight">{plan.price}</span>
                              {plan.basePrice && (
                                <span className="text-sm line-through text-[#6A7185] font-mono">{plan.basePrice}</span>
                              )}
                              <span className="text-xs text-[#8E94A5]">{plan.period}</span>
                            </div>

                            <div className="h-px bg-white/[0.08] my-5" />

                            <ul className="space-y-2.5 text-xs text-[#EDEDF2]/90">
                              {plan.features.map((feat, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {(() => {
                            const isFree = plan.id === 'free';
                            const isDayPass = plan.id === 'day_pass';
                            const isPro = plan.id === 'pro_monthly';

                            let buttonLabel = plan.buttonText;
                            let isDisabled = isCurrent || isLoading;

                            if (isCurrent || isPlanPilot) {
                              buttonLabel = 'Current Active Plan';
                              isDisabled = true;
                            } else if (isFree) {
                              buttonLabel = 'Free Forever Plan';
                              isDisabled = true;
                            } else if (isDayPass && currentPlan === 'pro_monthly') {
                              buttonLabel = 'Included in Pro';
                              isDisabled = true;
                            } else if (isPro) {
                              buttonLabel = 'Upgrade to Pro';
                            } else if (isDayPass) {
                              buttonLabel = 'Get 24h Day Pass';
                            }

                            return (
                              <div className="mt-8">
                                <button
                                  disabled={isDisabled}
                                  onClick={() => handleSubscribe(plan)}
                                  className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    isDisabled
                                      ? 'bg-white/[0.04] text-[#8E94A5] cursor-not-allowed border border-white/[0.06]'
                                      : isPlanPilot
                                      ? 'bg-amber-500 hover:bg-amber-400 text-black'
                                      : plan.popular
                                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                                      : 'bg-[#C88A58] hover:bg-[#B87A47] text-white'
                                  }`}
                                >
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    buttonLabel
                                  )}
                                </button>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="p-4 bg-[#0E0F14] border-t border-white/[0.08] flex items-center justify-between text-xs text-[#8E94A5] px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D49A6A]" />
            <span>Encrypted 256-bit Razorpay Payments. Real-time quota activation.</span>
          </div>
          <span className="hidden sm:inline">Transparent pricing · No hidden fees</span>
        </div>
      </div>
    </div>
  );
}
