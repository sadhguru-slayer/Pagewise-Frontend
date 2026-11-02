'use client';

import { useState } from 'react';
import { Mail, Copy, Check, Info, ArrowUpRight, X, MessageSquarePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { BRAND_CONFIG } from '@/lib/brand';
import FeedbackModal from '@/components/feedback/FeedbackModal';

/**
 * PilotBanner Component
 * Communicates that PageWise is currently in pilot mode ("use it till it breaks")
 * and invites feedback directly via in-house feedback modal or email.
 *
 * @param {'card' | 'topbar' | 'compact'} variant
 * @param {boolean} dismissible
 */
export default function PilotBanner({
  variant = 'card',
  dismissible = true,
  className = '',
}) {
  const [copied, setCopied] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const email = BRAND_CONFIG.supportEmail || 'pagewises@gmail.com';

  const handleCopyEmail = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success('Copied pagewises@gmail.com to clipboard!', {
      duration: 3000,
      icon: '📬',
    });
    setTimeout(() => setCopied(false), 2500);
  };

  if (dismissed) return null;

  // ─── TOPBAR VARIANT (For Landing Page & sticky banners) ───────────────────
  if (variant === 'topbar') {
    return (
      <>
        <div
          className={`w-full bg-[#111319] border-b border-amber-500/25 px-4 py-2 text-xs relative z-50 text-zinc-300 ${className}`}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                PILOT RELEASE
              </span>
              <span className="text-zinc-200 font-medium">
                PageWise is in active pilot — use every feature freely until it breaks!
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold text-white transition-all cursor-pointer shadow-sm"
                style={{ background: BRAND_CONFIG.colors.primary }}
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>Give Feedback</span>
              </button>

              {dismissible && (
                <button
                  onClick={() => setDismissed(true)}
                  className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
                  aria-label="Dismiss banner"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} initialCategory="pilot_feedback" />
      </>
    );
  }

  // ─── COMPACT INLINE VARIANT (For Builder toolbar / subheader) ────────────
  if (variant === 'compact') {
    return (
      <>
        <div
          className={`rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-200 ${className}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">
              <strong className="text-white">Pilot Release:</strong> Build freely till it breaks.
            </span>
          </div>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded transition-colors text-white flex items-center gap-1 cursor-pointer"
            style={{ background: BRAND_CONFIG.colors.primary }}
          >
            <MessageSquarePlus className="w-3 h-3" />
            <span>Give Feedback</span>
          </button>
        </div>
        <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} initialCategory="pilot_feedback" />
      </>
    );
  }

  // ─── CARD VARIANT (Default — For Dashboard & Settings) ───────────────────
  return (
    <>
      <div
        className={`rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group border ${className}`}
        style={{
          background: 'linear-gradient(135deg, rgba(200, 138, 88, 0.08) 0%, rgba(17, 19, 25, 0.95) 45%, #111319 100%)',
          borderColor: 'rgba(200, 138, 88, 0.28)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 max-w-3xl">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: 'rgba(200, 138, 88, 0.15)',
                border: '1px solid rgba(200, 138, 88, 0.3)',
                color: BRAND_CONFIG.colors.primary,
              }}
            >
              <Mail className="w-5 h-5 text-[#D49A6A]" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Active Pilot Mode
                </span>
                <h3 className="text-sm font-bold text-[#F1F3F9] tracking-tight">
                  Use it freely until it breaks — feedback wanted!
                </h3>
              </div>

              <p className="text-xs text-[#9DA4B6] leading-relaxed">
                PageWise is currently in open pilot. You have unrestricted access to all features (dual A4 PDF &amp; native Word export, multi-page layout engine, and ATS keyword matching). Push it to its limits! If you encounter any breakages, formatting quirks, or have ideas, your valuable feedback is deeply appreciated.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 sm:self-center">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-95"
              style={{ background: BRAND_CONFIG.colors.primary }}
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              <span>Give Feedback</span>
            </button>

            <button
              onClick={handleCopyEmail}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Copy email to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Email'}</span>
            </button>
          </div>
        </div>
      </div>
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} initialCategory="pilot_feedback" />
    </>
  );
}
