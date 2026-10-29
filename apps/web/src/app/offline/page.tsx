'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardTitle, CardDescription, Button } from '@grievease/ui';
import { WifiOff, RefreshCw, FileText } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function OfflinePage() {
  const { t, locale, setLocale } = useAccessibility();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 sm:p-8 space-y-4">
          {/* Friendly Inline SVG Offline Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-sm">
            <svg
              className="w-10 h-10 animate-pulse motion-reduce:animate-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3l18 18M10.5 10.5a5 5 0 017 0m-9.5-2.5a8.5 8.5 0 0112 0M6 18a1 1 0 100-2 1 1 0 000 2z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              No Network Connection
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.offline.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {t.offline.description}
            </CardDescription>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300">
            {t.offline.cachedNotice}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 text-xs font-bold shadow-md shadow-teal-900/10"
              onClick={handleRetry}
              isLoading={isRetrying}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              {t.offline.retryButton}
            </Button>
            <Link href="/app/grievances/drafts" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs font-bold"
                leftIcon={<FileText className="w-4 h-4" />}
              >
                View Saved Drafts
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
