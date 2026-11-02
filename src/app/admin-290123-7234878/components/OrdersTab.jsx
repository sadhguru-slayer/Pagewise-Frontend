'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import OrderDetailModal from './OrderDetailModal';
import {
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Copy,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // Inspection Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getOrders({
        page,
        limit,
        status: statusFilter,
        plan_type: planFilter,
        search: search.trim() || undefined,
      });
      setOrders(res.orders || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      toast.error('Failed to load orders: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, planFilter, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadOrders();
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatINR = (val) => {
    return '₹' + Number(val || 0).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <span>Customer Payment Orders Ledger</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Audit trail of all checkout sessions, Razorpay transactions, signatures, and settlement events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setPage(1);
              loadOrders();
            }}
            disabled={loading}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID, email, name, payment ID..."
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

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
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
              <option value="paid">Paid &amp; Settled</option>
              <option value="created">Created / Pending</option>
              <option value="failed">Failed / Cancelled</option>
            </select>
          </div>

          {/* Plan filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-zinc-500 uppercase">Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">All Plans</option>
              <option value="day_pass">Day Pass</option>
              <option value="pro_monthly">Pro Monthly</option>
              <option value="pilot">Pilot</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(statusFilter !== 'all' || planFilter !== 'all' || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setPlanFilter('all');
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

      {/* Orders Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#0e1018] text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-zinc-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Loading payment orders...</span>
                  </td>
                </tr>
              ) : orders.length > 0 ? (
                orders.map((o) => {
                  const isPaid = o.status === 'paid';
                  const isFailed = o.status === 'failed';

                  return (
                    <tr
                      key={o.id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => {
                        setSelectedOrder(o);
                        setInspectModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        <span>#{o.id}</span>
                        {o.razorpay_order_id && (
                          <span className="block text-[10px] text-zinc-500 font-normal truncate max-w-[140px]">
                            {o.razorpay_order_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans" onClick={(e) => e.stopPropagation()}>
                        <div className="font-semibold text-white">{o.user_name || 'Anonymous'}</div>
                        <div className="text-[11px] text-zinc-400 font-mono truncate max-w-[180px]">
                          {o.user_email || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                          {o.plan_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {formatINR(o.amount_inr)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                          ) : isFailed ? (
                            <XCircle className="w-3 h-3 shrink-0" />
                          ) : (
                            <Clock className="w-3 h-3 shrink-0" />
                          )}
                          <span>{o.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        {o.razorpay_payment_id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-zinc-300 truncate max-w-[130px]">
                              {o.razorpay_payment_id}
                            </span>
                            <button
                              onClick={() => handleCopy(o.razorpay_payment_id, o.id)}
                              className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
                              title="Copy Payment ID"
                            >
                              {copiedId === o.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-zinc-400">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setInspectModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500">
                    No orders match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-[#0e1018] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <div className="font-mono text-[11px]">
            Showing <strong className="text-white">{orders.length}</strong> of{' '}
            <strong className="text-white">{total}</strong> total payment orders
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={inspectModalOpen}
        onClose={() => {
          setInspectModalOpen(false);
          setSelectedOrder(null);
        }}
      />
    </div>
  );
}
