'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@grievease/ui';
import { ShieldAlert, HelpCircle, ArrowLeft, Phone, UserCheck } from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';
import LanguageSelector from '@/components/LanguageSelector';

export default function AccountHelpPage() {
  const { t, locale, setLocale } = useAccessibility();

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-lg w-full space-y-4">
        <div className="flex justify-center">
          <LanguageSelector currentLocale={locale} onLocaleChange={setLocale} />
        </div>

        <Card className="w-full border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Account Assistance &amp; Support</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
                <span>Account Locked (5 Consecutive Attempts)</span>
              </div>
              <p className="leading-relaxed">
                Your account is automatically locked for 15 minutes following repeated failed attempts. Exponential back-off applies for repeated lockouts.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-teal-600 shrink-0" />
                <span>Forgotten Password or Lost Slip</span>
              </div>
              <p className="leading-relaxed">
                If you have lost your recovery codes and cannot answer your security questions, contact your <strong>Society Secretary</strong> or <strong>Super Administrator</strong> in person. They will re-issue a physical credential slip with a QR code.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-500 shrink-0" />
                <span>Admin &amp; Committee Governance</span>
              </div>
              <p className="leading-relaxed">
                Administrative roles enforce mandatory 2FA and cannot use security questions. Emergency council transfers are governed through the break-glass handover procedure.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/login" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full min-h-[48px] text-base font-semibold"
                  leftIcon={<ArrowLeft className="w-5 h-5" />}
                >
                  {t.auth.backToLogin}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
