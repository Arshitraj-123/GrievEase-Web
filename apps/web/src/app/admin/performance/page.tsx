'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Award,
  AlertCircle,
  HelpCircle,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getResolverPerformance } from '@/lib/api';
import { ResolverSummaryDto, ResolverPerformanceLabel } from '@grievease/contracts';
import { useTranslation } from '@/i18n';
import { MetricsCalculationPopover } from '@/components/analytics/MetricsCalculationPopover';

export default function ResolverPerformancePage() {
  const { t } = useTranslation();
  const [levelFilter, setLevelFilter] = useState<number>(1);
  const [resolvers, setResolvers] = useState<ResolverSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'slaHitRate' | 'resolved' | 'assigned'>('slaHitRate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    setLoading(true);
    getResolverPerformance(levelFilter)
      .then((data) => setResolvers(data))
      .finally(() => setLoading(false));
  }, [levelFilter]);

  const handleSort = (field: 'slaHitRate' | 'resolved' | 'assigned') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedResolvers = [...resolvers].sort((a, b) => {
    const mult = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'slaHitRate') {
      const aVal = a.slaHitRate ?? -1;
      const bVal = b.slaHitRate ?? -1;
      return (aVal - bVal) * mult;
    }
    return ((a[sortField] || 0) - (b[sortField] || 0)) * mult;
  });

  const getLabelBadge = (label: ResolverPerformanceLabel) => {
    switch (label) {
      case 'Excellent':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Excellent
          </span>
        );
      case 'On track':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            On track
          </span>
        );
      case 'Needs support':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Needs support
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            Not enough data (&lt;5)
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Level Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('analytics.resolverPerformanceTitle')}
            </h1>
            <MetricsCalculationPopover metricKey="resolver_performance" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.resolverPerformanceSubtitle')}
          </p>
        </div>

        <Link
          href="/admin/performance/me"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 text-xs font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-100 transition-colors self-start md:self-auto"
        >
          <Award className="w-3.5 h-3.5" />
          <span>My Performance Card</span>
        </Link>
      </div>

      {/* Governance Level Filter Tabs (Isolates ranking by level) */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 w-fit text-xs font-bold">
        {[
          { level: 1, label: 'Level 1: Secretary' },
          { level: 2, label: 'Level 2: Committee' },
          { level: 3, label: 'Level 3: Chairman' },
          { level: 4, label: 'Level 4: Governing Body' },
        ].map((tier) => (
          <button
            key={tier.level}
            type="button"
            onClick={() => setLevelFilter(tier.level)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              levelFilter === tier.level
                ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* Fair Governance Rules Banner */}
      <div className="p-3.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
        <div>
          <strong>Fairness Policy Active:</strong> Resolvers are evaluated on rates and averages, not raw volume. If a resolver has closed fewer than 5 grievances, &quot;Not enough data (&lt;5)&quot; is shown instead of a rank. Breaches during approved leave are excluded. Resolvers from different governance tiers are never ranked together.
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading leaderboard data...</div>
        ) : sortedResolvers.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No active resolvers recorded for Level {levelFilter}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold sticky top-0 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-4 py-3">Resolver</th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('assigned')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <span>Assigned</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('resolved')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <span>Resolved</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSort('slaHitRate')}
                      className="inline-flex items-center gap-1 font-semibold text-slate-900 dark:text-slate-100"
                    >
                      <span>SLA Hit Rate</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3">Avg Ack</th>
                  <th scope="col" className="px-4 py-3">Avg Turnaround</th>
                  <th scope="col" className="px-4 py-3">Breaches</th>
                  <th scope="col" className="px-4 py-3">Rating</th>
                  <th scope="col" className="px-4 py-3">Open Load</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3 text-right">Drill-Down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sortedResolvers.map((r, idx) => (
                  <tr
                    key={r.userId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {r.fullName}
                    </td>
                    <td className="px-4 py-3 font-mono">{r.assigned}</td>
                    <td className="px-4 py-3 font-mono text-teal-600 dark:text-teal-400 font-bold">
                      {r.resolved}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {r.slaHitRate !== null ? (
                        <span
                          className={
                            r.slaHitRate >= 90
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : r.slaHitRate >= 75
                              ? 'text-teal-600 dark:text-teal-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {r.slaHitRate}%
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">N/A (&lt;5)</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono">{r.avgAckMinutes}m</td>
                    <td className="px-4 py-3 font-mono">{(r.avgResolutionMinutes / 60).toFixed(1)}h</td>
                    <td className="px-4 py-3 font-mono text-rose-500 font-bold">
                      {r.breachesWhileAssigned}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {r.avgRating !== null ? `${r.avgRating} ★` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {r.currentOpenLoad}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getLabelBadge(r.performanceLabel)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/performance/${r.userId}`}
                        className="p-1.5 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-800 inline-flex items-center"
                        title="View detailed breach history & trend"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
