'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Star,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { getMyPerformance } from '@/lib/api';
import { ResolverSummaryDto } from '@grievease/contracts';
import { MetricsCalculationPopover } from '@/components/analytics/MetricsCalculationPopover';

export default function MyPerformancePage() {
  const [summary, setSummary] = useState<ResolverSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPerformance()
      .then((data) => setSummary(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No Resolver History Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          You currently have no complaints assigned to your governance profile.
        </p>
        <Link
          href="/admin/grievances"
          className="px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
        >
          View Governance Inbox
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Navigation */}
      <Link
        href="/admin/performance"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Leaderboard</span>
      </Link>

      {/* Header Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
              {summary.levelName}
            </span>
            <MetricsCalculationPopover metricKey="resolver_performance" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{summary.fullName}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your personal governance scorecard normalized against Level {summary.level} volume standards.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              summary.performanceLabel === 'Excellent'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : summary.performanceLabel === 'On track'
                ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {summary.performanceLabel}
          </span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Assigned</span>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {summary.assigned}
          </div>
          <span className="text-[10px] text-slate-400">Total tickets</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">SLA Hit Rate</span>
          <div className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {summary.slaHitRate !== null ? `${summary.slaHitRate}%` : 'N/A'}
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.isSampleSizeSufficient ? 'Sample size verified' : '<5 closed items'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Resolution</span>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {(summary.avgResolutionMinutes / 60).toFixed(1)}h
          </div>
          <span className="text-[10px] text-slate-400">Net working hours</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Satisfaction</span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">
            {summary.avgRating !== null ? `${summary.avgRating} ★` : '—'}
          </div>
          <span className="text-[10px] text-slate-400">{summary.ratingCount} reviews</span>
        </div>
      </div>

      {/* Fairness & Protection Notes */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-600 dark:text-slate-400 space-y-2">
        <h4 className="font-bold text-slate-800 dark:text-slate-200">Governance Fairness Rules</h4>
        <ul className="list-disc list-inside space-y-1 text-[11px]">
          <li>Items delayed while you were on approved leave are excluded from breach counts.</li>
          <li>Time spent in PENDING_INFO (awaiting resident clarification) was paused from your SLA timer.</li>
          <li>Only rates and averages are evaluated to avoid penalizing high-volume assignees.</li>
        </ul>
      </div>
    </div>
  );
}
