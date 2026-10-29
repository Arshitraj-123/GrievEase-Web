'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@grievease/ui';
import {
  Search,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function TrackPage() {
  const { t } = useAccessibility();
  const [publicId, setPublicId] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicId.trim() || !trackingCode.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.trackPublic(publicId.trim(), trackingCode.trim());
      setResult(res);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) {
        setError(t.grievances.notFound);
      } else {
        setError(err.message || 'Unable to track grievance at this time. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge className="bg-sky-100 text-sky-800 text-xs">Submitted</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Acknowledged</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-amber-100 text-amber-800 text-xs">In Progress</Badge>;
      case 'PENDING_INFO':
        return <Badge className="bg-purple-100 text-purple-800 text-xs">Pending Info</Badge>;
      case 'ESCALATED':
        return <Badge className="bg-rose-600 text-white text-xs animate-pulse">Escalated</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Resolved</Badge>;
      case 'CLOSED':
        return <Badge className="bg-slate-200 text-slate-800 text-xs">Closed</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 flex flex-col justify-between">
      <div className="max-w-md w-full mx-auto space-y-6 pt-6 sm:pt-12">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Badge variant="outline" className="text-[11px] text-slate-500">
            Public Portal
          </Badge>
        </div>

        {/* Tracker Form Card */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7 rounded-3xl space-y-5 bg-white dark:bg-slate-900">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 mx-auto flex items-center justify-center mb-2">
              <Search className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {t.grievances.trackPublicTitle}
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t.grievances.trackPublicSubtitle}
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.grievances.publicIdLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.grievances.publicIdPlaceholder}
                value={publicId}
                onChange={(e) => setPublicId(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs uppercase focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {t.grievances.trackingCodeLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.grievances.trackingCodePlaceholder}
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs uppercase focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 text-rose-800 text-xs flex items-center gap-2 border border-rose-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !publicId.trim() || !trackingCode.trim()}
              className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md"
            >
              {loading ? t.grievances.trackingSearching : t.grievances.trackButton}
            </Button>
          </form>
        </Card>

        {/* Result Card: Strict Zero-PII Stepper View */}
        {result && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-xs font-black text-teal-600 dark:text-teal-400">
                  {result.publicId}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {result.title}
                </h3>
              </div>
              {getStatusBadge(result.status)}
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{result.categoryName}</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Governance Level</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Level {result.currentLevel}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/40 border border-teal-200/80 dark:border-teal-900/60 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-teal-900 dark:text-teal-200">
                  Target SLA: {new Date(result.slaDueAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            {/* Public Stepper */}
            <div className="pt-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                Lifecycle Progression
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                {[
                  { step: '1. Received', active: true },
                  { step: '2. Review', active: ['ACKNOWLEDGED', 'IN_PROGRESS', 'PENDING_INFO', 'ESCALATED', 'RESOLVED', 'CLOSED'].includes(result.status) },
                  { step: '3. Action', active: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED', 'CLOSED'].includes(result.status) },
                  { step: '4. Resolved', active: ['RESOLVED', 'CLOSED'].includes(result.status) },
                ].map((s, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-xl border ${
                      s.active
                        ? 'bg-teal-50 border-teal-400 text-teal-800 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {s.step}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-2">
              🔒 Verified by Cryptographic Hash Chain • Zero Personal Data Disclosed
            </div>
          </div>
        )}
      </div>

      <div className="text-center text-xs text-slate-400 py-4">
        © {new Date().getFullYear()} GrievEase • Society Governance & Resolution Portal
      </div>
    </div>
  );
}
