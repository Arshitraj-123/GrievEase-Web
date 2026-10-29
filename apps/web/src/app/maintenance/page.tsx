'use client';

import React from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardTitle, CardDescription, Button } from '@grievease/ui';
import { RefreshCw, Home } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function MaintenancePage() {
  const { locale, setLocale } = useAccessibility();

  const handleRefresh = () => {
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
          {/* Friendly Inline SVG Maintenance Illustration */}
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-800 shadow-sm">
            <svg
              className="w-10 h-10 animate-spin motion-reduce:animate-none"
              style={{ animationDuration: '8s' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <circle cx="12" cy="12" r="3" strokeWidth="2" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              System Maintenance
            </span>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Scheduled Maintenance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              The society server is currently undergoing cryptographic backup and database index optimization. Please check back shortly.
            </CardDescription>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              size="lg"
              className="flex-1 text-xs font-bold shadow-md shadow-teal-900/10"
              onClick={handleRefresh}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Check Again
            </Button>
            <Link href="/" className="flex-1">
              <Button
                variant="outline"
                size="lg"
                className="w-full text-xs font-bold"
                leftIcon={<Home className="w-4 h-4" />}
              >
                Return Home
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AuthLayout>
  );
}
