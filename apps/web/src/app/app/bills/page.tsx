'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Receipt,
  FileText,
  AlertTriangle,
  ArrowRight,
  Clock,
  Landmark,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function ResidentBillsPage() {
  const { t } = useAccessibility();
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyBills()
      .then((data) => setBills(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback demo data
        setBills([
          {
            id: 'bill-nov-2026',
            bill_no: 'BILL/2026-27/000101',
            cycle_name: 'Nov 2026',
            due_date: '2026-11-15',
            total_paise: 385000,
            paid_paise: 0,
            status: 'ISSUED',
          },
          {
            id: 'bill-oct-2026',
            bill_no: 'BILL/2026-27/000080',
            cycle_name: 'Oct 2026',
            due_date: '2026-10-15',
            total_paise: 385000,
            paid_paise: 385000,
            status: 'PAID',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalOutstandingPaise = bills
    .filter((b) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status))
    .reduce((acc, b) => acc + (b.total_paise - (b.paid_paise || 0)), 0);

  const nextDueBill = bills
    .filter((b) => ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(b.status))
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-teal-600" />
              <span>{t.billing.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.billing.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/statement"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 min-h-[44px]"
            >
              <FileText className="w-4 h-4" />
              <span>Statement</span>
            </Link>
            <Link
              href="/app/bills/how-to-pay"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold text-xs border border-teal-200 dark:border-teal-800 hover:bg-teal-100 min-h-[44px]"
            >
              <Landmark className="w-4 h-4" />
              <span>How to Pay</span>
            </Link>
          </div>
        </div>

        {/* Outstanding Dues Banner */}
        <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                {t.billing.outstandingTotal}
              </span>
              <div className="text-2xl sm:text-4xl font-black mt-1">
                {formatPaise(totalOutstandingPaise)}
              </div>
            </div>

            {nextDueBill && (
              <div className="sm:text-right">
                <span className="text-xs text-slate-300 block">
                  {t.billing.nextDueDate}
                </span>
                <strong className="text-sm sm:text-base font-bold text-amber-300 flex items-center sm:justify-end gap-1.5 mt-0.5">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(nextDueBill.due_date).toLocaleDateString()}</span>
                </strong>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-teal-700/60 flex items-center justify-between text-xs text-teal-100">
            <span>{t.billing.payOfficeNotice}</span>
            <Link
              href="/app/bills/how-to-pay"
              className="font-bold underline text-white hover:text-teal-200"
            >
              Office Hours &amp; Location
            </Link>
          </div>
        </div>

        {/* Bills List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading bills...
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No bills found
            </h3>
            <p className="text-xs text-slate-400">
              No maintenance bills have been issued to your flat yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {bills.map((bill) => {
              const due = bill.total_paise - (bill.paid_paise || 0);
              const isPaid = bill.status === 'PAID';
              const isOverdue = bill.status === 'OVERDUE';
              return (
                <div
                  key={bill.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-bold text-slate-900 dark:text-white">
                        {bill.cycle_name} Maintenance
                      </strong>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                          isPaid
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : isOverdue
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span>Bill No: <code>{bill.bill_no}</code></span>
                      <span>•</span>
                      <span>Due Date: <strong>{new Date(bill.due_date).toLocaleDateString()}</strong></span>
                      <span>•</span>
                      <span>Total: <strong>{formatPaise(bill.total_paise)}</strong></span>
                    </div>

                    {!isPaid && due > 0 && (
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 pt-0.5">
                        Outstanding to Pay: {formatPaise(due)}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/app/bills/${bill.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 min-h-[44px] self-start sm:self-center"
                  >
                    <span>View Breakdown</span>
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

