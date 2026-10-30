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
  Scale,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  FileText,
  User,
  Check,
  X,
  Lock,
} from 'lucide-react';

export default function AdminAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [loading, setLoading] = useState(true);

  // New Request Form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'WAIVER',
    flatId: '',
    amountRupees: '',
    reason: '',
  });

  // Decision Modal
  const [decidingItem, setDecidingItem] = useState<any | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionNote, setDecisionNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAdjustments = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await api.listAdjustments(
        selectedStatus !== 'ALL' ? selectedStatus : undefined,
      );
      if (Array.isArray(data)) setAdjustments(data);
    } catch (err: any) {
      console.warn('Failed to load adjustments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdjustments();
  }, [selectedStatus]);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.reason.trim().length < 30) {
      setActionError('Reason must be at least 30 characters long for audit integrity.');
      return;
    }
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.createAdjustmentRequest({
        type: formData.type,
        flatId: formData.flatId.trim(),
        amountPaise: Math.round(Number(formData.amountRupees) * 100),
        reason: formData.reason.trim(),
      });
      setActionSuccess('Adjustment request submitted for Checker approval.');
      setShowCreateModal(false);
      setFormData({ type: 'WAIVER', flatId: '', amountRupees: '', reason: '' });
      loadAdjustments();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create adjustment request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decidingItem) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.decideAdjustment(decidingItem.id, decisionType, decisionNote || undefined);
      setActionSuccess(`Adjustment request ${decisionType.toLowerCase()} successfully.`);
      setDecidingItem(null);
      setDecisionNote('');
      loadAdjustments();
    } catch (err: any) {
      setActionError(
        err.message || 'Decision failed. Note: Creator cannot approve their own adjustment.',
      );
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
              <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <Scale className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Adjustments & Waivers</h1>
                <p className="text-sm text-slate-500">
                  Maker-Checker queue for waivers, credit notes, refunds, receipt voids, and bill cancellations.
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
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Request Adjustment
            </button>
          </div>
        </div>

        {/* Maker Checker Alert */}
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-950 rounded-2xl flex items-start gap-3">
          <Scale className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Strict Maker-Checker Separation of Duties</p>
            <p className="text-purple-800">
              The person who creates a waiver, credit note, refund, or void request can <strong>never</strong> approve it.
              Financial corrections are never updated in place or deleted; they are appended as cryptographic reversing ledger entries.
            </p>
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
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            {actionError}
          </div>
        )}

        {/* Status Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((s) => (
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

          <button
            onClick={loadAdjustments}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Adjustments Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-3" />
            <p className="font-medium">Loading adjustments queue...</p>
          </div>
        ) : adjustments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Scale className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No adjustment requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Requests for waivers, credit notes, refunds, or voiding receipts will be listed here.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Flat / Unit</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Audited Reason</th>
                  <th className="px-5 py-3.5">Maker / Checker</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {adjustments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-slate-900 block">{a.type}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      Flat {a.flat_number || a.flat_id?.slice(0, 8)}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 text-sm">
                      {formatPaise(a.amount_paise)}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-slate-700 line-clamp-2 italic">"{a.reason}"</p>
                      {a.decision_note && (
                        <p className="text-slate-400 text-[10px] mt-1">
                          Decision: {a.decision_note}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-[11px]">
                      <div>
                        <span className="text-slate-400">Maker: </span>
                        <span className="font-semibold text-slate-700">
                          {a.creator_name || 'Admin'}
                        </span>
                      </div>
                      {a.approved_by && (
                        <div>
                          <span className="text-slate-400">Checker: </span>
                          <span className="font-semibold text-emerald-700">
                            {a.approver_name || 'Approver'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          a.status === 'APPROVED'
                            ? 'default'
                            : a.status === 'PENDING'
                            ? 'neutral'
                            : 'danger'
                        }
                        className="text-[10px]"
                      >
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {a.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setDecidingItem(a);
                              setDecisionType('APPROVED');
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm transition"
                          >
                            <Check className="w-3 h-3" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setDecidingItem(a);
                              setDecisionType('REJECTED');
                            }}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <X className="w-3 h-3" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: Request New Adjustment */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Request Adjustment</h3>
                  <p className="text-xs text-slate-500">
                    Creates an audited adjustment request awaiting Maker-Checker sign-off.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateRequest} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjustment Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="WAIVER">WAIVER (Forgive Late Fee or Dues)</option>
                    <option value="CREDIT_NOTE">CREDIT_NOTE (Billing Correction)</option>
                    <option value="REFUND">REFUND (Cash Returned to Resident)</option>
                    <option value="VOID">VOID (Void Erroneous Receipt)</option>
                    <option value="BILL_CANCEL">BILL_CANCEL (Cancel Issued Bill)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Flat / Unit *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.flatId}
                      onChange={(e) => setFormData({ ...formData, flatId: e.target.value })}
                      placeholder="e.g. 101 or UUID"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.amountRupees}
                      onChange={(e) => setFormData({ ...formData, amountRupees: e.target.value })}
                      placeholder="e.g. 500"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Reason for Adjustment *
                    </label>
                    <span
                      className={`text-[10px] font-mono ${
                        formData.reason.length < 30 ? 'text-rose-500' : 'text-emerald-600'
                      }`}
                    >
                      {formData.reason.length}/30 min chars
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Provide a detailed factual reason explaining why this financial correction is required..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || formData.reason.length < 30}
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Maker-Checker Decision */}
        {decidingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg mb-1">
                {decisionType === 'APPROVED' ? 'Approve' : 'Reject'} Adjustment Request
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                You are acting as Checker for this {decidingItem.type} of {formatPaise(decidingItem.amount_paise)}.
              </p>

              <form onSubmit={handleDecide} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Decision Note / Committee Minutes Reference (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="e.g. Approved per Managing Committee resolution on 28-Oct-2026..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDecidingItem(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-5 py-2 text-white text-xs font-bold rounded-xl ${
                      decisionType === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    {submitting ? 'Processing...' : `Confirm ${decisionType}`}
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
