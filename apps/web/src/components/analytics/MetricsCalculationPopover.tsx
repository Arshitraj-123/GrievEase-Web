'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, Calculator, Clock, ShieldCheck, UserCheck } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface MetricsCalculationPopoverProps {
  metricKey:
    | 'resolution_time'
    | 'sla_compliance'
    | 'satisfaction'
    | 'aging_buckets'
    | 'recurring_issues'
    | 'small_cells'
    | 'resolver_performance';
}

const METRIC_DETAILS: Record<
  string,
  { title: string; formula: string; rules: string[]; source: string }
> = {
  resolution_time: {
    title: 'Net Resolution Time (Hours)',
    formula: 'Net Minutes = (resolved_at - created_at) - Σ(Intervals in PENDING_INFO)',
    rules: [
      'Strictly pauses and deducts time when complainant input is pending.',
      'Business-hours aware only if society working hours are enabled; continuous 24x7 otherwise.',
      'Anchored to society canonical timezone (Asia/Kolkata).',
    ],
    source: 'docs/metrics.md § 3.1',
  },
  sla_compliance: {
    title: 'SLA Compliance Per Level',
    formula: 'Compliance % = (Items resolved or transferred within sla_due_at / Total items handled) × 100',
    rules: [
      'Evaluated per governance level (Level 1 Secretary to Level 4 Governing Body).',
      'Breach triggers automatic autonomous escalation.',
      'Halts at Level 4 (flagged as FINAL_LEVEL_OVERDUE if exceeded).',
    ],
    source: 'docs/metrics.md § 3.4',
  },
  satisfaction: {
    title: 'Resident Satisfaction Rating',
    formula: 'Average Score = (Σ Star Ratings 1–5) / N  (where N = count of ratings)',
    rules: [
      'Minimum sample size N ≥ 5 required to display average score.',
      'If fewer than 5 ratings exist, score is suppressed as "Insufficient Data".',
      'Total review count is always displayed alongside the score.',
    ],
    source: 'docs/metrics.md § 4.3',
  },
  aging_buckets: {
    title: 'Open Inventory Aging Buckets',
    formula: 'Age = CURRENT_TIMESTAMP - created_at for all open cases',
    rules: [
      '0–1 Days: Age ≤ 24 hours',
      '1–3 Days: 24h < Age ≤ 72h',
      '3–7 Days: 72h < Age ≤ 168h',
      '7+ Days: Age > 168 hours',
    ],
    source: 'docs/metrics.md § 4.4',
  },
  recurring_issues: {
    title: 'Recurring Issue Detection',
    formula: 'Category + Area Tag combination with ≥ 3 complaints in 30 days',
    rules: [
      'Strict zero-PII privacy rule: Displays Category and Area Tag name only.',
      'Complaint titles, free text, and complainant identities are never exposed.',
      'Ranked in descending order of frequency.',
    ],
    source: 'docs/metrics.md § 4.5',
  },
  small_cells: {
    title: 'Small-Number Suppression & Privacy',
    formula: 'Cell count 1 ≤ V < MIN_CELL_SIZE (5) → Display as "<5"',
    rules: [
      'Protects against re-identification in low-density flats or wings.',
      'Complementary suppression applied to second lowest cell to prevent algebraic recovery.',
      'Anonymous complaints are 100% excluded from wing/flat breakdowns.',
    ],
    source: 'docs/metrics.md § 6',
  },
  resolver_performance: {
    title: 'Fair Resolver Evaluation Rules',
    formula: 'SLA Hit Rate = ((Closed - Breaches While Assigned) / Closed) × 100',
    rules: [
      'Minimum sample size N ≥ 5 closed cases required to calculate SLA hit rate or rank.',
      'Breaches during active approved resolver leave are strictly excluded.',
      'Resolvers are never ranked across different governance levels together.',
    ],
    source: 'docs/metrics.md § 5',
  },
};

export function MetricsCalculationPopover({ metricKey }: MetricsCalculationPopoverProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const detail = METRIC_DETAILS[metricKey] || METRIC_DETAILS.resolution_time;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${t('analytics.howCalculated')} - ${detail.title}`}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 p-1 rounded hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">{t('analytics.howCalculated')}</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 p-4 rounded-xl shadow-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                {detail.title}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 font-mono text-[11px] text-teal-900 dark:text-teal-200 break-words">
              {detail.formula}
            </div>

            <div>
              <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Calculation Rules:</div>
              <ul className="space-y-1 list-disc list-inside text-[11px] text-slate-600 dark:text-slate-400">
                {detail.rules.map((rule, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {rule}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span>Source: {detail.source}</span>
              <span className="text-teal-600 dark:text-teal-400 font-semibold">Single Source of Truth</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
