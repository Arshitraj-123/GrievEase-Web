'use client';

import React from 'react';

interface StatusItem {
  status: string;
  count: number;
}

interface StatusDonutChartProps {
  data: StatusItem[];
}

const STATUS_COLORS: Record<string, { bg: string; fill: string; label: string }> = {
  SUBMITTED: { bg: 'bg-amber-500', fill: '#F59E0B', label: 'Submitted' },
  ACKNOWLEDGED: { bg: 'bg-blue-500', fill: '#3B82F6', label: 'Acknowledged' },
  IN_PROGRESS: { bg: 'bg-indigo-500', fill: '#6366F1', label: 'In Progress' },
  PENDING_INFO: { bg: 'bg-orange-500', fill: '#F97316', label: 'Pending Info' },
  ESCALATED: { bg: 'bg-rose-500', fill: '#F43F5E', label: 'Escalated' },
  RESOLVED: { bg: 'bg-teal-500', fill: '#14B8A6', label: 'Resolved' },
  CLOSED: { bg: 'bg-emerald-600', fill: '#059669', label: 'Closed' },
  REOPENED: { bg: 'bg-purple-500', fill: '#A855F7', label: 'Reopened' },
};

export function StatusDonutChart({ data }: StatusDonutChartProps) {
  const total = data.reduce((sum, d) => sum + Number(d.count || 0), 0);

  if (total === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
        No active complaints in this dataset
      </div>
    );
  }

  // Calculate segment arcs
  let accumulatedAngle = 0;
  const radius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  const segments = data
    .filter((d) => d.count > 0)
    .map((d) => {
      const percentage = (d.count / total) * 100;
      const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedAngle;
      accumulatedAngle += (percentage / 100) * circumference;

      const meta = STATUS_COLORS[d.status] || {
        bg: 'bg-slate-500',
        fill: '#64748B',
        label: d.status,
      };

      return {
        ...d,
        percentage: Math.round(percentage),
        strokeDasharray,
        strokeDashoffset,
        color: meta.fill,
        bg: meta.bg,
        label: meta.label,
      };
    });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          {/* Base background ring */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-100 dark:text-slate-800"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg, idx) => (
            <circle
              key={idx}
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          ))}
        </svg>

        {/* Center Total Count */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{total}</span>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-xs text-xs">
        {segments.map((seg, idx) => (
          <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2 truncate">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${seg.bg}`} />
              <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{seg.label}</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-slate-100 ml-2">
              {seg.count} <span className="text-[10px] text-slate-400 font-normal">({seg.percentage}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
