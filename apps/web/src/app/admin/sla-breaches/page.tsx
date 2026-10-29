'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Download,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { getSlaBreaches, getReportExportUrl } from '@/lib/api';
import { SlaBreachReportDto } from '@grievease/contracts';
import { useTranslation } from '@/i18n';

export default function SlaBreachesPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [report, setReport] = useState<SlaBreachReportDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getSlaBreaches(page, 20)
      .then((data) => {
        if (data) setReport(data);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = report ? Math.ceil(report.total / report.limit) : 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              {t('analytics.slaBreachesTitle')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('analytics.slaBreachesSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={getReportExportUrl('sla-breaches', 'xlsx')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Excel Export</span>
          </a>
          <a
            href={getReportExportUrl('sla-breaches', 'pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF Ledger</span>
          </a>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading breach ledger...</div>
        ) : !report || report.items.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No auto-escalation breaches recorded. Clean SLA record!
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th scope="col" className="px-4 py-3">Grievance ID</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Transfer Chain</th>
                    <th scope="col" className="px-4 py-3">Reason</th>
                    <th scope="col" className="px-4 py-3">Hours Overdue</th>
                    <th scope="col" className="px-4 py-3">Resolver At Time</th>
                    <th scope="col" className="px-4 py-3">Timestamp</th>
                    <th scope="col" className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.items.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">
                        {b.publicId}
                      </td>
                      <td className="px-4 py-3 font-medium">{b.categoryName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Level {b.levelFrom} → Level {b.levelTo}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                          {b.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        +{b.hoursOverdue}h
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {b.resolverAtTime || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(b.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/grievances/${b.id}`}
                          className="text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <div>
                Showing {report.items.length} of {report.total} breaches
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="p-1 rounded border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
