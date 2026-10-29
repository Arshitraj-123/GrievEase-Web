'use client';

import React from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardTitle, CardDescription, Button } from '@grievease/ui';
import { Home, Search } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function NotFound() {
  const { locale, setLocale } = useAccessibility();

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 sm:p-8 space-y-4">
          {/* Friendly Inline SVG 404 Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-sm">
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
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
              HTTP 404
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Page Not Found
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              The requested page or society portal could not be located. It may have moved or the link might be outdated.
            </CardDescription>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button
                variant="primary"
                size="lg"
                className="w-full text-xs font-bold shadow-md shadow-teal-900/10"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Return to Home
              </Button>
            </Link>
            <Link href="/track" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs font-bold"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track a Complaint
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
