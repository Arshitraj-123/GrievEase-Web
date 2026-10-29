'use client';

import React, { useState } from 'react';
import { cn } from './utils';
import { Copy, Check } from 'lucide-react';

export interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  textToCopy: string;
  label?: string;
  copiedLabel?: string;
  iconOnly?: boolean;
}

export function CopyButton({
  textToCopy,
  label = 'Copy',
  copiedLabel = 'Copied!',
  iconOnly = false,
  className,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? copiedLabel : label}
      aria-live="polite"
      className={cn(
        'min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all select-none',
        'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200',
        'hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500',
        copied && 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30',
        className
      )}
      {...props}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-500 shrink-0" />
          {!iconOnly && <span>{copiedLabel}</span>}
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 text-slate-400 shrink-0" />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
