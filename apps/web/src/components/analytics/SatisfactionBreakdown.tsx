'use client';

import React from 'react';
import { Star, AlertCircle } from 'lucide-react';

interface StarBreakdownItem {
  stars: number;
  count: number;
}

interface SatisfactionBreakdownProps {
  score: number | null;
  count: number;
  breakdown: StarBreakdownItem[];
  minCellSize?: number;
}

export function SatisfactionBreakdown({
  score,
  count,
  breakdown,
  minCellSize = 5,
}: SatisfactionBreakdownProps) {
  const isInsufficient = count < minCellSize || score === null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      {/* Overall Score Badge / Gauge */}
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/50 w-full sm:w-48 text-center shrink-0">
        {isInsufficient ? (
          <>
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Insufficient Data</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Fewer than {minCellSize} reviews ({count} recorded)
            </span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-3xl font-extrabold text-teal-800 dark:text-teal-200">
              <span>{score}</span>
              <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            </div>
            <div className="flex items-center gap-1 mt-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Based on</span>
              <strong className="text-slate-900 dark:text-slate-100">{count} reviews</strong>
            </div>
            <span className="text-[10px] text-teal-700 dark:text-teal-400 uppercase tracking-wider font-bold mt-2">
              Verified Residents
            </span>
          </>
        )}
      </div>

      {/* 5-Star Distribution Bars */}
      <div className="w-full space-y-2">
        {[5, 4, 3, 2, 1].map((starVal) => {
          const item = breakdown.find((b) => b.stars === starVal) || { stars: starVal, count: 0 };
          const percentage = count > 0 ? Math.round((item.count / count) * 100) : 0;

          return (
            <div key={starVal} className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 w-10 shrink-0 font-medium text-slate-600 dark:text-slate-400">
                <span>{starVal}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>

              {/* Progress bar */}
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="w-14 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                {item.count} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
