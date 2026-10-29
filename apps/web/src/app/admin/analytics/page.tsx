'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ShieldAlert,
  ArrowRight,
  Download,
} from 'lucide-react';
import { getAdminAnalytics } from '@/lib/api';
import { AdminAnalyticsDto, AnalyticsRange } from '@grievease/contracts';
import { useTranslation } from '@/i18n';
import { AccessibleChartCard } from '@/components/analytics/AccessibleChartCard';
import { TrendLineChart } from '@/components/analytics/TrendLineChart';
import { WingHeatmapGrid } from '@/components/analytics/WingHeatmapGrid';
import { AgingReportChart } from '@/components/analytics/AgingReportChart';
import { GovernanceLevelFunnel } from '@/components/analytics/GovernanceLevelFunnel';

export default function AdminAnalyticsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<AdminAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminAnalytics({ range })
      .then((res) => {
        if (res) setData(res);
      })
      .finally(() => setLoading(false));
  }, [range]);

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Administrative analytics unavailable. Verify role permissions.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Executive Telemetry
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('analytics.adminAnalyticsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.adminAnalyticsSubtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Range Chips */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(['30d', '90d', '12m'] as AnalyticsRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  range === r
                    ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '12 Months'}
              </button>
            ))}
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Export Ledgers</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Logged</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {data.kpis.totalSubmitted}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Active Load</span>
          <div className="text-xl font-extrabold text-amber-500 mt-1">{data.kpis.openLoad}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Resolved</span>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {data.kpis.resolvedCount}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Time</span>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {data.kpis.avgResolutionHours}h
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">SLA Hit %</span>
          <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {data.kpis.slaComplianceRate}%
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Rating</span>
          <div className="text-xl font-extrabold text-amber-500 mt-1">
            {data.kpis.satisfactionScore !== null ? `${data.kpis.satisfactionScore} ★` : '—'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Appeals</span>
          <div className="text-xl font-extrabold text-rose-500 mt-1">{data.kpis.appealsCount}</div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Reopened</span>
          <div className="text-xl font-extrabold text-purple-500 mt-1">{data.kpis.reopensCount}</div>
        </div>
      </div>

      {/* FINAL_LEVEL_OVERDUE Alert Banner (if any exist) */}
      {data.finalLevelOverdue.length > 0 && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              {t('analytics.finalLevelOverdueTitle')} ({data.finalLevelOverdue.length} items)
            </h3>
          </div>
          <p className="text-xs text-rose-700 dark:text-rose-300">
            Auto-escalation halts at Level 4 (Governing Body). These grievances are past due date and require immediate executive intervention.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-rose-100/60 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-1.5">ID</th>
                  <th className="px-3 py-1.5">Title</th>
                  <th className="px-3 py-1.5">Category</th>
                  <th className="px-3 py-1.5">Priority</th>
                  <th className="px-3 py-1.5">Hours Overdue</th>
                  <th className="px-3 py-1.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200/50 dark:divide-rose-900/50 text-rose-800 dark:text-rose-200">
                {data.finalLevelOverdue.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 font-mono font-bold">{item.publicId}</td>
                    <td className="px-3 py-2 max-w-xs truncate">{item.title}</td>
                    <td className="px-3 py-2">{item.categoryName}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200">
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-rose-600 dark:text-rose-400">
                      +{item.hoursOverdue}h
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/grievances/${item.id}`}
                        className="text-xs font-bold text-rose-700 dark:text-rose-300 hover:underline inline-flex items-center gap-1"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Row 1: Trend Line & Aging Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AccessibleChartCard
            title="Complaint Velocity & Resolution Trend"
            description="Daily intake versus completed resolutions"
            metricKey="resolution_time"
            screenReaderSummary={`Trend data: ${data.trend.map((t) => `${t.date}: ${t.submitted} sub, ${t.resolved} res`).join(', ')}`}
            tableHeaders={['Date', 'Submitted', 'Resolved', 'Escalated']}
            tableRows={data.trend.map((t) => [t.date, t.submitted, t.resolved, t.escalated])}
          >
            <TrendLineChart data={data.trend} height={260} />
          </AccessibleChartCard>
        </div>

        <div className="lg:col-span-4">
          <AccessibleChartCard
            title={t('analytics.agingBucketsTitle')}
            description="Current open inventory age breakdown"
            metricKey="aging_buckets"
            screenReaderSummary={`Aging buckets: 0-1 days: ${data.agingBuckets.zeroToOneDays}, 1-3 days: ${data.agingBuckets.oneToThreeDays}, 3-7 days: ${data.agingBuckets.threeToSevenDays}, 7+ days: ${data.agingBuckets.sevenPlusDays}`}
            tableHeaders={['Aging Bucket', 'Active Cases']}
            tableRows={[
              ['0–1 Days (Fresh)', data.agingBuckets.zeroToOneDays],
              ['1–3 Days (In Progress)', data.agingBuckets.oneToThreeDays],
              ['3–7 Days (Lagging)', data.agingBuckets.threeToSevenDays],
              ['7+ Days (Critical)', data.agingBuckets.sevenPlusDays],
            ]}
          >
            <AgingReportChart buckets={data.agingBuckets} />
          </AccessibleChartCard>
        </div>
      </div>

      {/* Row 2: Wing Heatmap Grid (Privacy Protected with <5 Suppression) */}
      <AccessibleChartCard
        title={t('analytics.wingHeatmapTitle')}
        description={t('analytics.wingHeatmapDescription')}
        metricKey="small_cells"
        screenReaderSummary="Wing incident density matrix across all categories with small cells (<5) suppressed."
        tableHeaders={['Wing', 'Category', 'Incident Count']}
        tableRows={data.wingHeatmap.map((w) => [w.wingName, w.categoryName, w.displayValue])}
      >
        <WingHeatmapGrid data={data.wingHeatmap} />
      </AccessibleChartCard>

      {/* Row 3: 4-Level Governance Funnel & Category Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccessibleChartCard
          title={t('analytics.levelGovernanceChain')}
          description="Volume, turnaround time, and escalations per governance level"
          metricKey="resolution_time"
          screenReaderSummary={`Funnel metrics: ${data.levelFunnel.map((l) => `${l.levelName}: ${l.enteredCount} entered, ${l.resolvedCount} resolved`).join(', ')}`}
          tableHeaders={['Level', 'Entered', 'Resolved', 'Escalated Out', 'Avg Turnaround']}
          tableRows={data.levelFunnel.map((l) => [
            l.levelName,
            l.enteredCount,
            l.resolvedCount,
            l.escalatedOutCount,
            `${(l.avgMinutes / 60).toFixed(1)}h`,
          ])}
        >
          <GovernanceLevelFunnel levels={data.levelFunnel} />
        </AccessibleChartCard>

        <AccessibleChartCard
          title="Category Distribution Mix"
          description="Share of total complaint volume by problem domain"
          metricKey="resolution_time"
          screenReaderSummary={`Category mix: ${data.categoryMix.map((c) => `${c.categoryName}: ${c.count} (${c.percentage}%)`).join(', ')}`}
          tableHeaders={['Category', 'Count', 'Volume Share']}
          tableRows={data.categoryMix.map((c) => [c.categoryName, c.count, `${c.percentage}%`])}
        >
          <div className="space-y-3 py-2">
            {data.categoryMix.map((cat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-800 dark:text-slate-200">{cat.categoryName}</span>
                  <span className="font-mono text-slate-500">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500 transition-all duration-500"
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </AccessibleChartCard>
      </div>
    </div>
  );
}
