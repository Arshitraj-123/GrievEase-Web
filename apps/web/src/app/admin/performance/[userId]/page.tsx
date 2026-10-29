'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import { getResolverDetail } from '@/lib/api';
import { ResolverDetailDto } from '@grievease/contracts';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function ResolverDrillDownPage({ params }: PageProps) {
  const { userId } = use(params);
  const [detail, setDetail] = useState<ResolverDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getResolverDetail(userId)
      .then((data) => {
        if (!data) setError('Resolver performance history not found');
        else setDetail(data);
      })
      .catch(() => setError('Failed to load resolver history'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{error || 'Resolver not found'}</h2>
        <Link
          href="/admin/performance"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-teal-600 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Leaderboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
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
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
            {detail.levelName}
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {detail.fullName}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational activity and auto-escalation breach ledger.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Status</span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
            {detail.performanceLabel}
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Assigned</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {detail.assigned}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">SLA Hit Rate</span>
          <div className="text-xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">
            {detail.slaHitRate !== null ? `${detail.slaHitRate}%` : 'N/A'}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Breaches</span>
          <div className="text-xl font-extrabold text-rose-500 mt-1">
            {detail.breachesWhileAssigned}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Open Load</span>
          <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {detail.currentOpenLoad}
          </div>
        </div>
      </div>

      {/* Auto-Escalation Breach Ledger */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              SLA Auto-Escalation Breaches While Assigned
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tickets that expired past SLA due date while under this resolver&apos;s ownership.
            </p>
          </div>
        </div>

        {detail.recentBreaches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No SLA breaches recorded for this resolver. Pristine compliance!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3.5 py-2">ID</th>
                  <th className="px-3.5 py-2">Category</th>
                  <th className="px-3.5 py-2">Escalated To</th>
                  <th className="px-3.5 py-2">Hours Overdue</th>
                  <th className="px-3.5 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.recentBreaches.map((b) => (
                  <tr key={b.id}>
                    <td className="px-3.5 py-2 font-mono font-bold text-teal-600 dark:text-teal-400">
                      {b.publicId}
                    </td>
                    <td className="px-3.5 py-2">{b.categoryName}</td>
                    <td className="px-3.5 py-2 font-semibold">Level {b.levelTo}</td>
                    <td className="px-3.5 py-2 font-mono text-rose-500 font-bold">
                      +{b.hoursOverdue}h
                    </td>
                    <td className="px-3.5 py-2 text-slate-400">
                      {new Date(b.occurredAt).toLocaleString()}
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
