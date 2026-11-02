'use client';

import React from 'react';
import {
  X,
  Receipt,
  Copy,
  Check,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailModal({ order, isOpen, onClose }) {
  const [copiedKey, setCopiedKey] = React.useState(null);

  if (!isOpen || !order) return null;

  const copyToClipboard = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isPaid = order.status === 'paid';
  const isFailed = order.status === 'failed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111420] border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-[#0e1018]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Order #{order.id}</h3>
              <p className="text-[11px] text-zinc-500 font-mono">
                {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              isPaid
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : isFailed
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isPaid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : isFailed ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CreditCard className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <div>
                <div className="font-bold uppercase tracking-wider text-xs">
                  Status: {order.status}
                </div>
                <div className="text-[11px] opacity-80">
                  {isPaid
                    ? 'Payment verified and subscription allocated'
                    : isFailed
                    ? 'Payment authorization failed'
                    : 'Order initiated, pending settlement'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold font-mono text-white">
                ₹{order.amount_inr}
              </div>
              <span className="text-[10px] font-mono opacity-80 uppercase">{order.currency}</span>
            </div>
          </div>

          {/* Customer Metadata Card */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
              Customer Account
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">User ID</span>
                <span className="font-mono text-white font-semibold">#{order.user_id}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Customer Name</span>
                <span className="text-white font-semibold">{order.user_name || 'Anonymous'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-zinc-500 block text-[11px]">Customer Email</span>
                <span className="font-mono text-zinc-200">{order.user_email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Identifiers */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 font-mono">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold block font-sans">
              Gateway Identifiers &amp; Webhook Signatures
            </span>

            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="text-zinc-500 block text-[10px]">Plan Type Purchased</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-amber-400 uppercase inline-block mt-0.5">
                  {order.plan_type}
                </span>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px]">Razorpay Order ID</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 mt-1">
                  <span className="text-zinc-200 break-all select-all">
                    {order.razorpay_order_id || 'Not generated'}
                  </span>
                  {order.razorpay_order_id && (
                    <button
                      onClick={() => copyToClipboard(order.razorpay_order_id, 'order_id')}
                      className="p-1 text-zinc-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
                    >
                      {copiedKey === 'order_id' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-zinc-500 block text-[10px]">Razorpay Payment ID</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 mt-1">
                  <span className="text-zinc-200 break-all select-all">
                    {order.razorpay_payment_id || 'Pending / Unpaid'}
                  </span>
                  {order.razorpay_payment_id && (
                    <button
                      onClick={() => copyToClipboard(order.razorpay_payment_id, 'payment_id')}
                      className="p-1 text-zinc-400 hover:text-white transition cursor-pointer shrink-0 ml-2"
                    >
                      {copiedKey === 'payment_id' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {order.receipt && (
                <div>
                  <span className="text-zinc-500 block text-[10px]">Receipt ID</span>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800/80 text-zinc-300 mt-1">
                    {order.receipt}
                  </div>
                </div>
              )}

              {order.error_message && (
                <div>
                  <span className="text-rose-400 block text-[10px]">Error Audit Diagnostic</span>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs mt-1">
                    {order.error_message}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-[#0e1018] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
