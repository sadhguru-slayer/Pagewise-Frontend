'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, X } from 'lucide-react';

export default function MobileNotice({ className = '' }) {
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('pagewise_mobile_notice_dismissed');
      if (dismissed) setIsDismissed(true);
    } catch (e) {
      // Fallback
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pagewise_mobile_notice_dismissed', 'true');
    } catch (e) {
      // Fallback
    }
  };

  if (isDismissed) return null;

  return (
    <div
      className={`md:hidden p-3.5 rounded-xl bg-[#14161F] border border-[#C88A58]/25 text-[#8E94A5] text-xs flex items-start gap-3 shadow-lg ${className}`}
    >
      <div className="w-8 h-8 rounded-lg bg-[#C88A58]/10 border border-[#C88A58]/20 flex items-center justify-center text-[#D49A6A] shrink-0 mt-0.5">
        <Monitor className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-[#EDEDF2] text-xs">Desktop Screen Recommended</p>
          <button
            onClick={handleDismiss}
            className="text-[#8E94A5] hover:text-[#EDEDF2] p-1 -mr-1 -mt-1 rounded cursor-pointer transition-colors"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-[11px] text-[#8E94A5] mt-0.5 leading-relaxed">
          PageWise Studio is engineered for widescreen displays. For precision typesetting, live A4 pagination, and ATS analysis, please open on a laptop or desktop monitor.
        </p>
      </div>
    </div>
  );
}
