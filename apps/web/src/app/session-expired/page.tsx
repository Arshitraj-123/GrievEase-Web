'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayout, Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { ArrowRight } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '';

  const { t, locale, setLocale } = useAccessibility();

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 sm:p-8 space-y-4">
          {/* Friendly Inline SVG Clock / Timeout Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-sm">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" strokeWidth="2" strokeLinecap="round" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 7v5l3 3" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.auth.sessionExpiredTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {t.auth.sessionExpiredSubtitle}. Your work and drafts have been safely preserved.
            </CardDescription>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full text-base font-bold shadow-md shadow-teal-900/10"
              onClick={() =>
                router.push(
                  nextUrl
                    ? `/login?reason=expired&next=${encodeURIComponent(nextUrl)}`
                    : '/login?reason=expired'
                )
              }
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Sign In Again
            </Button>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function SessionExpiredPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading...
        </div>
      }
    >
      <SessionExpiredContent />
    </React.Suspense>
  );
}
