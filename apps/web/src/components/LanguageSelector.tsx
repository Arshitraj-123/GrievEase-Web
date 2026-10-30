'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLocale: Locale;
  onLocaleChange: (loc: Locale) => void;
  className?: string;
}

export default function LanguageSelector({
  currentLocale,
  onLocaleChange,
  className = '',
}: LanguageSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select interface language"
      className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold border border-slate-200 dark:border-slate-700/80 ${className}`}
    >
      <Languages className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-2 mr-0.5" aria-hidden="true" />
      <button
        type="button"
        role="radio"
        aria-checked={currentLocale === 'en'}
        aria-pressed={currentLocale === 'en'}
        aria-label="English language"
        onClick={() => onLocaleChange('en')}
        className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl transition-all flex items-center justify-center font-semibold text-sm ${
          currentLocale === 'en'
            ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold border border-slate-200/60 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span>EN</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={currentLocale === 'hi'}
        aria-pressed={currentLocale === 'hi'}
        aria-label="हिंदी भाषा"
        onClick={() => onLocaleChange('hi')}
        className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl transition-all flex items-center justify-center font-semibold text-sm ${
          currentLocale === 'hi'
            ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold border border-slate-200/60 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
        }`}
      >
        <span lang="hi">हिन्दी</span>
      </button>
    </div>
  );
}
