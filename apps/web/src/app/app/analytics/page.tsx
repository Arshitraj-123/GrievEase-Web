'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { getResidentAnalytics } from '@/lib/api';
import { ResidentAnalyticsDto, AnalyticsRange } from '@grievease/contracts';
import { useTranslation } from '@/i18n';
import { AccessibleChartCard } from '@/components/analytics/AccessibleChartCard';
import { TrendLineChart } from '@/components/analytics/TrendLineChart';
import { GovernanceLevelFunnel } from '@/components/analytics/GovernanceLevelFunnel';
import { SatisfactionBreakdown } from '@/components/analytics/SatisfactionBreakdown';
import { StatusDonutChart } from '@/components/analytics/StatusDonutChart';

export default function ResidentAnalyticsPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const [data, setData] = useState<ResidentAnalyticsDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getResidentAnalytics(range)
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
      <div className="p-6 text-center text-xs text-slate-500">
        Analytics are currently unavailable. Please check back later.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Resident Transparency
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('analytics.residentAnalyticsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.residentAnalyticsSubtitle')}
          </p>
        </div>

        {/* Range Selector */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold self-start sm:self-auto">
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
              {r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stack for Phones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Resolved</span>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {data.summaryCards.resolvedCount}
          </div>
          <span className="text-[10px] text-slate-400">Closed cases</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Avg Time</span>
          <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {data.summaryCards.avgResolutionHours}h
          </div>
          <span className="text-[10px] text-slate-400">Net turnaround</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Satisfaction</span>
          <div className="text-xl font-extrabold text-amber-500 mt-1">
            {data.summaryCards.satisfactionScore !== null ? `${data.summaryCards.satisfactionScore} ★` : '—'}
          </div>
          <span className="text-[10px] text-slate-400">{data.summaryCards.ratedCount} ratings</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Open Load</span>
          <div className="text-xl font-extrabold text-slate-800 dark:text-slate-200 mt-1">
            {data.summaryCards.openLoad}
          </div>
          <span className="text-[10px] text-slate-400">Active tickets</span>
        </div>
      </div>

      {/* Resident SLA Compliance by Governance Level Card */}
      <AccessibleChartCard
        title="SLA Compliance by Governance Tier"
        description="Percentage of issues resolved or transferred before the level deadline"
        metricKey="sla_compliance"
        screenReaderSummary={`SLA compliance by level: ${data.slaComplianceByLevel.map((s) => `Level ${s.level}: ${s.complianceRate}% (${s.totalHandled} handled)`).join(', ')}`}
        tableHeaders={['Governance Level', 'Compliance Rate', 'Cases Handled']}
        tableRows={data.slaComplianceByLevel.map((s) => [`Level ${s.level}`, `${s.complianceRate}%`, s.totalHandled])}
      >
        <div className="space-y-3 py-2">
          {data.slaComplianceByLevel.map((tier) => (
            <div key={tier.level} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-800 dark:text-slate-200">
                  Level {tier.level}: {tier.level === 1 ? 'Secretary' : tier.level === 2 ? 'Committee' : tier.level === 3 ? 'Chairman' : 'Governing Body'}
                </span>
                <span className="font-mono text-teal-700 dark:text-teal-400">
                  {tier.complianceRate}% ({tier.totalHandled} handled)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    tier.complianceRate >= 80 ? 'bg-teal-500' : tier.complianceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${tier.complianceRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </AccessibleChartCard>

      {/* 4-Level Chain Visualization */}
      <AccessibleChartCard
        title={t('analytics.levelGovernanceChain')}
        description="Average turnaround time per governance stage"
        metricKey="resolution_time"
        screenReaderSummary={`Turnaround: ${data.averageTimePerLevel.map((l) => `Level ${l.level}: ${l.avgHours}h`).join(', ')}`}
        tableHeaders={['Level', 'Turnaround Hours', 'Cases Handled']}
        tableRows={data.averageTimePerLevel.map((l) => [`Level ${l.level}`, `${l.avgHours}h`, l.count])}
      >
        <GovernanceLevelFunnel levels={data.averageTimePerLevel} />
      </AccessibleChartCard>

      {/* Satisfaction Breakdown */}
      <AccessibleChartCard
        title={t('analytics.satisfactionBreakdown')}
        description="Feedback from verified residents on closed complaints"
        metricKey="satisfaction"
        screenReaderSummary={`Satisfaction: ${data.satisfaction.score || 'N/A'}`}
        tableHeaders={['Stars', 'Reviews']}
        tableRows={data.satisfaction.breakdown.map((b) => [`${b.stars} Stars`, b.count])}
      >
        <SatisfactionBreakdown
          score={data.satisfaction.score}
          count={data.satisfaction.count}
          breakdown={data.satisfaction.breakdown}
        />
      </AccessibleChartCard>
    </div>
  );
}
