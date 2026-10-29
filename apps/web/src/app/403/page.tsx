'use client';

import React from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { Home, ArrowLeft } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function ForbiddenPage() {
  const { locale, setLocale } = useAccessibility();

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 sm:p-8 space-y-4">
          {/* Friendly Inline SVG Shield Illustration */}
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
              HTTP 403
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Access Forbidden
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              You do not have administrative permission to view this section or cross-society tenant isolation has blocked access.
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
                Return Home
              </Button>
            </Link>
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="lg" className="w-full text-xs font-bold">
                Switch Account
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
