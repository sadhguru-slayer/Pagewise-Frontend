'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Monitor, Smartphone } from 'lucide-react';

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
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-6 bg-[#090A0F] text-[#EDEDF2] md:hidden select-none"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, rgba(200, 138, 88, 0.12) 0%, rgba(9, 10, 15, 1) 70%)',
      }}
    >
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
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
        <div className="relative my-2">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center shadow-xl relative">
            <Monitor className="w-10 h-10 text-[#D49A6A]" />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-[#14161F] border border-white/[0.1] flex items-center justify-center text-rose-400 shadow-md">
              <Smartphone className="w-4 h-4 opacity-70" />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold bg-[#C88A58]/10 text-[#D49A6A] border border-[#C88A58]/20 tracking-wide uppercase font-mono">
            Desktop Experience Only
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
            Please Switch to a Laptop or Desktop
          </h1>
          <p className="text-xs text-[#A6ABB9] leading-relaxed px-2">
            PageWise Resume Studio is calibrated for precision multi-page A4 typography, live split-screen ATS intelligence, and wide-canvas design.
          </p>
        </div>

        {/* Working on Mobile Notice */}
        <div className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300">
              Mobile Version In Development
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
              In Progress
            </span>
          </div>
          <p className="text-[11px] text-[#8E94A5] leading-normal">
            We are actively engineering a responsive mobile companion. In the meantime, please open <span className="text-white font-mono font-medium">pagewise.sadguruchenu.in</span> or your PageWise link on a larger display.
          </p>
        </div>

        {/* Resolution note */}
        <p className="text-[10px] text-[#717789] font-mono">
          Requires display width of 768px or wider
        </p>
      </div>
    </div>
  );
}
