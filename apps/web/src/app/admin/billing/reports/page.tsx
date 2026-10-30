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
  BarChart3,
  TrendingUp,
  Receipt,
  Download,
  Calendar,
  DollarSign,
  ArrowLeft,
  RefreshCw,
  BookOpen,
  PieChart,
} from 'lucide-react';

export default function AdminBillingReportsPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [heads, setHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, hd] = await Promise.all([api.getBillingOverview(), api.listBillHeads()]);
      setOverview(ov);
      if (Array.isArray(hd)) setHeads(hd);
    } catch (err: any) {
      console.warn('Failed to load billing reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <BarChart3 className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Reports & Cash Book</h1>
                <p className="text-sm text-slate-500">
                  Daily cash register, collection efficiency, head-wise revenue, and audited records.
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
              onClick={loadData}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-slate-500">Monthly Invoiced</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatPaise(overview?.billedThisMonthPaise || 0)}
              </h3>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-emerald-50/40">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-emerald-800">Cash Collected</span>
              <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                {formatPaise(overview?.collectedThisMonthPaise || 0)}
              </h3>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-rose-50/40">
            <CardContent className="p-5">
              <span className="text-xs font-semibold text-rose-800">Receivables Outstanding</span>
              <h3 className="text-2xl font-bold text-rose-800 mt-1">
                {formatPaise(overview?.outstandingPaise || 0)}
              </h3>
            </CardContent>
          </Card>
        </div>

        {/* Head-wise Revenue Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Active Maintenance Heads
              </CardTitle>
              <CardDescription className="text-xs">
                Configured rate schedule and calculation methods.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {heads.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{h.name_en || h.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{h.calc_method}</span>
                    </div>
                    <span className="font-bold text-slate-900">{formatPaise(h.rate_paise)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Audited Links */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                Audited Ledgers & Cash Book
              </CardTitle>
              <CardDescription className="text-xs">
                Direct links to specialized financial registers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/admin/billing/receipts"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition"
              >
                <span>Digital Receipts Register</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/admin/billing/day-close"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition"
              >
                <span>Daily Cash Book & Sessions</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/admin/billing/defaulters"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition"
              >
                <span>Aging of Maintenance Dues (Audited)</span>
                <span className="text-slate-400">→</span>
              </Link>
              <Link
                href="/admin/billing/adjustments"
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition"
              >
                <span>Waivers & Adjustments Audit Log</span>
                <span className="text-slate-400">→</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}

