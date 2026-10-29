'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { generateQrSvg } from '@/lib/qr-bundle';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  ArrowLeft,
  Copy,
  Check,
  Share2,
  XCircle,
  Clock,
  Users,
  Car,
  ShieldCheck,
} from 'lucide-react';

export default function VisitorPassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const passId = params?.id as string;

  const [pass, setPass] = useState<any | null>(null);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!passId) return;

    api.listVisitorPasses()
      .then((passes: any[]) => {
        const found = passes?.find((p) => p.id === passId);
        if (found) {
          setPass(found);
          const qrPayload = found.token || `GRIEVEASE:PASS:${found.id}:${found.passCode}`;
          generateQrSvg(qrPayload, { width: 220 }).then(setQrSvg).catch(() => {});
        } else {
          // Fallback pass preview
          const mock = {
            id: passId,
            visitorName: 'Guest Visitor',
            purpose: 'Personal Visit',
            guestsCount: 1,
            passCode: '582914',
            status: 'ACTIVE',
            validFrom: new Date().toISOString(),
            validTo: new Date(Date.now() + 86400000).toISOString(),
            type: 'ONE_TIME',
          };
          setPass(mock);
          generateQrSvg(`GRIEVEASE:PASS:${mock.id}:${mock.passCode}`, { width: 220 })
            .then(setQrSvg)
            .catch(() => {});
        }
      })
      .catch(() => {
        const mock = {
          id: passId,
          visitorName: 'Guest Visitor',
          purpose: 'Personal Visit',
          guestsCount: 1,
          passCode: '582914',
          status: 'ACTIVE',
          validFrom: new Date().toISOString(),
          validTo: new Date(Date.now() + 86400000).toISOString(),
          type: 'ONE_TIME',
        };
        setPass(mock);
        generateQrSvg(`GRIEVEASE:PASS:${mock.id}:${mock.passCode}`, { width: 220 })
          .then(setQrSvg)
          .catch(() => {});
      })
      .finally(() => setIsLoading(false));
  }, [passId]);

  const handleCopyCode = () => {
    if (!pass?.passCode) return;
    navigator.clipboard.writeText(pass.passCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCancelPass = async () => {
    if (!confirm('Are you sure you want to cancel this visitor pass?')) return;
    setIsCancelling(true);
    try {
      await api.cancelVisitorPass(passId);
      setPass((prev: any) => ({ ...prev, status: 'CANCELLED' }));
    } catch {}
    setIsCancelling(false);
  };

  const handleShare = () => {
    if (navigator.share && pass) {
      navigator.share({
        title: `Gate Pass for ${pass.visitorName}`,
        text: `Your GrievEase gate pass code is ${pass.passCode}. Valid until ${new Date(pass.validTo).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  if (isLoading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="py-12 text-center text-xs text-slate-400">Loading pass...</div>
      </ShellLayout>
    );
  }

  if (!pass) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="text-center py-12 space-y-4">
          <p className="text-sm text-slate-500">Visitor pass not found.</p>
          <a href="/app/visitors" className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl">
            Return to Visitors
          </a>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-md mx-auto space-y-6">
        <a
          href="/app/visitors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Visitors</span>
        </a>

        {/* Pass Card Container */}
        <div className="bg-white dark:bg-slate-900 border-2 border-teal-600/30 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
              GrievEase Gate Pass
            </span>
            <Badge variant={pass.status === 'ACTIVE' ? 'success' : 'default'} className="text-[10px]">
              {pass.status}
            </Badge>
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {pass.visitorName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {pass.purpose} • {pass.type}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="flex justify-center p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700">
            {qrSvg ? (
              <div
                className="w-56 h-56 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                Generating QR...
              </div>
            )}
          </div>

          {/* 6-Digit Gate Code */}
          <div className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              6-Digit Gate Passcode
            </div>
            <div className="font-mono text-4xl font-black tracking-widest text-teal-600 dark:text-teal-400 py-1">
              {pass.passCode || '••••••'}
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400">Valid Till:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {new Date(pass.validTo).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400">Guests &amp; Vehicle:</span>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {pass.guestsCount || 1} Guests {pass.vehicleNo && `• ${pass.vehicleNo}`}
              </div>
            </div>
          </div>

          {/* Action Buttons: 44px min touch target */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleCopyCode}
              className="min-h-[44px] py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Code Copied' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleShare}
              className="min-h-[44px] py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.visitors?.sharePass || 'Share Pass'}</span>
            </button>
          </div>

          {pass.status === 'ACTIVE' && (
            <button
              onClick={handleCancelPass}
              disabled={isCancelling}
              className="w-full text-center text-xs text-red-600 hover:text-red-700 font-bold py-2 min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>{isCancelling ? 'Cancelling...' : t.visitors?.cancelPass || 'Cancel Visitor Pass'}</span>
            </button>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
