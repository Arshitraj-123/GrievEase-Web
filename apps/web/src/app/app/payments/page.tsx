'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  CreditCard,
  Receipt,
  ArrowRight,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function ResidentPaymentsHistoryPage() {
  const { t } = useAccessibility();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyPayments()
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback demo data
        setPayments([
          {
            id: 'pay-01',
            receipt_no: 'RC/2026-27/000101',
            amount_paise: 385000,
            received_on: '2026-10-12',
            mode: 'CASH',
            status: 'RECORDED',
          },
          {
            id: 'pay-02',
            receipt_no: 'RC/2026-27/000045',
            amount_paise: 385000,
            received_on: '2026-09-10',
            mode: 'CASH',
            status: 'RECORDED',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-teal-600" />
              <span>Payment Receipts History</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Every cash payment recorded at the society office with gapless receipt numbers
            </p>
          </div>
          <Link
            href="/app/statement"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800 hover:bg-teal-100 min-h-[44px]"
          >
            <span>View Full Ledger</span>
          </Link>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading payment receipts...
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No recorded payments yet
            </h3>
            <p className="text-xs text-slate-400">
              Receipts will appear here as soon as cash is deposited at the office.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const isVoided = p.status === 'VOIDED';
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-bold text-slate-900 dark:text-white">
                        Receipt: <code>{p.receipt_no}</code>
                      </strong>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isVoided
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 line-through'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Date: <strong>{new Date(p.received_on).toLocaleDateString()}</strong></span>
                      <span>•</span>
                      <span>Mode: <strong>{p.mode}</strong></span>
                      <span>•</span>
                      <span>Amount: <strong className="text-slate-900 dark:text-white text-sm">{formatPaise(p.amount_paise)}</strong></span>
                    </div>
                  </div>

                  <Link
                    href={`/app/payments/${p.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 min-h-[44px] self-start sm:self-center"
                  >
                    <span>View Digital Receipt</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

