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
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Receipt,
  Clock,
  ArrowRight,
  Plus,
  FileText,
  Users,
  ShieldAlert,
  CheckCircle2,
  Settings,
  RefreshCw,
  FolderPlus,
  Scale,
  Calendar,
} from 'lucide-react';

export default function AdminBillingOverviewPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getBillingOverview();
      setOverview(data);
    } catch (err: any) {
      console.warn('Failed to load billing overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Receipt className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Maintenance & Cash Billing</h1>
                <p className="text-sm text-slate-500">
                  Track society collections, bill cycles, cashier day closes, and hash-chained ledgers.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/billing/collect"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Record Cash Payment
            </Link>
            <button
              onClick={loadOverview}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Unclosed Sessions Alert */}
        {overview?.unclosedSessionsCount > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">
                  {overview.unclosedSessionsCount} Cash Session(s) Unclosed Past 24 Hours
                </p>
                <p className="text-xs text-amber-800">
                  Collectors must perform Daily Cash Close to count cash drawer, document variance, and reconcile bank deposits.
                </p>
              </div>
            </div>
            <Link
              href="/admin/billing/day-close"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl whitespace-nowrap shadow-sm"
            >
              Go to Day Close
            </Link>
          </div>
        )}

        {/* KPI Cards */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
            <p className="font-medium">Loading financial metrics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Billed This Month</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                    {formatPaise(overview?.billedThisMonthPaise || 0)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Collected Cash</span>
                  <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
                    {formatPaise(overview?.collectedThisMonthPaise || 0)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Total Outstanding</span>
                  <h3 className="text-2xl font-bold text-rose-700 mt-0.5">
                    {formatPaise(overview?.outstandingPaise || 0)}
                  </h3>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500">Collection Rate</span>
                  <h3 className="text-2xl font-bold text-purple-700 mt-0.5">
                    {overview?.collectionRatePercent !== undefined ? `${overview.collectionRatePercent}%` : '0%'}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Navigation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Operations */}
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Cash Desk & Receipts
              </CardTitle>
              <CardDescription className="text-xs">
                Manual cash collections with gapless sequential receipt numbers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link
                href="/admin/billing/collect"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Record Cash Collection Desk</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/receipts"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Digital Receipts Register</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/day-close"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Daily Cash Sessions & Reconciliation</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Billing Cycles & Heads */}
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Cycles & Bill Heads
              </CardTitle>
              <CardDescription className="text-xs">
                Generate monthly/quarterly maintenance bills with Maker-Checker verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link
                href="/admin/billing/cycles"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Bill Cycles (Preview & Commit)</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/heads"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Bill Heads & Calculation Methods</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/opening-balances"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Opening Balances Migration</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>

          {/* Maker-Checker & Governance */}
          <Card className="border border-slate-200 shadow-sm hover:shadow-md transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                Maker-Checker & Governance
              </CardTitle>
              <CardDescription className="text-xs">
                Separation of duties: approvals, waivers, disputes, and hash-chain audit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <Link
                href="/admin/billing/adjustments"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Waivers & Adjustments Queue</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/disputes"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Payment Disputes Desk</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/ledger"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Flat Ledgers & Chain Verification</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
              <Link
                href="/admin/billing/defaulters"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 transition"
              >
                <span>Defaulters Aging Report (Audited)</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}

