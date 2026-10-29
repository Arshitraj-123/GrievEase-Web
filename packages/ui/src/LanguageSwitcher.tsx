'use client';

import { cn } from './utils';
import { Globe } from 'lucide-react';

export type SupportedLocale = 'en' | 'hi' | 'mr';

export interface LanguageSwitcherProps {
  currentLocale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
  className?: string;
  showIcon?: boolean;
}

const LOCALES: { code: SupportedLocale; label: string; ariaLabel: string }[] = [
  { code: 'en', label: 'EN', ariaLabel: 'English language' },
  { code: 'hi', label: 'हिन्दी', ariaLabel: 'हिंदी भाषा' },
  { code: 'mr', label: 'मराठी', ariaLabel: 'मराठी भाषा' },
];

export function LanguageSwitcher({
  currentLocale,
  onLocaleChange,
  className,
  showIcon = true,
}: LanguageSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select interface language"
      className={cn(
        'inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 shadow-xs',
        className
      )}
    >
      {showIcon && (
        <Globe
          className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-2 mr-1 shrink-0"
          aria-hidden="true"
        />
      )}
      <div className="flex items-center gap-1">
        {LOCALES.map((loc) => {
          const isSelected = currentLocale === loc.code;
          return (
            <button
              key={loc.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={loc.ariaLabel}
              onClick={() => onLocaleChange(loc.code)}
              className={cn(
                'min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl text-xs font-semibold transition-all select-none flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1',
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              )}
            >
              {loc.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
