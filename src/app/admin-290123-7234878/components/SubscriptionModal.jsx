'use client';

import React, { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { X, CreditCard, RefreshCw, Check, Calendar, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionModal({ sub, isOpen, onClose, onUpdated }) {
  const [planType, setPlanType] = useState('free');
  const [status, setStatus] = useState('active');
  const [extendDays, setExtendDays] = useState(0);
  const [resetQuotas, setResetQuotas] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sub) {
      setPlanType(sub.plan_type || 'free');
      setStatus(sub.status || 'active');
      setExtendDays(0);
      setResetQuotas(false);
    }
  }, [sub]);

  if (!isOpen || !sub) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.updateSubscription(sub.user_id, {
        plan_type: planType,
        status,
        extend_days: Number(extendDays) > 0 ? Number(extendDays) : undefined,
        reset_quotas: resetQuotas,
      });
      toast.success(`Subscription updated for ${sub.user_name || sub.user_email}`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      toast.error('Failed to update subscription: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111420] border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1018]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Manage Customer Subscription</h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                {sub.user_name} ({sub.user_email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Plan Type Selector */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5 uppercase font-mono text-[10px]">
              Assigned Subscription Tier
            </label>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              <option value="free">Pagewise Free (Default / Lifetime)</option>
              <option value="day_pass">Wiser Day Pass (24-Hour Access)</option>
              <option value="pro_monthly">Pagewise Pro Monthly</option>
              <option value="pilot">Pilot Tester (Full Access Tier)</option>
            </select>
          </div>

          {/* Status Selector */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5 uppercase font-mono text-[10px]">
              Subscription Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Extend Days */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1.5 uppercase font-mono text-[10px]">
              Extend Validity (Days)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="365"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                placeholder="0"
                className="w-24 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
              <div className="flex items-center gap-1.5">
                {[1, 7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-mono transition cursor-pointer"
                  >
                    +{d}d
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Current expiration: {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'None (Permanent)'}
            </span>
          </div>

          {/* Reset Quotas */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Reset Billing Cycle Quotas</span>
              <span className="text-[11px] text-zinc-400 block">
                Clears resumes created, exports, and AI limits used in this period
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={resetQuotas}
                onChange={(e) => setResetQuotas(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>Save Subscription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
