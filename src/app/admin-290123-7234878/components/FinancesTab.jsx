'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  RefreshCw,
  Loader2,
  Calendar,
  Wallet,
  Receipt,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinancesTab({ onNavigateToOrders }) {
  const [loading, setLoading] = useState(true);
  const [finances, setFinances] = useState(null);

  const loadFinances = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getFinances();
      setFinances(data);
    } catch (err) {
      toast.error('Failed to load financial telemetry: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinances();
  }, [loadFinances]);

  if (loading && !finances) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading Financial Ledger...</span>
      </div>
    );
  }

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Financial &amp; Revenue Telemetry</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time gross revenue, order conversions, plan tier revenue breakdown, and transaction history.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadFinances}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {onNavigateToOrders && (
            <button
              onClick={onNavigateToOrders}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View All Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Total Gross Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatINR(finances?.total_revenue_inr)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1 font-mono">
            <span className="text-emerald-400 font-bold">{finances?.paid_orders || 0}</span>
            <span>settled transactions</span>
          </p>
        </div>

        {/* 30 Day Revenue */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Last 30 Days Revenue
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatINR(finances?.revenue_30d_inr)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono flex items-center gap-1">
            <span>7-day rolling: </span>
            <strong className="text-zinc-200">{formatINR(finances?.revenue_7d_inr)}</strong>
          </p>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Average Order Value (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {formatINR(finances?.average_order_value_inr)}
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            Past 24h revenue: <strong className="text-amber-400">{formatINR(finances?.revenue_24h_inr)}</strong>
          </p>
        </div>

        {/* Conversion & Success Rate */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold">
              Payment Conversion
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {finances?.conversion_rate || 0}%
          </div>
          <p className="text-[11px] text-zinc-400 mt-2 font-mono">
            {finances?.total_orders || 0} total attempts recorded
          </p>
        </div>
      </div>

      {/* Middle Row: Revenue By Plan & Order Volume Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue by Plan Tier */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Revenue by Subscription Tier</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Settled Collections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {['day_pass', 'pro_monthly', 'pilot'].map((tierKey) => {
              const info = finances?.by_plan?.[tierKey] || { count: 0, revenue: 0 };
              const tierName =
                tierKey === 'day_pass'
                  ? 'Wiser Day Pass (24h)'
                  : tierKey === 'pro_monthly'
                  ? 'Pagewise Pro Monthly'
                  : 'Pilot Extended';
              const badgeColor =
                tierKey === 'pro_monthly'
                  ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                  : tierKey === 'day_pass'
                  ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

              return (
                <div
                  key={tierKey}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between"
                >
                  <div>
                    <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border inline-block mb-2 ${badgeColor}`}>
                      {tierName}
                    </span>
                    <div className="text-2xl font-extrabold text-white">
                      {formatINR(info.revenue)}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400 font-mono">
                    <span>Paid Orders:</span>
                    <span className="font-bold text-white">{info.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Fulfillment Status */}
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-400" />
              <span>Order Ledger Funnel</span>
            </h3>
          </div>

          <div className="space-y-3 pt-1">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">Paid &amp; Active</span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {finances?.paid_orders || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-zinc-200">Created / Pending</span>
              </div>
              <span className="font-mono text-sm font-bold text-amber-400">
                {finances?.created_orders || 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold text-zinc-200">Failed / Cancelled</span>
              </div>
              <span className="font-mono text-sm font-bold text-rose-400">
                {finances?.failed_orders || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Recent Transaction Activity (Latest 10)</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Live settlement audit stream from Razorpay webhook events.
            </p>
          </div>
          {onNavigateToOrders && (
            <button
              onClick={onNavigateToOrders}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <span>Explore all records</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <th className="py-2.5 px-3">Order ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Plan Tier</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {finances?.recent_transactions?.length > 0 ? (
                finances.recent_transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-zinc-300">
                      #{t.id}
                      {t.razorpay_order_id && (
                        <span className="block text-[10px] text-zinc-500 font-normal truncate max-w-[130px]">
                          {t.razorpay_order_id}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-medium text-white">{t.user_name}</div>
                      <div className="text-[11px] text-zinc-400 font-mono">{t.user_email}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60 uppercase">
                        {t.plan_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white">
                      {formatINR(t.amount_inr)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                          t.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : t.status === 'failed'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-zinc-400">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
