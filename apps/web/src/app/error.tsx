'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardTitle, CardDescription, Button } from '@grievease/ui';
import { RotateCcw, Home } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale, setLocale } = useAccessibility();

  useEffect(() => {
    console.error('Unhandled GrievEase UI Error:', error);
  }, [error]);

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 sm:p-8 space-y-4">
          {/* Friendly Inline SVG Error Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center mx-auto border border-red-200 dark:border-red-800 shadow-sm">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
              HTTP 500
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Something Went Wrong
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              An unexpected glitch occurred while rendering this view. Your drafts and session data are secure.
            </CardDescription>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 text-xs font-bold shadow-md shadow-teal-900/10"
              onClick={() => reset()}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs font-bold"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Return to Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
