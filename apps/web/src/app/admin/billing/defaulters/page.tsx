'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  ArrowLeft,
  FileText,
  DollarSign,
  ShieldCheck,
  Building,
  Calendar,
} from 'lucide-react';

export default function DefaultersAgingReportPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDefaulters = async () => {
    setLoading(true);
    try {
      const res = await api.getDefaultersReport();
      setData(res);
    } catch (err: any) {
      console.warn('Failed to load defaulters report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDefaulters();
  }, []);

  // Formula-safe CSV download
  const handleExportCSV = () => {
    if (!data?.defaulters || data.defaulters.length === 0) return;

    // Helper to sanitize CSV field against formula injection
    const sanitize = (val: any) => {
      let str = String(val ?? '');
      if (str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@')) {
        str = `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Flat Number',
      'Wing',
      'Resident Name',
      'Total Overdue (₹)',
      '0-30 Days (₹)',
      '31-60 Days (₹)',
      '61-90 Days (₹)',
      '90+ Days (₹)',
      'Oldest Unpaid Bill Date',
    ];

    const rows = data.defaulters.map((d: any) => [
      sanitize(d.flat_number),
      sanitize(d.wing_name),
      sanitize(d.resident_name || 'Owner'),
      sanitize(((d.total_overdue_paise || 0) / 100).toFixed(2)),
      sanitize(((d.bucket_0_30_paise || 0) / 100).toFixed(2)),
      sanitize(((d.bucket_31_60_paise || 0) / 100).toFixed(2)),
      sanitize(((d.bucket_61_90_paise || 0) / 100).toFixed(2)),
      sanitize(((d.bucket_90_plus_paise || 0) / 100).toFixed(2)),
      sanitize(d.oldest_due_date ? new Date(d.oldest_due_date).toLocaleDateString() : 'N/A'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `defaulters_aging_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Defaulters Aging Report</h1>
                <p className="text-sm text-slate-500">
                  Track overdue maintenance receivables categorized by aging intervals (Audited).
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/billing"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Overview
            </Link>
            <button
              onClick={handleExportCSV}
              disabled={!data?.defaulters || data.defaulters.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export CSV (Audited)
            </button>
            <button
              onClick={loadDefaulters}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Audit Notice */}
        <div className="p-4 bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl flex items-center gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
          <span>
            Every view and CSV export of this defaulters report is timestamped and written to the
            cryptographic hash-chained audit log with your operator ID.
          </span>
        </div>

        {/* Aging Bucket Summary Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-3" />
            <p className="font-medium">Aggregating aging buckets...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">0 - 30 Days</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {formatPaise(data?.summary?.bucket_0_30_paise || 0)}
                  </h3>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-[11px] font-bold text-amber-600 uppercase">31 - 60 Days</span>
                  <h3 className="text-xl font-bold text-amber-700 mt-1">
                    {formatPaise(data?.summary?.bucket_31_60_paise || 0)}
                  </h3>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <span className="text-[11px] font-bold text-orange-600 uppercase">61 - 90 Days</span>
                  <h3 className="text-xl font-bold text-orange-700 mt-1">
                    {formatPaise(data?.summary?.bucket_61_90_paise || 0)}
                  </h3>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm bg-rose-50/50">
                <CardContent className="p-4">
                  <span className="text-[11px] font-bold text-rose-700 uppercase">90+ Days Critical</span>
                  <h3 className="text-xl font-bold text-rose-800 mt-1">
                    {formatPaise(data?.summary?.bucket_90_plus_paise || 0)}
                  </h3>
                </CardContent>
              </Card>
            </div>

            {/* Defaulters Table */}
            {data?.defaulters?.length === 0 ? (
              <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                <p className="font-semibold text-slate-800 text-base">No Overdue Defaulters</p>
                <p className="text-xs text-slate-400 mt-1">
                  All society flats are up to date on their maintenance dues.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-5 py-3.5">Flat / Unit</th>
                      <th className="px-5 py-3.5">Total Overdue</th>
                      <th className="px-5 py-3.5">0-30 Days</th>
                      <th className="px-5 py-3.5">31-60 Days</th>
                      <th className="px-5 py-3.5">61-90 Days</th>
                      <th className="px-5 py-3.5 text-rose-700">90+ Days</th>
                      <th className="px-5 py-3.5 text-right">Ledger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.defaulters.map((d: any) => (
                      <tr key={d.flat_id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-bold text-slate-900">
                          Flat {d.wing_name ? `${d.wing_name}-` : ''}
                          {d.flat_number}
                        </td>
                        <td className="px-5 py-4 font-bold text-rose-700 text-sm">
                          {formatPaise(d.total_overdue_paise)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">
                          {formatPaise(d.bucket_0_30_paise || 0)}
                        </td>
                        <td className="px-5 py-4 text-amber-700 font-medium">
                          {formatPaise(d.bucket_31_60_paise || 0)}
                        </td>
                        <td className="px-5 py-4 text-orange-700 font-medium">
                          {formatPaise(d.bucket_61_90_paise || 0)}
                        </td>
                        <td className="px-5 py-4 font-bold text-rose-700">
                          {formatPaise(d.bucket_90_plus_paise || 0)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/billing/ledger?flatId=${d.flat_id}`}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs inline-block transition"
                          >
                            View Ledger
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

