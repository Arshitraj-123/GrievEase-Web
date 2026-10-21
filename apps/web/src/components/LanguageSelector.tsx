'use client';

import React from 'react';
import { Languages } from 'lucide-react';
import { Locale } from '@/lib/i18n';

interface LanguageSelectorProps {
  currentLocale: Locale;
  onLocaleChange: (loc: Locale) => void;
  className?: string;
}

export default function LanguageSelector({ currentLocale, onLocaleChange, className = '' }: LanguageSelectorProps) {
  return (
    <div className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold ${className}`}>
      <Languages className="w-4 h-4 text-slate-400 ml-2" />
      <button
        type="button"
        onClick={() => onLocaleChange('en')}
        className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center ${
          currentLocale === 'en'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onLocaleChange('hi')}
        className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center ${
          currentLocale === 'hi'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => onLocaleChange('mr')}
        className={`min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl transition-all flex items-center justify-center ${
          currentLocale === 'mr'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm font-bold'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        मराठी
      </button>
    </div>
  );
}
