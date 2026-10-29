'use client';

import React, { useState } from 'react';

interface TrendDataPoint {
  date?: string;
  month?: string;
  submitted: number;
  resolved: number;
  escalated?: number;
}

interface TrendLineChartProps {
  data: TrendDataPoint[];
  height?: number;
}

export function TrendLineChart({ data, height = 240 }: TrendLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No trend data available for this range
      </div>
    );
  }

  const padding = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = 600;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => Math.max(d.submitted, d.resolved, d.escalated || 0)), 10);

  const getX = (index: number) => {
    if (data.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  // Generate SVG path strings
  const submittedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.submitted)}`).join(' ');
  const resolvedPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.resolved)}`).join(' ');

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-end gap-4 mb-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="text-slate-600 dark:text-slate-300">Submitted</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-600 dark:bg-teal-400" />
          <span className="text-teal-700 dark:text-teal-300">Resolved</span>
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          role="img"
          aria-label="Resolution volume trend graph over time"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding.top + chartHeight * (1 - pct);
            const val = Math.round(maxVal * pct);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + chartWidth}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Lines */}
          <path
            d={submittedPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={resolvedPath}
            fill="none"
            stroke="#0D9488"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {data.map((d, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i}>
                {/* Invisible hover target bar */}
                <rect
                  x={getX(i) - 15}
                  y={padding.top}
                  width="30"
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* Submitted point */}
                <circle
                  cx={getX(i)}
                  cy={getY(d.submitted)}
                  r={isHovered ? 5 : 3}
                  fill="#94A3B8"
                  className="transition-all"
                />

                {/* Resolved point */}
                <circle
                  cx={getX(i)}
                  cy={getY(d.resolved)}
                  r={isHovered ? 6 : 4}
                  fill="#0D9488"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  className="transition-all"
                />

                {/* X-axis label (sampled to avoid overlap) */}
                {(i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1) && (
                  <text
                    x={getX(i)}
                    y={height - 8}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-medium"
                  >
                    {d.month || d.date?.slice(5) || ''}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg pointer-events-none flex items-center gap-3 backdrop-blur-sm"
          >
            <span className="font-semibold text-slate-300">
              {data[hoveredIdx].month || data[hoveredIdx].date}
            </span>
            <span className="text-slate-400">
              Submitted: <strong className="text-white">{data[hoveredIdx].submitted}</strong>
            </span>
            <span className="text-teal-400">
              Resolved: <strong className="text-white">{data[hoveredIdx].resolved}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
