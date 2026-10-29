'use client';

import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface AgingBuckets {
  zeroToOneDays: number;
  oneToThreeDays: number;
  threeToSevenDays: number;
  sevenPlusDays: number;
}

interface AgingReportChartProps {
  buckets: AgingBuckets;
}

export function AgingReportChart({ buckets }: AgingReportChartProps) {
  const total =
    buckets.zeroToOneDays +
    buckets.oneToThreeDays +
    buckets.threeToSevenDays +
    buckets.sevenPlusDays;

  const items = [
    { label: '0–1 Days', count: buckets.zeroToOneDays, color: 'bg-teal-500', barColor: 'bg-teal-500' },
    { label: '1–3 Days', count: buckets.oneToThreeDays, color: 'bg-blue-500', barColor: 'bg-blue-500' },
    { label: '3–7 Days', count: buckets.threeToSevenDays, color: 'bg-amber-500', barColor: 'bg-amber-500' },
    { label: '7+ Days', count: buckets.sevenPlusDays, color: 'bg-rose-500', barColor: 'bg-rose-500' },
  ];

  return (
    <div className="w-full space-y-4 py-2">
      {/* Stacked Progress Bar */}
      <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
        {total > 0 &&
          items.map((item, idx) => {
            const pct = (item.count / total) * 100;
            if (pct === 0) return null;
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`${item.barColor} transition-all duration-300`}
                title={`${item.label}: ${item.count} (${Math.round(pct)}%)`}
              />
            );
          })}
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {items.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={idx}
              className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-auto">
                {item.count}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {pct}% of open load
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
