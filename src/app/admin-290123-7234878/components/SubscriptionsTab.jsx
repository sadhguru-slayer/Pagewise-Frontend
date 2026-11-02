'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import SubscriptionModal from './SubscriptionModal';
import {
  CreditCard,
  Search,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscriptionsTab() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getSubscriptions({
        page,
        limit,
        plan_type: planFilter,
        status: statusFilter,
        search: search.trim() || undefined,
      });
      setSubs(res.subscriptions || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
      setSummary(res.summary || null);
    } catch (err) {
      toast.error('Failed to load subscriptions: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, planFilter, statusFilter, search]);

  useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadSubscriptions();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span>Customer Subscriptions &amp; Billing Cycles</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit customer active tiers, expiration countdowns, quota usages, and manual tier overrides.
          </p>
        </div>
        <button
          onClick={() => {
            setPage(1);
            loadSubscriptions();
          }}
          disabled={loading}
          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-mono uppercase text-zinc-400 font-semibold block">
            Total Active
          </span>
          <div className="text-2xl font-extrabold text-white mt-1">
            {summary?.active_count || 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-mono uppercase text-indigo-400 font-semibold block">
            Pro Monthly Active
          </span>
          <div className="text-2xl font-extrabold text-indigo-300 mt-1">
            {summary?.pro_count || 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-mono uppercase text-amber-400 font-semibold block">
            Day Pass Active
          </span>
          <div className="text-2xl font-extrabold text-amber-300 mt-1">
            {summary?.day_pass_count || 0}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block">
            Pilot Testers
          </span>
          <div className="text-2xl font-extrabold text-emerald-300 mt-1">
            {summary?.pilot_count || 0}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">Tier:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Tiers</option>
              <option value="free">Pagewise Free</option>
              <option value="day_pass">Day Pass</option>
              <option value="pro_monthly">Pro Monthly</option>
              <option value="pilot">Pilot</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {(planFilter !== 'all' || statusFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setPlanFilter('all');
                setStatusFilter('all');
                setSearch('');
                setPage(1);
              }}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-white rounded-xl text-xs hover:bg-zinc-800 transition cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#0e1018] text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Current Tier</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires</th>
                <th className="py-3 px-4">Resumes Used</th>
                <th className="py-3 px-4">Exports Used</th>
                <th className="py-3 px-4">AI Usage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {loading && subs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading subscriptions...</span>
                  </td>
                </tr>
              ) : subs.length > 0 ? (
                subs.map((s) => {
                  const isActive = s.status === 'active';
                  const isPro = s.plan_type === 'pro_monthly';
                  const isDayPass = s.plan_type === 'day_pass';
                  const isPilot = s.plan_type === 'pilot';

                  const badgeStyle = isPro
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25'
                    : isDayPass
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                    : isPilot
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700/60';

                  const expiresDate = s.expires_at ? new Date(s.expires_at) : null;
                  const isExpired = expiresDate && expiresDate < new Date();

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedSub(s);
                        setModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-white">{s.user_name || 'Anonymous'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono">{s.user_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeStyle}`}>
                          {s.plan_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            isActive && !isExpired
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {isActive && !isExpired ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>{isExpired ? 'expired' : s.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        {expiresDate ? (
                          <span className={isExpired ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                            {expiresDate.toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-normal">Permanent (Free)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-semibold">
                        {s.resumes_created_in_period || 0}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-semibold">
                        {s.exports_used_in_period || 0}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-400">
                        <span className="text-amber-400 font-semibold">
                          {(s.wiser_job_help_used || 0) + (s.wiser_ats_used || 0)}
                        </span>{' '}
                        calls
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedSub(s);
                            setModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3 text-amber-400" />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No subscriptions match your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#0e1018] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="font-mono text-[11px]">
            Showing <strong className="text-white">{subs.length}</strong> of{' '}
            <strong className="text-white">{total}</strong> total customer subscriptions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-zinc-300 cursor-pointer"
              title="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-[11px] px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition text-zinc-300 cursor-pointer"
              title="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription Modal */}
      <SubscriptionModal
        sub={selectedSub}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSub(null);
        }}
        onUpdated={loadSubscriptions}
      />
    </div>
  );
}
