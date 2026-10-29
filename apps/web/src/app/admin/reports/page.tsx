'use client';

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Calendar,
  Layers,
  Users,
  AlertTriangle,
  Clock,
  Printer,
} from 'lucide-react';
import { getReportExportUrl } from '@/lib/api';
import { ReportType } from '@grievease/contracts';
import { useTranslation } from '@/i18n';

interface ReportCardMeta {
  type: ReportType;
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
}

export default function AdminReportsPage() {
  const { t } = useTranslation();

  const reportCards: ReportCardMeta[] = [
    {
      type: 'monthly-summary',
      title: 'Monthly Governance Executive Summary',
      description: 'Comprehensive high-level metrics including resolution velocity, open inventory, and resident satisfaction score.',
      icon: <Calendar className="w-5 h-5 text-teal-600" />,
      tags: ['Executive', 'Monthly Review', 'Board Presentation'],
    },
    {
      type: 'category-trends',
      title: 'Category Trends & Turnaround Ledger',
      description: 'Volume breakdown, average net resolution hours, and closure rates partitioned by problem category.',
      icon: <Layers className="w-5 h-5 text-blue-600" />,
      tags: ['Operations', 'Maintenance', 'Category Velocity'],
    },
    {
      type: 'resolver-performance',
      title: 'Resolver Performance & Accountability',
      description: 'Volume-normalized performance indicators, SLA hit rates, sample size safeguards, and breach counts.',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      tags: ['HR & Committee', 'Fair Evaluation', 'Accountability'],
    },
    {
      type: 'sla-breaches',
      title: 'Auto-Escalation & SLA Breach Ledger',
      description: 'Complete immutable log of all autonomous level transfers with overdue hours and assigned owners.',
      icon: <AlertTriangle className="w-5 h-5 text-rose-600" />,
      tags: ['Compliance', 'Audit Trail', 'SLA Breaches'],
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title & Audit Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Compliance & Telemetry
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('analytics.reportsTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.reportsSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start md:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Monthly Summary</span>
        </button>
      </div>

      {/* Security & Audit Notice */}
      <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div>
          <strong>Export Security & Audit Compliance:</strong> Every export is stamped with the latest SHA-256 hash from the immutable <code className="bg-teal-100/80 dark:bg-teal-900/80 px-1 py-0.5 rounded font-mono">audit_log</code> chain. Excel spreadsheets automatically escape formula injection characters (=, +, -, @). Every generation event is permanently logged in the audit ledger.
        </div>
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => (
          <div
            key={card.type}
            className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    {card.icon}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {card.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{card.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {card.description}
              </p>
            </div>

            {/* Export Format Action Buttons */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <a
                href={getReportExportUrl(card.type, 'pdf')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF (Stamped)</span>
              </a>

              <a
                href={getReportExportUrl(card.type, 'xlsx')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Excel (Safe)</span>
              </a>

              <a
                href={getReportExportUrl(card.type, 'json')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
