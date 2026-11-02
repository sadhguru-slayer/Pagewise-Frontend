'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  Star,
  Loader2,
  CheckCircle2,
  Send,
  AlertCircle,
  Sparkles,
  Bug,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbackApi } from '@/lib/api';
import { BRAND_CONFIG } from '@/lib/brand';

const CATEGORIES = [
  { id: 'pilot_feedback', label: 'Pilot Feedback', icon: Sparkles },
  { id: 'bug', label: 'Bug Report', icon: Bug },
  { id: 'feature_request', label: 'Idea / Feature', icon: Lightbulb },
  { id: 'wiser_ai', label: 'Wiser AI', icon: Sparkles },
  { id: 'general', label: 'General', icon: HelpCircle },
];

export default function FeedbackModal({
  isOpen,
  onClose,
  initialCategory = 'pilot_feedback',
  contextMetadata = {},
}) {
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState(initialCategory);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory);
      setIsSuccess(false);
      setMessage('');
      setTitle('');
      setRating(0);
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!message || message.trim().length < 5) {
      toast.error('Please share at least a few words (5+ characters).');
      return;
    }

    try {
      setIsSubmitting(true);

      const metadata = {
        ...contextMetadata,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
        timestamp: new Date().toISOString(),
      };

      await feedbackApi.submit({
        category,
        rating: rating > 0 ? rating : null,
        title: title.trim() || null,
        message: message.trim(),
        email: email.trim() || null,
        metadata_json: metadata,
        website_hp: honeypot || null,
      });

      setIsSuccess(true);
      toast.success('Thank you! Your feedback has been received.');
      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err) {
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl border border-white/[0.08] text-[#EDEDF2] transition-all"
        style={{
          background: '#13151B',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.8), 0 0 40px rgba(200, 138, 88, 0.05)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-[#7E869B] hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight">Feedback Submitted!</h3>
            <p className="text-xs text-[#8E94A5] max-w-sm mx-auto">
              Your feedback goes directly to our core engineering team. Thank you for helping build PageWise!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: BRAND_CONFIG.colors.primary }}
                />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#D49A6A] font-bold">
                  In-House Feedback
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-1">
                Share your Experience
              </h2>
              <p className="text-xs text-[#8E94A5] mt-0.5">
                Spot a bug, layout issue, or have a suggestion? We read every submission.
              </p>
            </div>

            {/* Category Pills */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E94A5] uppercase tracking-wider block mb-2">
                Feedback Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer border ${
                        isSelected
                          ? 'border-[#C88A58]/50 text-white shadow-sm'
                          : 'border-white/[0.06] text-[#8E94A5] hover:text-[#EDEDF2] hover:bg-white/[0.03]'
                      }`}
                      style={{
                        background: isSelected ? 'rgba(200, 138, 88, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        borderColor: isSelected ? '#C88A58' : undefined,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: isSelected ? '#D49A6A' : undefined }} />
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rating Stars (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#8E94A5] uppercase tracking-wider">
                  Satisfaction (Optional)
                </label>
                {rating > 0 && (
                  <span className="text-[11px] font-mono text-[#D49A6A]">
                    {rating} / 5 stars
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star === rating ? 0 : star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-zinc-600 hover:text-amber-400 transition cursor-pointer"
                      aria-label={`${star} star`}
                    >
                      <Star
                        className={`w-5 h-5 transition-colors ${
                          active ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title / Subject */}
            <div>
              <label className="text-[11px] font-semibold text-[#8E94A5] uppercase tracking-wider block mb-1">
                Topic or Subject <span className="text-zinc-500 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Export page margins, ATS keyword suggestions..."
                maxLength={120}
                className="w-full px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C88A58] transition"
              />
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-[#8E94A5] uppercase tracking-wider">
                  Details <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] font-mono text-zinc-500">
                  {message.length} / 5000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What worked? What broke? What would make this 10x better for your job hunt?"
                rows={4}
                required
                maxLength={5000}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#C88A58] transition resize-none leading-relaxed"
              />
            </div>

            {/* Hidden Honeypot Field (Spam Resistance) */}
            <div
              style={{
                position: 'absolute',
                left: '-9999px',
                top: '-9999px',
                opacity: 0,
                pointerEvents: 'none',
              }}
              aria-hidden="true"
              tabIndex={-1}
            >
              <label htmlFor="website_hp">Leave empty</label>
              <input
                type="text"
                id="website_hp"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E94A5] hover:text-white hover:bg-white/[0.04] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || message.trim().length < 5}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                style={{
                  background: BRAND_CONFIG.colors.primary,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Feedback</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
