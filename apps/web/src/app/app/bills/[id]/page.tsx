'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  ChevronLeft,
  Receipt,
  FileText,
  Printer,
  Landmark,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export default function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const billId = resolvedParams.id;
  const { t } = useAccessibility();

  const [bill, setBill] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getBillDetail(billId)
      .then((data) => setBill(data))
      .catch(() => {
        // Fallback demo bill
        setBill({
          id: billId,
          bill_no: 'BILL/2026-27/000101',
          cycle_name: 'Nov 2026',
          period_start: '2026-11-01',
          period_end: '2026-11-30',
          due_date: '2026-11-15',
          subtotal_paise: 385000,
          tax_paise: 0,
          total_paise: 385000,
          paid_paise: 0,
          status: 'ISSUED',
          flat_number: '101',
          wing_name: 'A',
          lines: [
            { id: '1', description: 'Monthly Society Maintenance Fixed Charge', qty: 1, rate_paise: 200000, amount_paise: 200000, tax_paise: 0 },
            { id: '2', description: 'Water & Common Utility Charges (per sqft)', qty: 1250, rate_paise: 120, amount_paise: 150000, tax_paise: 0 },
            { id: '3', description: 'Covered Parking Slot Maintenance', qty: 1, rate_paise: 35000, amount_paise: 35000, tax_paise: 0 },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, [billId]);

  if (loading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading bill breakdown...
        </div>
      </ShellLayout>
    );
  }

  const isPaid = bill?.status === 'PAID';

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link & Print */}
        <div className="flex items-center justify-between">
          <Link
            href="/app/bills"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Bills</span>
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Print Bill</span>
          </button>
        </div>

        {/* Bill Document Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm print:border-none print:shadow-none">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div>
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider block mb-1">
                GrievEase Maintenance Bill
              </span>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {bill?.cycle_name} Maintenance
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Flat: <strong>{bill?.wing_name}-{bill?.flat_number}</strong> • Bill No: <code>{bill?.bill_no}</code>
              </p>
            </div>
            <div className="text-right sm:text-right">
              <span
                className={`inline-block text-xs px-3 py-1 rounded-full font-bold ${
                  isPaid
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {bill?.status}
              </span>
              <p className="text-xs text-slate-400 mt-2">
                Due Date: <strong className="text-slate-700 dark:text-slate-200">{new Date(bill?.due_date).toLocaleDateString()}</strong>
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase font-semibold">
                  <th className="py-2.5">Head / Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Rate</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {bill?.lines?.map((line: any) => (
                  <tr key={line.id}>
                    <td className="py-3 font-medium">
                      {line.description || line.head_name}
                    </td>
                    <td className="py-3 text-center">{line.qty || 1}</td>
                    <td className="py-3 text-right">{formatPaise(line.rate_paise)}</td>
                    <td className="py-3 text-right font-bold">{formatPaise(line.amount_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>{t.billing.subtotal}:</span>
              <span className="font-bold">{formatPaise(bill?.subtotal_paise || 0)}</span>
            </div>
            {bill?.tax_paise > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>{t.billing.tax}:</span>
                <span className="font-bold">{formatPaise(bill.tax_paise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>{t.billing.totalAmount}:</span>
              <span className="text-teal-600">{formatPaise(bill?.total_paise || 0)}</span>
            </div>
          </div>

          {/* How to Pay Alert */}
          {!isPaid && (
            <div className="bg-teal-50 dark:bg-teal-950/60 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300">
                <Landmark className="w-4 h-4 shrink-0" />
                <span>Cash Payment at Society Office</span>
              </div>
              <p>
                {t.billing.payOfficeNotice} Once recorded by the secretary, an official digital receipt with an audit chain verification stamp will be issued immediately.
              </p>
              <Link
                href="/app/bills/how-to-pay"
                className="inline-block font-bold text-teal-700 dark:text-teal-300 underline"
              >
                View collection desk hours &amp; instructions →
              </Link>
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}

