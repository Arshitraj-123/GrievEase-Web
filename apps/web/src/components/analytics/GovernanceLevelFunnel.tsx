'use client';

import React from 'react';
import { ArrowDown, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

interface LevelFunnelItem {
  level: number;
  levelName?: string;
  avgMinutes?: number;
  avgHours?: number;
  enteredCount?: number;
  resolvedCount?: number;
  escalatedOutCount?: number;
  count?: number;
}

interface GovernanceLevelFunnelProps {
  levels: LevelFunnelItem[];
}

const DEFAULT_LEVEL_NAMES: Record<number, { name: string; targetHours: number }> = {
  1: { name: 'Level 1: Secretary', targetHours: 48 },
  2: { name: 'Level 2: Committee', targetHours: 72 },
  3: { name: 'Level 3: Chairman', targetHours: 96 },
  4: { name: 'Level 4: Governing Body', targetHours: 120 },
};

export function GovernanceLevelFunnel({ levels }: GovernanceLevelFunnelProps) {
  const normalizedLevels = [1, 2, 3, 4].map((lvl) => {
    const found = levels.find((l) => l.level === lvl) || { level: lvl };
    const defaultMeta = DEFAULT_LEVEL_NAMES[lvl] || { name: `Level ${lvl}`, targetHours: 48 };
    const avgH = found.avgHours ?? (found.avgMinutes ? parseFloat((found.avgMinutes / 60).toFixed(1)) : 0);
    const count = found.count ?? found.resolvedCount ?? 0;

    return {
      level: lvl,
      name: found.levelName || defaultMeta.name,
      targetHours: defaultMeta.targetHours,
      avgHours: avgH,
      count,
      entered: found.enteredCount,
      resolved: found.resolvedCount,
      escalatedOut: found.escalatedOutCount,
    };
  });

  return (
    <div className="w-full space-y-3 py-2">
      {normalizedLevels.map((lvl, idx) => {
        const isLast = idx === normalizedLevels.length - 1;
        const isUnderTarget = lvl.avgHours <= lvl.targetHours;

        return (
          <React.Fragment key={lvl.level}>
            <div className="relative p-3.5 sm:p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Level indicator & Title */}
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 font-bold text-xs shrink-0">
                  L{lvl.level}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{lvl.name}</h4>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    SLA Standard: {lvl.targetHours}h benchmark
                  </span>
                </div>
              </div>

              {/* Real Performance Metrics */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs">
                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Avg Turnaround</span>
                  <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lvl.avgHours > 0 ? `${lvl.avgHours} hrs` : '—'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Cases Handled</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{lvl.count}</span>
                </div>

                <div className="shrink-0">
                  {lvl.count === 0 ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                      No Activity
                    </span>
                  ) : isUnderTarget ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Within SLA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300">
                      <ShieldAlert className="w-3 h-3" />
                      Overdue
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Downward transition arrow */}
            {!isLast && (
              <div className="flex justify-center -my-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
