'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function AdminBillingDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('OPEN');
  const [loading, setLoading] = useState(true);

  // Resolution modal
  const [resolvingDispute, setResolvingDispute] = useState<any | null>(null);
  const [resolutionStatus, setResolutionStatus] = useState<'RESOLVED' | 'REJECTED'>('RESOLVED');
  const [outcomeNote, setOutcomeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDisputes = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await api.listBillingDisputes(
        selectedStatus !== 'ALL' ? selectedStatus : undefined,
      );
      if (Array.isArray(data)) setDisputes(data);
    } catch (err: any) {
      console.warn('Failed to load disputes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, [selectedStatus]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute || !outcomeNote.trim()) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.resolveBillingDispute(resolvingDispute.id, resolutionStatus, outcomeNote.trim());
      setActionSuccess(`Dispute marked as ${resolutionStatus.toLowerCase()}.`);
      setResolvingDispute(null);
      setOutcomeNote('');
      loadDisputes();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update dispute.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <AlertOctagon className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payment Disputes Resolution</h1>
                <p className="text-sm text-slate-500">
                  Review claims of unrecorded cash payments or incorrect receipts filed by residents.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/billing"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Overview
            </Link>
            <button
              onClick={loadDisputes}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-600" />
            {actionError}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          {(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED', 'ALL'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl transition ${
                selectedStatus === s
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-500 mb-3" />
            <p className="font-medium">Loading payment disputes...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No disputes found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no resident payment disputes under the selected filter.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Dispute Type</th>
                  <th className="px-5 py-3.5">Flat / Resident</th>
                  <th className="px-5 py-3.5">Claimed Amount</th>
                  <th className="px-5 py-3.5">Resident Description</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-900 block">{d.kind}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(d.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 block">
                        Flat {d.flat_number || d.flat_id?.slice(0, 8)}
                      </span>
                      <span className="text-[11px] text-slate-400">{d.resident_name}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-rose-700 text-sm">
                      {formatPaise(d.claim_amount_paise)}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 italic">"{d.note}"</p>
                      {d.outcome_note && (
                        <p className="text-slate-400 text-[10px] mt-1">
                          Resolution: {d.outcome_note}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          d.status === 'RESOLVED'
                            ? 'default'
                            : d.status === 'OPEN' || d.status === 'UNDER_REVIEW'
                            ? 'neutral'
                            : 'danger'
                        }
                        className="text-[10px]"
                      >
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {d.status !== 'RESOLVED' && d.status !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            setResolvingDispute(d);
                            setResolutionStatus('RESOLVED');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                        >
                          Resolve Claim
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Resolve Dispute */}
        {resolvingDispute && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Resolve Resident Dispute</h3>
              <p className="text-xs text-slate-500 mb-4">
                Review the claim for {formatPaise(resolvingDispute.claim_amount_paise)} and record the committee outcome.
              </p>

              <form onSubmit={handleResolve} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Outcome Decision *
                  </label>
                  <select
                    value={resolutionStatus}
                    onChange={(e) => setResolutionStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="RESOLVED">RESOLVED (Accepted / Correction Issued)</option>
                    <option value="REJECTED">REJECTED (Claim Rejected with Reason)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Outcome Explanation Note *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={outcomeNote}
                    onChange={(e) => setOutcomeNote(e.target.value)}
                    placeholder="Document the resolution details, receipt search findings, or credit note reference..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResolvingDispute(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !outcomeNote.trim()}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                  >
                    {submitting ? 'Saving...' : 'Submit Decision'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
