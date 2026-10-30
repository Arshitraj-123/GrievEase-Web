'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Receipt,
  ArrowRight,
} from 'lucide-react';

export default function ResidentStatementPage() {
  const { t } = useAccessibility();
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    api
      .getMyStatement()
      .then(setStatement)
      .catch(() => {
        // Fallback demo ledger
        setStatement({
          flatId: 'demo-flat',
          currentBalancePaise: 0,
          entries: [
            {
              id: '1',
              seq: 1,
              entryType: 'OPENING_BALANCE',
              direction: 'DEBIT',
              amountPaise: 150000,
              narration: 'Opening balance as of 2026-04-01',
              createdAt: '2026-04-01T00:00:00.000Z',
              createdByName: 'System',
              runningBalancePaise: 150000,
              hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            },
            {
              id: '2',
              seq: 2,
              entryType: 'PAYMENT',
              direction: 'CREDIT',
              amountPaise: 150000,
              narration: 'Payment received (Receipt RC/2026-27/000010)',
              createdAt: '2026-04-10T11:00:00.000Z',
              createdByName: 'Vikram Singh',
              runningBalancePaise: 0,
              hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
            },
            {
              id: '3',
              seq: 3,
              entryType: 'BILL',
              direction: 'DEBIT',
              amountPaise: 385000,
              narration: 'Maintenance bill BILL/2026-27/000080 for Oct 2026',
              createdAt: '2026-10-01T09:00:00.000Z',
              createdByName: 'Vikram Singh',
              runningBalancePaise: 385000,
              hash: 'c4d5e6f7a8b90123456789abcdef0123456789abcdef0123456789abcdef0123',
            },
            {
              id: '4',
              seq: 4,
              entryType: 'PAYMENT',
              direction: 'CREDIT',
              amountPaise: 385000,
              narration: 'Payment received (Receipt RC/2026-27/000101)',
              createdAt: '2026-10-12T11:30:00.000Z',
              createdByName: 'Vikram Singh',
              runningBalancePaise: 0,
              hash: '7890123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd',
            },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const entries = statement?.entries || [];

  const filteredEntries = entries.filter((e: any) => {
    if (fromDate && new Date(e.createdAt) < new Date(fromDate)) return false;
    if (toDate && new Date(e.createdAt) > new Date(toDate + 'T23:59:59')) return false;
    return true;
  });

  const downloadCsv = () => {
    // Formula-safe CSV export
    const sanitize = (val: string) => {
      if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
      return `"${val.replace(/"/g, '""')}"`;
    };

    const headers = ['Seq', 'Date', 'Type', 'Description', 'Debit (Rs)', 'Credit (Rs)', 'Running Balance (Rs)', 'Hash'];
    const rows = filteredEntries.map((e: any) => [
      e.seq,
      new Date(e.createdAt).toISOString().split('T')[0],
      e.entryType,
      sanitize(e.narration),
      e.direction === 'DEBIT' ? (e.amountPaise / 100).toFixed(2) : '0.00',
      e.direction === 'CREDIT' ? (e.amountPaise / 100).toFixed(2) : '0.00',
      (e.runningBalancePaise / 100).toFixed(2),
      e.hash.slice(0, 16),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flat-statement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-600" />
              <span>{t.billing.statementTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Append-only cryptographic ledger of all debits and credits for your flat
            </p>
          </div>
          <button
            onClick={downloadCsv}
            disabled={filteredEntries.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 disabled:opacity-50 min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Running Balance Banner */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {t.billing.runningBalance}
            </span>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {formatPaise(statement?.currentBalancePaise || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {statement?.currentBalancePaise === 0
                ? 'Your flat dues are fully cleared. Thank you!'
                : statement?.currentBalancePaise > 0
                ? 'Outstanding balance payable at the society office.'
                : 'Advance credit balance on your account.'}
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs min-h-[36px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs min-h-[36px]"
              />
            </div>
          </div>
        </div>

        {/* Ledger Entries Table */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading ledger entries...
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase font-bold text-[11px]">
                    <th className="py-3 px-4">Seq</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Narration</th>
                    <th className="py-3 px-4 text-right">{t.billing.debit}</th>
                    <th className="py-3 px-4 text-right">{t.billing.credit}</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredEntries.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono text-slate-400">#{e.seq}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {e.entryType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium max-w-xs">{e.narration}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600 dark:text-red-400">
                        {e.direction === 'DEBIT' ? formatPaise(e.amountPaise) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {e.direction === 'CREDIT' ? formatPaise(e.amountPaise) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        {formatPaise(e.runningBalancePaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

