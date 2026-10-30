'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import {
  ChevronLeft,
  Landmark,
  Clock,
  UserCheck,
  AlertCircle,
  FileCheck2,
  ShieldAlert,
} from 'lucide-react';

export default function HowToPayPage() {
  const { t } = useAccessibility();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getHowToPay()
      .then(setData)
      .catch(() => {
        setData({
          instructions: 'Please pay cash at the society office on the ground floor. Obtain an official printed or digital receipt immediately.',
          gstNote: 'Confirm GST applicability with your chartered accountant. GrievEase is not a tax advisor.',
          collectors: [
            { full_name: 'Vikram Singh', role: 'SECRETARY', mobile: '+919876543212' },
            { full_name: 'Rohan Sharma', role: 'SUPER_ADMIN', mobile: '+919876543200' },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href="/app/bills"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Bills</span>
        </Link>

        {/* Main Content */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-6 h-6 text-teal-600" />
              <span>{t.billing.howToPayTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t.billing.howToPaySubtitle}
            </p>
          </div>

          {/* Strict Offline Notice */}
          <div className="bg-amber-50 dark:bg-amber-950/60 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Cash Payments Recorded at Society Office Only</span>
            </div>
            <p>{t.billing.noOnlinePaymentNotice}</p>
          </div>

          {/* Office Hours */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <span>{t.billing.officeHours}</span>
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Monday to Saturday: <strong>09:00 AM – 01:00 PM</strong> and <strong>05:00 PM – 08:00 PM</strong>
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Sunday: Closed for routine maintenance
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Location: Society Management Office, Ground Floor, Wing A
              </p>
            </div>
          </div>

          {/* Instructions */}
          {data?.instructions && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Instructions for Residents:
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {data.instructions}
              </div>
            </div>
          )}

          {/* Authorized Collectors */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-teal-600" />
              <span>{t.billing.authorizedCollectors}</span>
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              {data?.collectors?.map((col: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between text-xs bg-white dark:bg-slate-900">
                  <div>
                    <strong className="text-slate-900 dark:text-white block">{col.full_name}</strong>
                    <span className="text-slate-400">{col.role}</span>
                  </div>
                  {col.mobile && (
                    <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      {col.mobile}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Anti-fraud transparency note */}
          <div className="bg-teal-50 dark:bg-teal-950/60 p-4 rounded-2xl border border-teal-200 dark:border-teal-800 text-xs text-teal-900 dark:text-teal-200 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
              <FileCheck2 className="w-4 h-4" />
              <span>Instant Digital Receipt Guarantee</span>
            </div>
            <p>
              As soon as cash is counted at the desk, the collector must record it immediately in the system. You will receive an instant in-app notification with the receipt number, and your ledger balance will update in real time.
            </p>
          </div>

          {/* GST Disclaimer */}
          <p className="text-[11px] text-slate-400 italic">
            {t.billing.gstDisclaimer}
          </p>
        </div>
      </div>
    </ShellLayout>
  );
}

