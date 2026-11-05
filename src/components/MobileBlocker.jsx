'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Monitor, Smartphone, ArrowLeft, Sparkles, Layout } from 'lucide-react';

export default function MobileBlocker() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div
      id="pagewise-mobile-blocker"
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-6 bg-[#0a0c10] text-[#EDEDF2] md:hidden select-none"
    >
      {/* Background glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-80 h-80 bg-white/[0.03] blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 relative z-10">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <Image
            src="/pagewise_logo.png"
            alt="PageWise Logo"
            width={34}
            height={34}
            className="rounded-lg shadow-md"
            priority
          />
          <div className="text-left">
            <span className="font-extrabold text-base tracking-tight text-white block leading-none">
              PageWise
            </span>
            <span className="text-[10px] text-[#A6ABB9] tracking-wider uppercase font-mono block mt-0.5">
              Studio Suite
            </span>
          </div>
        </div>

        {/* Visual Graphic: Desktop Recommended */}
        <div className="relative my-1">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center shadow-xl relative">
            <Monitor className="w-10 h-10 text-zinc-300" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#141721] border border-white/[0.12] flex items-center justify-center text-amber-400 shadow-md">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] text-zinc-300 border border-white/[0.12] tracking-wide font-mono">
            <Sparkles className="w-3 h-3 text-[#C88A58]" />
            Mobile Builder In Progress
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight pt-1">
            Builder is being crafted for mobile screens
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed px-1">
            For the best experience, open the builder on bigger screens with full A4 canvas rendering. While we build the mobile editing suite... thanks for the wait!
          </p>
        </div>

        {/* Quick Actions */}
        <div className="w-full pt-2 flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            className="w-full py-3 px-4 rounded-xl text-xs font-semibold bg-white text-zinc-900 hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Mobile Dashboard</span>
          </Link>
          <Link
            href="/settings"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>View Account &amp; Settings</span>
          </Link>
        </div>

        {/* Resolution note */}
        <p className="text-[10px] text-zinc-500 font-mono">
          Screen width &gt;= 768px recommended for live A4 canvas
        </p>
      </div>
    </div>
  );
}
