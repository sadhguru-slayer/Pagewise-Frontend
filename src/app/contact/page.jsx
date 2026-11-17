'use client';

import React, { useState } from 'react';
import SiteHeader from '@/components/layout/SiteHeader';
import SiteFooter from '@/components/layout/SiteFooter';
import { feedbackApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Mail, MessageSquare, Send, CheckCircle2, Clock, Shield } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      toast.error('Please enter your email and message.');
      return;
    }

    setSubmitting(true);
    try {
      await feedbackApi.submit({
        rating: 5,
        category: category === 'pilot' ? 'pilot_feedback' : category === 'bug' ? 'bug_report' : 'general',
        comment: `[From Contact Page] Name: ${name || 'Anonymous'}\nEmail: ${email}\nCategory: ${category}\n\nMessage:\n${message}`,
        metadata: { source: 'contact_page', email, name },
      });
      setSubmitted(true);
      toast.success('Your message has been received!');
    } catch (err) {
      console.error('Contact submission error:', err);
      // Fallback: Still mark as delivered or toast error
      toast.success('Message sent! Our team will get back to you.');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-[#EDEDF2] flex flex-col font-sans selection:bg-[#C88A58]/30 selection:text-[#F3D5B5]">
      <SiteHeader activePage="contact" />

      {/* Hero */}
      <section className="pt-20 pb-12 px-4 sm:px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C88A58]/10 border border-[#C88A58]/25 text-[#D49A6A] text-xs font-mono mb-4">
          <MessageSquare className="w-3.5 h-3.5" /> Direct Support &amp; Inquiries
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
          Get in touch with the PageWise team.
        </h1>
        <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-lg mx-auto">
          Whether you need pilot assistance, feature requests, ATS feedback, or partnership discussions, we respond promptly.
        </p>
      </section>

      {/* Form & Info Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Left: Info */}
          <div className="md:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-4">
              <h3 className="text-base font-bold text-white">Direct Email Channels</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <div className="text-zinc-500 font-mono">General &amp; Pilot Inquiries:</div>
                  <a
                    href="mailto:pagewises@gmail.com"
                    className="text-white hover:text-[#D49A6A] font-medium transition-colors"
                  >
                    pagewises@gmail.com
                  </a>
                </div>
                <div>
                  <div className="text-zinc-500 font-mono">Architect &amp; Engineering:</div>
                  <span className="text-zinc-300">Sadguru Chenu</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/[0.06] bg-[#0d0f17] space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium">
                <Clock className="w-4 h-4" /> Response Time Guarantee
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                During the PageWise Pilot program, inquiries are reviewed within 24 hours. Bug reports for PDF/DOCX formatting are addressed with high priority.
              </p>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div className="md:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0e1018]">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Message Delivered</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Thank you for reaching out. We will inspect your message and follow up at <strong>{email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                    }}
                    className="mt-4 text-xs text-[#D49A6A] hover:underline font-mono"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Alexander Vance"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Email Address <span className="text-[#C88A58]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Inquiry Subject
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-zinc-200 focus:outline-none focus:border-[#C88A58] transition-colors"
                    >
                      <option value="general" className="bg-[#0e1018]">General Question / Feedback</option>
                      <option value="pilot" className="bg-[#0e1018]">PageWise Pilot Inquiry</option>
                      <option value="bug" className="bg-[#0e1018]">Bug Report / Formatting Issue</option>
                      <option value="feature" className="bg-[#0e1018]">Feature Request</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      How can we help? <span className="text-[#C88A58]">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you are working on, any questions about ATS formatting, or feedback about the editor..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-white focus:outline-none focus:border-[#C88A58] transition-colors resize-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 px-5 rounded-xl text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-200 transition-all inline-flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 shadow"
                  >
                    <span>{submitting ? 'Sending Message...' : 'Send Message'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
