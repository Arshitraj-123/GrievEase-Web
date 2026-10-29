'use client';

import { useState } from 'react';
import { cn } from './utils';
import { CopyButton } from './CopyButton';
import { Download, Printer } from 'lucide-react';

export interface RecoveryCodesGridProps {
  codes: string[];
  isConfirmed?: boolean;
  onConfirmChange?: (confirmed: boolean) => void;
  className?: string;
  societyName?: string;
}

export function RecoveryCodesGrid({
  codes,
  isConfirmed = false,
  onConfirmChange,
  className,
  societyName = 'GrievEase Society',
}: RecoveryCodesGridProps) {
  const [internalConfirmed, setInternalConfirmed] = useState(isConfirmed);

  const confirmedState = onConfirmChange !== undefined ? isConfirmed : internalConfirmed;

  const handleCheckboxToggle = (checked: boolean) => {
    setInternalConfirmed(checked);
    onConfirmChange?.(checked);
  };

  const handleDownloadTxt = () => {
    const content = [
      `=========================================================`,
      `GRIEVEASE EMERGENCY RECOVERY CODES`,
      `Society: ${societyName}`,
      `Generated on: ${new Date().toLocaleString()}`,
      `=========================================================`,
      ``,
      `IMPORTANT SECURITY WARNING:`,
      `Each recovery code can be used EXACTLY ONCE to reset your`,
      `password if you lose access. Store this document in a safe`,
      `physical location or secure offline password vault.`,
      ``,
      `---------------------------------------------------------`,
      ...codes.map((c, i) => `Code #${String(i + 1).padStart(2, '0')}:   ${c}`),
      `---------------------------------------------------------`,
      ``,
      `Never share these recovery codes with anyone, including`,
      `society committee members or maintenance staff.`,
      `=========================================================`,
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grievease-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* 10 Codes Grid */}
      <div className="p-4 bg-slate-100 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Single-Use Recovery Codes (10)
          </span>
          <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            One-time display
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-sm font-bold tracking-wider select-all">
          {codes.map((code, idx) => (
            <div
              key={idx}
              className="p-2 sm:p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between shadow-2xs"
            >
              <span className="text-[10px] font-mono text-slate-400 select-none">
                #{String(idx + 1).padStart(2, '0')}
              </span>
              <span className="text-slate-900 dark:text-slate-100">{code}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons: Copy, Download, Print */}
      <div className="grid grid-cols-3 gap-2">
        <CopyButton
          textToCopy={codes.join('\n')}
          label="Copy All"
          copiedLabel="Copied!"
          className="w-full text-xs"
        />
        <button
          type="button"
          onClick={handleDownloadTxt}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <Download className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Download .txt</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <Printer className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Print</span>
        </button>
      </div>

      {/* Required Confirmation Checkbox */}
      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={confirmedState}
          onChange={(e) => handleCheckboxToggle(e.target.checked)}
          className="w-5 h-5 mt-0.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 shrink-0 cursor-pointer"
        />
        <div className="text-xs text-teal-950 dark:text-teal-200 leading-relaxed">
          <strong className="block font-bold">I saved these recovery codes in a secure place.</strong>
          I understand that these codes will never be displayed again and are required if I lose access.
        </div>
      </label>
    </div>
  );
}
