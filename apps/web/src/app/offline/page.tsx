'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WifiOff, RefreshCw, FileText, Building2 } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function OfflinePage() {
  const { t } = useAccessibility();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Brand Top Header */}
      <div className="mb-6 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
          Griev<span className="text-teal-600 dark:text-teal-400">Ease</span>
        </span>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900 p-6 sm:p-8 text-center space-y-4">
          {/* Offline Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-sm">
            <WifiOff className="w-10 h-10 animate-pulse motion-reduce:animate-none" />
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              No Network Connection
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.offline?.title || 'You are currently offline'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {t.offline?.description || 'Please check your network connection. Cached app features remain accessible.'}
            </p>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            {t.offline?.cachedNotice || 'Offline Mode • Data will synchronize once your connection is restored.'}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-900/10 transition-colors disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{t.offline?.retryButton || 'Retry Connection'}</span>
            </button>

            <Link
              href="/app/grievances/drafts"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>View Saved Drafts</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
