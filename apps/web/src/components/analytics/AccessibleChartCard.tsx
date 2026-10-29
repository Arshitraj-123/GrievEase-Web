'use client';

import React, { useState } from 'react';
import { Table, BarChart2 } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { MetricsCalculationPopover } from './MetricsCalculationPopover';

interface AccessibleChartCardProps {
  title: string;
  description?: string;
  metricKey?:
    | 'resolution_time'
    | 'sla_compliance'
    | 'satisfaction'
    | 'aging_buckets'
    | 'recurring_issues'
    | 'small_cells'
    | 'resolver_performance';
  screenReaderSummary: string;
  children: React.ReactNode;
  tableHeaders: string[];
  tableRows: (string | number)[][];
  headerAction?: React.ReactNode;
}

export function AccessibleChartCard({
  title,
  description,
  metricKey,
  screenReaderSummary,
  children,
  tableHeaders,
  tableRows,
  headerAction,
}: AccessibleChartCardProps) {
  const { t } = useTranslation();
  const [viewAsTable, setViewAsTable] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            {metricKey && <MetricsCalculationPopover metricKey={metricKey} />}
          </div>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {headerAction}

          <button
            type="button"
            onClick={() => setViewAsTable(!viewAsTable)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-pressed={viewAsTable}
          >
            {viewAsTable ? (
              <>
                <BarChart2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('analytics.viewAsChart')}</span>
              </>
            ) : (
              <>
                <Table className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('analytics.viewAsTable')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen Reader Detailed Telemetry */}
      <div className="sr-only" aria-live="polite">
        {screenReaderSummary}
      </div>

      {/* Content Rendering: Visual Chart vs Accessible Table */}
      <div className="mt-4">
        {viewAsTable ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 uppercase tracking-wider font-semibold">
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} scope="col" className="px-3.5 py-2.5">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={tableHeaders.length} className="px-3.5 py-4 text-center text-slate-400">
                      No data available
                    </td>
                  </tr>
                ) : (
                  tableRows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className={rowIdx % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-3.5 py-2 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div>{children}</div>
        )}
      </div>
    </div>
  );
}
