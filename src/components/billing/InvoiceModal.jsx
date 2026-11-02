'use client';

import React from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  FileText,
  CreditCard,
  Building,
  Calendar,
  Hash,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import { BrandLockup } from '@/lib/brand';

export default function InvoiceModal({ isOpen, onClose, order, user }) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const invoiceTime = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const isPaid = order.status === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0E1018] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Bar (Hidden during print) */}
        <div className="px-5 py-3.5 border-b border-white/[0.08] bg-[#12141F] flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Invoice #{order.invoice_number || `INV-${order.id}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-zinc-200 print:p-8 print:text-black print:bg-white">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/[0.08] print:border-zinc-300">
            <div>
              <BrandLockup size={26} showTagline={false} />
              <div className="text-[11px] text-zinc-400 mt-2 font-mono space-y-0.5 print:text-zinc-600">
                <p>PageWise Studio Cloud Services</p>
                <p>support@pagewise.app</p>
                <p>Bangalore, Karnataka, India</p>
              </div>
            </div>

            <div className="sm:text-right font-mono">
              <span className="text-xs uppercase tracking-wider font-bold text-amber-400 print:text-amber-700">
                Official Tax Invoice / Receipt
              </span>
              <div className="text-sm font-bold text-white mt-1 print:text-black">
                {order.invoice_number || `INV-${order.id}`}
              </div>
              <div className="text-[11px] text-zinc-400 mt-1 print:text-zinc-600">
                Date: {invoiceDate} {invoiceTime}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border print:border-zinc-400"
                style={{
                  backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isPaid ? '#10b981' : '#ef4444',
                  borderColor: isPaid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
                }}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>{order.status?.toUpperCase() || 'PAID'}</span>
              </div>
            </div>
          </div>

          {/* Billed To & Payment Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] print:bg-zinc-50 print:border-zinc-200">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 print:text-zinc-600">
                Billed To
              </span>
              <div className="font-semibold text-white print:text-black text-sm">
                {user?.name || 'Customer'}
              </div>
              <div className="text-zinc-400 print:text-zinc-600 text-xs mt-0.5">
                {user?.email}
              </div>
              <div className="text-zinc-500 print:text-zinc-500 text-[11px] mt-1">
                Account ID: #{user?.id || order.user_id || '—'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] print:bg-zinc-50 print:border-zinc-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5 print:text-zinc-600">
                Payment Info
              </span>
              <div className="flex justify-between text-zinc-300 print:text-zinc-700">
                <span className="text-zinc-500">Gateway:</span>
                <span className="font-semibold">Razorpay Secure</span>
              </div>
              <div className="flex justify-between text-zinc-300 print:text-zinc-700">
                <span className="text-zinc-500">Order ID:</span>
                <span className="truncate max-w-[140px]" title={order.order_id}>{order.order_id || '—'}</span>
              </div>
              <div className="flex justify-between text-zinc-300 print:text-zinc-700">
                <span className="text-zinc-500">Payment ID:</span>
                <span className="truncate max-w-[140px]" title={order.payment_id}>{order.payment_id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="rounded-xl border border-white/[0.08] overflow-hidden print:border-zinc-300">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] border-b border-white/[0.08] text-[10px] uppercase tracking-wider text-zinc-400 font-mono print:bg-zinc-100 print:text-zinc-600 print:border-zinc-300">
                <tr>
                  <th className="py-3 px-4">Item &amp; Description</th>
                  <th className="py-3 px-4 text-center">Duration</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] print:divide-zinc-200">
                <tr>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white print:text-black">
                      {order.plan_name || order.plan_type}
                    </div>
                    <div className="text-[11px] text-zinc-400 print:text-zinc-600 mt-0.5">
                      Full access to PageWise Studio workspace, PDF export engine, ATS audits &amp; Wiser AI
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-center text-zinc-300 print:text-zinc-700">
                    {order.duration_days ? `${order.duration_days} Days` : order.billing_period_text || 'Active Cycle'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-right font-bold text-white print:text-black">
                    ₹{Number(order.amount_inr || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pricing Totals */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/[0.08] print:border-zinc-300">
            <div className="text-[11px] text-zinc-500 print:text-zinc-600 font-mono space-y-0.5">
              <p>• All prices are inclusive of taxes and charges.</p>
              <p>• Electronic receipt generated automatically upon successful gateway verification.</p>
            </div>

            <div className="w-full sm:w-56 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>Subtotal:</span>
                <span>₹{Number(order.amount_inr || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-zinc-600">
                <span>Taxes (GST Inclusive):</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white print:text-black pt-2 border-t border-white/[0.08] print:border-zinc-300">
                <span>Total Paid:</span>
                <span className="text-amber-400 print:text-black">
                  ₹{Number(order.amount_inr || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 text-center text-[11px] text-zinc-500 print:text-zinc-500 border-t border-white/[0.05] print:border-zinc-200 font-mono">
            Thank you for building your professional career with PageWise Studio!
          </div>
        </div>

        {/* Modal Bottom Close (Hidden during print) */}
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-[#12141F] flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white transition-colors cursor-pointer"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
