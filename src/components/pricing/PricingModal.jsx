'use client';

import { useState } from 'react';
import { Check, X, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentsApi } from '@/lib/api';
import { loadRazorpayScript } from '@/lib/razorpay';
import { useAuth } from '@/lib/auth-context';

export const PLANS = [
  {
    id: 'free',
    name: 'Pagewise Free',
    tagline: 'Essential resume building forever',
    price: '₹0',
    period: 'forever',
    badge: 'Free Forever',
    badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    buttonText: 'Free Plan',
    buttonVariant: 'secondary',
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
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    buttonText: 'Get 24h Day Pass',
    buttonVariant: 'primary',
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
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    buttonText: 'Upgrade to Pro',
    buttonVariant: 'accent',
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

export default function PricingModal({ isOpen, onClose, currentPlan = 'free', onPlanUpdated }) {
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (plan) => {
    if (plan.id === 'free') {
      toast('You are currently on the Free tier.', { icon: 'ℹ️' });
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
          color: '#4f46e5',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Transparent Pricing
              </span>
              <span className="text-xs text-zinc-500">· Razorpay Secure</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Upgrade Your PageWise Plan</h2>
            <p className="text-sm text-zinc-400 mt-0.5">
              Supercharge your job applications with Wiser ATS scoring and unlimited high-fidelity exports.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Plan Cards */}
        <div className="p-6 md:p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6 bg-zinc-950/60">
          {PLANS.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-indigo-950/40 via-zinc-900 to-zinc-900 border-2 border-indigo-500/60 shadow-xl shadow-indigo-500/10'
                    : 'bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${plan.badgeColor}`}>
                      {plan.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white mt-3">{plan.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1 min-h-[32px]">{plan.tagline}</p>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price}</span>
                    <span className="text-xs text-zinc-400">{plan.period}</span>
                  </div>

                  <div className="h-px bg-zinc-800 my-5" />

                  <ul className="space-y-2.5 text-xs text-zinc-300">
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

                  if (isCurrent) {
                    buttonLabel = 'Current Active Plan';
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
                        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                          isDisabled
                            ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-800'
                            : plan.popular
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
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

        {/* Footer Guarantee */}
        <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 px-6">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            <span>Encrypted 256-bit Razorpay Payments. Cancel anytime.</span>
          </div>
          <span>Instant quota activation on checkout.</span>
        </div>
      </div>
    </div>
  );
}
