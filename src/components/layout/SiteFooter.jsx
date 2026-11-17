'use client';

import React from 'react';
import Link from 'next/link';
import { BrandLockup, BRAND_CONFIG } from '@/lib/brand';
import { ArrowUpRight } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#07080c] text-xs text-zinc-400 pt-16 pb-12 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-white/[0.06]">
          {/* Brand info */}
          <div className="col-span-2 space-y-3">
            <BrandLockup size={22} showTagline={false} />
            <p className="text-zinc-500 text-xs max-w-sm leading-relaxed">
              Precision engineering for modern career resumes. Millimeter-accurate multi-page A4 canvas, grounded truthful AI, deep ATS keyword alignment, and dual vector PDF + Word export.
            </p>
            <div className="pt-2 text-[11px] text-zinc-500 font-mono">
              Designed &amp; built with zero watermark traps.
            </div>
          </div>

          {/* Product */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Product
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/features" className="hover:text-white transition-colors">
                  Features Breakdown
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  Plans &amp; Pricing
                </Link>
              </li>
              <li>
                <Link href="/builder" className="hover:text-white transition-colors">
                  Live Canvas
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Start Free Pilot
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & SEO */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Editorial &amp; Insights
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link href="/blog/engineering-resume-benchmark-ats-vs-humans" className="hover:text-white transition-colors">
                  ATS Parser Benchmark
                </Link>
              </li>
              <li>
                <Link href="/blog/single-page-vs-multi-page-resume-rules" className="hover:text-white transition-colors">
                  A4 Page Architecture
                </Link>
              </li>
              <li>
                <Link href="/blog/why-pdf-exporters-break-ats-and-how-to-fix-it" className="hover:text-white transition-colors">
                  Vector PDF Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-2.5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
              Company
            </div>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About PageWise
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Support
                </Link>
              </li>
              <li>
                <a
                  href="mailto:pagewises@gmail.com"
                  className="hover:text-white transition-colors inline-flex items-center gap-1"
                >
                  <span>pagewises@gmail.com</span>
                  <ArrowUpRight className="w-3 h-3 text-zinc-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div>
            © {new Date().getFullYear()} {BRAND_CONFIG.name} Studio. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/about" className="hover:text-zinc-400 transition-colors">
              Philosophy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-zinc-400 transition-colors">
              Support
            </Link>
            <span>•</span>
            <span className="text-zinc-600">v2.5 Production Build</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
