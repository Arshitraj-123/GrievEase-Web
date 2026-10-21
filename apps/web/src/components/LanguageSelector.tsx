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
    <div className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold ${className}`}>
      <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
      <button
        type="button"
        onClick={() => onLocaleChange('en')}
        className={`px-2 py-1 rounded-lg transition-all ${
          currentLocale === 'en'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onLocaleChange('hi')}
        className={`px-2 py-1 rounded-lg transition-all ${
          currentLocale === 'hi'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => onLocaleChange('mr')}
        className={`px-2 py-1 rounded-lg transition-all ${
          currentLocale === 'mr'
            ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        मराठी
      </button>
    </div>
  );
}
