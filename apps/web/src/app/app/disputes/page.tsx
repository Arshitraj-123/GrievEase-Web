'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  AlertTriangle,
  PlusCircle,
  FileQuestion,
  CheckCircle,
  Clock,
  ChevronLeft,
} from 'lucide-react';

function ResidentDisputesContent() {
  const { t } = useAccessibility();
  const searchParams = useSearchParams();
  const initialPaymentId = searchParams?.get('paymentId') || '';

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(Boolean(initialPaymentId));
  const [kind, setKind] = useState<'ENTRY_WRONG' | 'PAID_NOT_RECORDED'>('ENTRY_WRONG');
  const [paymentId, setPaymentId] = useState(initialPaymentId);
  const [claimAmount, setClaimAmount] = useState('');
  const [claimDate, setClaimDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchDisputes = () => {
    api
      .getMyDisputes()
      .then((data) => setDisputes(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback demo data
        setDisputes([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 10) {
      alert('Please provide at least 10 characters explaining the issue.');
      return;
    }
    setSubmitting(true);
    try {
      await api.createDispute({
        kind,
        paymentId: paymentId || undefined,
        claimAmountPaise: claimAmount ? Math.round(parseFloat(claimAmount) * 100) : undefined,
        claimDate: claimDate || undefined,
        note,
      });
      setFeedbackMsg('Dispute report submitted. It has been forwarded to the Chairman and Managing Committee for review.');
      setModalOpen(false);
      setNote('');
      fetchDisputes();
    } catch (err: any) {
      alert(err.message || 'Failed to submit dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <span>{t.billing.disputeTitle}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Report incorrect payment entries or unrecorded cash handovers directly to the Managing Committee
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.billing.reportIssue}</span>
          </button>
        </div>

        {feedbackMsg && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-xs sm:text-sm text-teal-900 dark:text-teal-200 font-medium"
          >
            {feedbackMsg}
          </div>
        )}

        {/* Disputes List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading dispute reports...
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-2">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No active payment disputes
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              If an office receipt is missing or an amount was recorded incorrectly, click &ldquo;{t.billing.reportIssue}&rdquo; above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {disputes.map((d) => (
              <div
                key={d.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                    {d.kind === 'ENTRY_WRONG' ? t.billing.disputeWrongEntry : t.billing.disputePaidNotRecorded}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      d.status === 'RESOLVED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : d.status === 'REJECTED'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {d.note}
                </p>
                {d.claim_amount_paise > 0 && (
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Claim Amount: {formatPaise(d.claim_amount_paise)}
                  </p>
                )}
                {d.outcome_note && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 mt-2">
                    <strong>Committee Resolution:</strong> {d.outcome_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Report Issue Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl"
            >
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.billing.reportIssue}
              </h2>
              <p className="text-xs text-slate-500">
                This report is routed directly to the Chairman and Committee (bypassing the collector) for anti-fraud review.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Type of Discrepancy *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setKind('ENTRY_WRONG')}
                    className={`p-3 rounded-xl border text-left font-semibold min-h-[44px] ${
                      kind === 'ENTRY_WRONG'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.billing.disputeWrongEntry}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('PAID_NOT_RECORDED')}
                    className={`p-3 rounded-xl border text-left font-semibold min-h-[44px] ${
                      kind === 'PAID_NOT_RECORDED'
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {t.billing.disputePaidNotRecorded}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Claim Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 3850.00"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date Paid / Handed Over
                  </label>
                  <input
                    type="date"
                    value={claimDate}
                    onChange={(e) => setClaimDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Explanation * (min 10 characters)
                </label>
                <textarea
                  required
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain when cash was handed over, to whom, or what is incorrect..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || note.trim().length < 10}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'Submitting...' : 'Submit to Committee'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function ResidentDisputesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
          Loading disputes...
        </div>
      }
    >
      <ResidentDisputesContent />
    </React.Suspense>
  );
}

