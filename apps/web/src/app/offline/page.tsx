'use client';

import React, { useState } from 'react';
import { WifiOff, RefreshCw, ArrowLeft, Shield } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { Button } from '@grievease/ui';

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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base">
            G
          </span>
          <span className="font-bold text-xl text-white">
            Griev<span className="text-teal-400">Ease</span>
          </span>
        </div>
      </header>

      {/* Main Content Card (Designed for 360px+) */}
      <main className="w-full max-w-md mx-auto my-auto text-center py-8">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-6 text-teal-400 shadow-xl">
          <WifiOff className="w-10 h-10 animate-pulse text-amber-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
          {t.offline.title}
        </h1>

        <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed max-w-sm mx-auto">
          {t.offline.description}
        </p>

        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 mb-8 text-xs sm:text-sm text-slate-400">
          <p>{t.offline.cachedNotice}</p>
        </div>

        {/* Action Button: Minimum 44px tap target */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white font-semibold text-base flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-900/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{t.offline.retryButton}</span>
          </button>

          <a
            href="/login"
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-slate-200 font-medium text-base flex items-center justify-center gap-2 transition-all border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t.auth.backToLogin}</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 py-4">
        GrievEase Offline Resilient App Shell • Client-Owned Security
      </footer>
    </div>
  );
}
