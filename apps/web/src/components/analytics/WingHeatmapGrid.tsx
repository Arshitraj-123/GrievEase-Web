'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from '@/i18n';

interface WingHeatmapCell {
  wingId: string;
  wingName: string;
  categoryId: string;
  categoryName: string;
  count: number;
  isSuppressed: boolean;
  displayValue: string;
}

interface WingHeatmapGridProps {
  data: WingHeatmapCell[];
}

export function WingHeatmapGrid({ data }: WingHeatmapGridProps) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-slate-400 text-xs">
        No named complaints recorded for wing density
      </div>
    );
  }

  // Extract distinct wings and categories
  const wings = Array.from(new Set(data.map((d) => d.wingName))).sort();
  const categories = Array.from(new Set(data.map((d) => d.categoryName))).sort();

  // Create lookup map: `${wingName}:${categoryName}` -> cell
  const cellMap = new Map<string, WingHeatmapCell>();
  for (const item of data) {
    cellMap.set(`${item.wingName}:${item.categoryName}`, item);
  }

  // Determine maximum count for color shading
  const maxVal = Math.max(...data.map((d) => (d.isSuppressed ? 3 : d.count)), 1);

  const getCellColor = (count: number, isSuppressed: boolean) => {
    if (isSuppressed) {
      return 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-bold';
    }
    if (count === 0) {
      return 'bg-slate-50 dark:bg-slate-800/20 text-slate-400';
    }
    const ratio = count / maxVal;
    if (ratio > 0.6) return 'bg-teal-700 text-white font-bold';
    if (ratio > 0.3) return 'bg-teal-500/80 text-white font-semibold';
    return 'bg-teal-100 dark:bg-teal-900/40 text-teal-900 dark:text-teal-200';
  };

  return (
    <div className="w-full space-y-3">
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-center text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 uppercase font-semibold text-[11px]">
            <tr>
              <th scope="col" className="px-3 py-2.5 text-left font-bold border-b border-slate-200 dark:border-slate-700">
                Wing
              </th>
              {categories.map((cat, idx) => (
                <th
                  key={idx}
                  scope="col"
                  className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap"
                >
                  {cat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {wings.map((wing, wIdx) => (
              <tr key={wIdx}>
                <th
                  scope="row"
                  className="px-3 py-2 text-left font-bold text-slate-900 dark:text-slate-100 bg-slate-50/50 dark:bg-slate-800/30 whitespace-nowrap"
                >
                  {wing}
                </th>
                {categories.map((cat, cIdx) => {
                  const cell = cellMap.get(`${wing}:${cat}`);
                  const isSuppressed = cell?.isSuppressed ?? false;
                  const count = cell?.count ?? 0;
                  const display = cell?.displayValue ?? '0';

                  return (
                    <td
                      key={cIdx}
                      className={`px-3 py-2 transition-colors ${getCellColor(count, isSuppressed)}`}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50/70 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900/60 text-[11px] text-teal-900 dark:text-teal-200">
        <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
        <div>
          <strong>Privacy Guard Active:</strong> Any bucket with fewer than 5 grievances is shown as &quot;&lt;5&quot; with complementary suppression. Anonymous complaints have no wing affiliation and are strictly excluded from wing density matrices.
        </div>
      </div>
    </div>
  );
}
