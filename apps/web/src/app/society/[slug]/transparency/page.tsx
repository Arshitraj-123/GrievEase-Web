'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  Building2,
  CheckCircle2,
  Clock,
  Shield,
  ArrowLeft,
  Printer,
  Radio,
  Star,
  Layers,
  HelpCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { getSocietyTransparencyDashboard } from '@/lib/api';
import { PublicDashboardStatsDto, AnalyticsRange } from '@grievease/contracts';
import { useTranslation } from '@/i18n';
import { AccessibleChartCard } from '@/components/analytics/AccessibleChartCard';
import { TrendLineChart } from '@/components/analytics/TrendLineChart';
import { StatusDonutChart } from '@/components/analytics/StatusDonutChart';
import { GovernanceLevelFunnel } from '@/components/analytics/GovernanceLevelFunnel';
import { SatisfactionBreakdown } from '@/components/analytics/SatisfactionBreakdown';
import { RecurringIssuesList } from '@/components/analytics/RecurringIssuesList';
import { io } from 'socket.io-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function SocietyTransparencyPage({ params }: PageProps) {
  const { slug } = use(params);
  const { t } = useTranslation();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<PublicDashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async (selectedRange: AnalyticsRange) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getSocietyTransparencyDashboard(slug, selectedRange);
      if (!res) {
        setError('Transparency dashboard is not accessible or has been restricted.');
      } else {
        setData(res);
      }
    } catch {
      setError('Failed to load telemetry data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(range);
  }, [slug, range]);

  // Real-time live update with Socket.io on society stats.tick
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socket = io(`${socketUrl}/notifications`, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_society', { societyId: slug });
    });

    socket.on('stats.tick', () => {
      // Refresh dashboard data when a tick is received
      fetchDashboard(range);
    });

    return () => {
      socket.disconnect();
    };
  }, [slug, range]);

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Loading Governance Telemetry...
        </h2>
        <p className="text-xs text-slate-400 mt-1">Reconciling against pre-aggregated ledger</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Transparency Dashboard Unavailable
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
          {error || 'This society dashboard is configured for resident-only access or is temporarily offline.'}
        </p>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors"
        >
          Sign in as Verified Resident
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4 sm:px-6 lg:px-12 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="max-w-[1280px] mx-auto space-y-8">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <Link
            href="/transparency"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Societies Index</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* Live Indicator Badge */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('analytics.liveTelemetry')}</span>
            </span>

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
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {r === '30d' ? t('analytics.range30d') : r === '90d' ? t('analytics.range90d') : t('analytics.range12m')}
                </button>
              ))}
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              aria-label={t('analytics.printDashboard')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-br from-teal-50/70 via-white to-slate-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/80 rounded-3xl p-6 sm:p-8 border border-teal-100/80 dark:border-slate-800 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                  Verified Society Telemetry
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {data.societyName}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                Public resolution telemetry, governance turnaround times, and satisfaction ratings reconciled strictly with the immutable audit chain.
              </p>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 self-start md:self-end">
              <div>{t('analytics.lastUpdated')}: {new Date(data.lastUpdated).toLocaleTimeString()}</div>
              <div className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                Single Source of Truth (docs/metrics.md)
              </div>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Open Inventory */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.openInventory')}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
              {data.summaryCards.openLoad}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active across levels</span>
          </div>

          {/* Card 2: Complaints Resolved */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.resolvedCount')}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
              {data.summaryCards.resolvedCount}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Confirmed solutions</span>
          </div>

          {/* Card 3: Avg Resolution Time */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.avgResolutionTime')}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              {data.summaryCards.avgResolutionHours}h
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Net working hours</span>
          </div>

          {/* Card 4: Resident Satisfaction */}
          <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t('analytics.residentSatisfaction')}
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 mt-2">
              {data.summaryCards.satisfactionScore !== null ? `${data.summaryCards.satisfactionScore} ★` : '—'}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
              {data.summaryCards.ratedCount} verified ratings
            </span>
          </div>
        </div>

        {/* Chart Row 1: Status Distribution & Resolution by Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Donut */}
          <AccessibleChartCard
            title={t('analytics.statusDistribution')}
            description="Overall proportion of complaints by active state"
            metricKey="sla_compliance"
            screenReaderSummary={`Status breakdown: ${data.statusSplit.map((s) => `${s.status}: ${s.count}`).join(', ')}`}
            tableHeaders={['Status', 'Complaint Count']}
            tableRows={data.statusSplit.map((s) => [s.status, s.count])}
          >
            <StatusDonutChart data={data.statusSplit} />
          </AccessibleChartCard>

          {/* 4-Level Governance Chain Funnel */}
          <AccessibleChartCard
            title={t('analytics.levelGovernanceChain')}
            description="Average turnaround time and volume per governance tier"
            metricKey="resolution_time"
            screenReaderSummary={`4-level chain turnaround: ${data.averageTimePerLevel.map((l) => `Level ${l.level}: ${l.avgHours} hours (${l.count} items)`).join(', ')}`}
            tableHeaders={['Governance Level', 'Average Turnaround (Hours)', 'Items Handled']}
            tableRows={data.averageTimePerLevel.map((l) => [`Level ${l.level}`, `${l.avgHours}h`, l.count])}
          >
            <GovernanceLevelFunnel levels={data.averageTimePerLevel} />
          </AccessibleChartCard>
        </div>

        {/* Chart Row 2: 12-Month Trend & Satisfaction Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <AccessibleChartCard
              title={t('analytics.twelveMonthTrend')}
              description="Monthly submitted vs resolved volume over the past year"
              metricKey="resolution_time"
              screenReaderSummary={`Monthly trend: ${data.twelveMonthTrend.map((m) => `${m.month}: ${m.submitted} submitted, ${m.resolved} resolved`).join(', ')}`}
              tableHeaders={['Month', 'Submitted', 'Resolved']}
              tableRows={data.twelveMonthTrend.map((m) => [m.month, m.submitted, m.resolved])}
            >
              <TrendLineChart data={data.twelveMonthTrend} />
            </AccessibleChartCard>
          </div>

          <div className="lg:col-span-5">
            <AccessibleChartCard
              title={t('analytics.satisfactionBreakdown')}
              description="Resident rating distribution upon case closure"
              metricKey="satisfaction"
              screenReaderSummary={`Satisfaction score: ${data.satisfaction.score || 'N/A'} based on ${data.satisfaction.count} reviews.`}
              tableHeaders={['Stars', 'Review Count']}
              tableRows={data.satisfaction.breakdown.map((b) => [`${b.stars} Stars`, b.count])}
            >
              <SatisfactionBreakdown
                score={data.satisfaction.score}
                count={data.satisfaction.count}
                breakdown={data.satisfaction.breakdown}
              />
            </AccessibleChartCard>
          </div>
        </div>

        {/* Bottom Row: Recurring Issues & Category Resolutions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AccessibleChartCard
            title={t('analytics.recurringIssuesTitle')}
            description={t('analytics.recurringIssuesDescription')}
            metricKey="recurring_issues"
            screenReaderSummary={`Top recurring issues: ${data.topRecurringIssues.map((i) => `${i.categoryName} at ${i.areaTagName}: ${i.count} times`).join(', ')}`}
            tableHeaders={['Category', 'Area Tag', 'Frequency']}
            tableRows={data.topRecurringIssues.map((i) => [i.categoryName, i.areaTagName, `${i.count} times`])}
          >
            <RecurringIssuesList issues={data.topRecurringIssues} />
          </AccessibleChartCard>

          <AccessibleChartCard
            title={t('analytics.categoryBreakdown')}
            description="Resolution velocity across functional categories"
            metricKey="resolution_time"
            screenReaderSummary={`Category resolutions: ${data.resolutionByCategory.map((c) => `${c.categoryName}: ${c.resolvedCount} resolved in ${c.avgHours} hours`).join(', ')}`}
            tableHeaders={['Category', 'Resolved Count', 'Avg Turnaround (Hours)']}
            tableRows={data.resolutionByCategory.map((c) => [c.categoryName, c.resolvedCount, `${c.avgHours}h`])}
          >
            <div className="space-y-3 py-2">
              {data.resolutionByCategory.map((cat, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{cat.categoryName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-500 dark:text-slate-400">
                      <strong>{cat.resolvedCount}</strong> resolved
                    </span>
                    <span className="font-mono text-teal-600 dark:text-teal-400 font-bold">
                      {cat.avgHours}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </AccessibleChartCard>
        </div>
      </div>
    </div>
  );
}
