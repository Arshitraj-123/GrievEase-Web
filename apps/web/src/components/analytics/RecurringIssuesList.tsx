'use client';

import React from 'react';
import { RefreshCw, MapPin, Tag } from 'lucide-react';

interface RecurringIssue {
  categoryName: string;
  areaTagName: string;
  count: number;
}

interface RecurringIssuesListProps {
  issues: RecurringIssue[];
}

export function RecurringIssuesList({ issues }: RecurringIssuesListProps) {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/20 rounded-xl">
        No recurring issue patterns detected in the last 30 days
      </div>
    );
  }

  return (
    <div className="space-y-2.5 py-1">
      {issues.map((issue, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 truncate">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
            <div className="truncate">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                <Tag className="w-3 h-3 text-slate-400" />
                <span>{issue.categoryName}</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400" />
                <span>{issue.areaTagName}</span>
              </div>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {issue.count} occurrences
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
