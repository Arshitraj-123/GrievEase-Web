'use client';

import React, { useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import {
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function GrievanceConfirmedPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useAccessibility();

  const publicId = (params?.id as string) || 'GR-2026-XXXX';
  const trackingCode = searchParams?.get('code');
  const expectedDate = searchParams?.get('expected');
  const levelNum = Number(searchParams?.get('level') || '1');

  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);

  const handleCopyCode = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {}
  };

  const handleShare = async () => {
    const text = `GrievEase Complaint ${publicId} submitted. Expected resolution: ${
      expectedDate ? new Date(expectedDate).toLocaleDateString() : 'Active SLA'
    }. Track online at ${window.location.origin}/track`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Grievance ${publicId}`,
          text,
          url: `${window.location.origin}/track`,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('Grievance summary copied to clipboard!');
    }
  };

  const formattedExpected = expectedDate
    ? new Date(expectedDate).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Calculated via SLA';

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-xl mx-auto pb-16">
        {/* Success Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white border border-emerald-800/40 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-400/30">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <Badge variant="default" className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs">
              Successfully Filed & Locked
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Grievance Confirmed
            </h1>
            <p className="text-xs text-slate-300">
              Assigned to society governance with guaranteed resolution SLA.
            </p>
          </div>

          {/* Public ID Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 max-w-xs mx-auto">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">
              Complaint Reference ID
            </span>
            <span className="font-mono text-xl sm:text-2xl font-black text-emerald-300">
              {publicId}
            </span>
          </div>
        </div>

        {/* Expected SLA & Assigned Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Target Resolution Date
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {formattedExpected}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Level
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Level {levelNum}: Secretary
              </span>
            </div>
          </div>
        </div>

        {/* ANONYMOUS TRACKING CODE VAULT (Shown once) */}
        {trackingCode && (
          <div className="p-5 sm:p-6 rounded-3xl bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-300 dark:border-purple-800 space-y-4 shadow-md">
            <div className="flex items-center gap-2.5 text-purple-900 dark:text-purple-200">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <h3 className="text-sm sm:text-base font-extrabold">
                {t.grievances.trackingCodeTitle}
              </h3>
            </div>

            <p className="text-xs text-purple-800 dark:text-purple-300 leading-relaxed font-medium">
              {t.grievances.trackingCodeWarning}
            </p>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-900 flex items-center justify-between gap-3">
              <span className="font-mono text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-300 tracking-wider">
                {trackingCode}
              </span>

              <button
                type="button"
                onClick={handleCopyCode}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t.grievances.codeCopied : t.grievances.copyCode}</span>
              </button>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-2xl bg-purple-100/60 dark:bg-purple-900/40 cursor-pointer text-xs font-semibold text-purple-950 dark:text-purple-100 select-none">
              <input
                type="checkbox"
                checked={savedConfirmed}
                onChange={(e) => setSavedConfirmed(e.target.checked)}
                className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
              />
              <span>{t.grievances.savedConfirmation}</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleShare}
            className="w-full min-h-[48px] rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Grievance Reference</span>
          </button>

          <Link
            href={`/app/grievances`}
            className={`w-full min-h-[50px] rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-teal-900/20 transition-all ${
              trackingCode && !savedConfirmed ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <span>{t.grievances.continueToConfirmed}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </ShellLayout>
  );
}
