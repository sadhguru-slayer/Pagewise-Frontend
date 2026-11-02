'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Receipt,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { paymentsApi } from '@/lib/api';
import InvoiceModal from './InvoiceModal';
import toast from 'react-hot-toast';

export default function BillingHistoryCard({ user, onUpgradeClick }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await paymentsApi.getHistory();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load billing history:', err);
      // Non-blocking toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="bg-[#111420] border border-white/[0.07] rounded-2xl p-6 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
            Transaction Ledger
          </span>
          <h3 className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>Purchases, Bills &amp; Invoices</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            View, download, and print official tax receipts for all your PageWise Studio purchases.
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/[0.06] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          <span className="text-xs font-mono">Loading purchase history...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-12 px-4 rounded-xl bg-black/30 border border-white/[0.05] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-white">No Purchases Yet</h4>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              You are currently on the free plan. When you upgrade to Pagewise Pro or buy a Wiser Day Pass, your official receipts and bills will appear here.
            </p>
          </div>
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-600/20 cursor-pointer"
            >
              Explore Upgrades
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] overflow-hidden bg-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Plan / Service</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-zinc-300">
                {orders.map((o) => {
                  const isPaid = o.status === 'paid';
                  const isFailed = o.status === 'failed';
                  const dateStr = o.created_at
                    ? new Date(o.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        {o.invoice_number || `INV-${o.id}`}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-white">
                          {o.plan_name || o.plan_type}
                        </span>
                        {o.duration_days && (
                          <span className="text-[10px] font-mono text-zinc-500 ml-1.5">
                            ({o.duration_days}d)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        ₹{Number(o.amount_inr || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : isFailed
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isFailed ? (
                            <XCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{o.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500 truncate max-w-[120px]" title={o.payment_id || o.order_id}>
                        {o.payment_id || o.order_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white border border-white/[0.08] text-[11px] font-mono inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedOrder && (
        <InvoiceModal
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
          user={user}
        />
      )}
    </div>
  );
}
