'use client';

import React from 'react';
import Link from 'next/link';
import { AuthLayout, Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@grievease/ui';
import { ShieldAlert, HelpCircle, ArrowLeft, Phone, UserCheck, KeyRound } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function AccountHelpPage() {
  const { locale, setLocale } = useAccessibility();

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-3 space-y-2">
            {/* Inline SVG Support Illustration */}
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Account Assistance
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Guidance for locked accounts, lost credential slips, or forgotten passwords.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3.5 text-xs sm:text-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Account Locked (15-Minute Lockout)</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                To prevent brute-force attacks, accounts automatically lock for 15 minutes after 5 consecutive failed login attempts. Please wait for the timer to expire or reset your password.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Lost Credential Slip or Activation Code</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                Activation codes and initial slips are issued personally by your <strong>Society Secretary</strong>. If your code expired or was lost, request a new printed slip from the estate office.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Forgotten Password</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                You can instantly reset your password using any of your 10 single-use emergency recovery codes, or by answering your 3 security questions.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Link href="/forgot-password" className="flex-1">
                <Button variant="outline" size="lg" className="w-full text-xs font-bold">
                  Reset Password
                </Button>
              </Link>
              <Link href="/login" className="flex-1">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full text-xs font-bold shadow-md shadow-teal-900/10"
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
