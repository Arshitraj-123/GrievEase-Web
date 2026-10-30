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
  Calendar,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Scale,
  RefreshCw,
  ArrowLeft,
  XCircle,
  DollarSign,
  Users,
  Eye,
  Lock,
} from 'lucide-react';

export default function AdminBillCyclesPage() {
  const [cycles, setCycles] = useState<any[]>([]);
  const [heads, setHeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Cycle Preview State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [cycleForm, setCycleForm] = useState({
    name: '',
    periodStart: '',
    periodEnd: '',
    dueDate: '',
    headIds: [] as string[],
  });
  const [previewResult, setPreviewResult] = useState<any | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Commit / Maker Checker
  const [committingId, setCommittingId] = useState<string | null>(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [cyclesData, headsData] = await Promise.all([
        api.listBillCycles(),
        api.listBillHeads(),
      ]);
      if (Array.isArray(cyclesData)) setCycles(cyclesData);
      if (Array.isArray(headsData)) {
        setHeads(headsData);
        // Default select all active heads
        setCycleForm((prev) => ({
          ...prev,
          headIds: headsData.filter((h) => h.active).map((h) => h.id),
        }));
      }
    } catch (err: any) {
      console.warn('Failed to load bill cycles', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cycleForm.headIds.length === 0) {
      setActionError('Please select at least one bill head.');
      return;
    }
    setPreviewLoading(true);
    setActionError(null);
    try {
      const res = await api.previewBillCycle({
        name: cycleForm.name,
        periodStart: cycleForm.periodStart,
        periodEnd: cycleForm.periodEnd,
        dueDate: cycleForm.dueDate,
        headIds: cycleForm.headIds,
      });
      setPreviewResult(res);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate cycle preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommit = async (cycleId: string) => {
    if (
      !confirm(
        'Are you sure you want to COMMIT and ISSUE this bill cycle? This will lock sequential bill numbers and post debits to all flat ledgers.',
      )
    ) {
      return;
    }
    setIsCommitting(true);
    setCommittingId(cycleId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.commitBillCycle(cycleId);
      setActionSuccess(
        `Cycle committed successfully! ${res.totalBillsIssued || ''} bills issued with gapless sequential numbers.`,
      );
      loadData();
      setShowCreateModal(false);
      setPreviewResult(null);
    } catch (err: any) {
      setActionError(
        err.message ||
          'Failed to commit cycle. Note: Maker-Checker requires a different eligible checker to approve.',
      );
    } finally {
      setIsCommitting(false);
      setCommittingId(null);
    }
  };

  const toggleHead = (id: string) => {
    setCycleForm((prev) => {
      const exists = prev.headIds.includes(id);
      return {
        ...prev,
        headIds: exists ? prev.headIds.filter((x) => x !== id) : [...prev.headIds, id],
      };
    });
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Maintenance Bill Cycles</h1>
                <p className="text-sm text-slate-500">
                  Generate periodic bills, review calculation previews, and enforce Maker-Checker sign-off.
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
              onClick={() => {
                setShowCreateModal(true);
                setPreviewResult(null);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Bill Cycle
            </button>
          </div>
        </div>

        {/* Maker-Checker Advisory */}
        <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex items-start gap-3">
          <Scale className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900 space-y-1">
            <p className="font-bold">Separation of Duties (Maker-Checker Enforced)</p>
            <p className="text-purple-800">
              The administrator who prepares and previews a bill cycle <strong>cannot approve or commit it</strong>.
              A separate Chairman, Committee Member, or Super Admin must verify the ledger charges before issuing.
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
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {actionError}
          </div>
        )}

        {/* Cycles List */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="font-medium">Loading bill cycles...</p>
          </div>
        ) : cycles.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No billing cycles recorded</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "New Bill Cycle" to prepare and preview maintenance charges for a month or quarter.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Cycle Name</th>
                  <th className="px-5 py-3.5">Period Covered</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Maker / Checker</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycles.map((c) => {
                  const isIssued = c.status === 'ISSUED';
                  const isDraft = c.status === 'DRAFT' || c.status === 'PREVIEWED';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block text-sm">{c.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {c.head_count || 'All'} Head(s) included
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800">
                          {new Date(c.period_start).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          -{' '}
                          {new Date(c.period_end).toLocaleDateString([], {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-rose-700">
                        {new Date(c.due_date).toLocaleDateString([], {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={isIssued ? 'default' : 'neutral'}
                          className="text-[11px] font-semibold"
                        >
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-[11px]">
                        <div>
                          <span className="text-slate-400">Gen by: </span>
                          <span className="font-semibold text-slate-700">
                            {c.generator_name || 'Admin'}
                          </span>
                        </div>
                        {c.approved_by && (
                          <div>
                            <span className="text-slate-400">Appr by: </span>
                            <span className="font-semibold text-emerald-700">
                              {c.approver_name || 'Approver'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {isDraft && (
                          <button
                            onClick={() => handleCommit(c.id)}
                            disabled={isCommitting && committingId === c.id}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 ml-auto"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            {isCommitting && committingId === c.id
                              ? 'Committing...'
                              : 'Commit & Issue'}
                          </button>
                        )}
                        {isIssued && (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            ✓ Issued on {new Date(c.issued_at).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal: New Bill Cycle Preview & Creation */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Generate Bill Cycle</h3>
                  <p className="text-xs text-slate-500">
                    Prepare maintenance bills for all flats and preview line items before commit.
                  </p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {!previewResult ? (
                <form onSubmit={handlePreview} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Cycle Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={cycleForm.name}
                      onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })}
                      placeholder="e.g. November 2026 Maintenance"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Period Start *
                      </label>
                      <input
                        type="date"
                        required
                        value={cycleForm.periodStart}
                        onChange={(e) =>
                          setCycleForm({ ...cycleForm, periodStart: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Period End *
                      </label>
                      <input
                        type="date"
                        required
                        value={cycleForm.periodEnd}
                        onChange={(e) => setCycleForm({ ...cycleForm, periodEnd: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Due Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={cycleForm.dueDate}
                        onChange={(e) => setCycleForm({ ...cycleForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  {/* Select Bill Heads */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Included Bill Heads ({cycleForm.headIds.length} selected)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {heads.map((h) => {
                        const checked = cycleForm.headIds.includes(h.id);
                        return (
                          <div
                            key={h.id}
                            onClick={() => toggleHead(h.id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition ${
                              checked
                                ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-semibold'
                                : 'bg-white border-slate-200 text-slate-600'
                            }`}
                          >
                            <span>{h.name_en || h.name}</span>
                            <span className="font-mono text-[10px]">
                              {formatPaise(h.rate_paise)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={previewLoading}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {previewLoading ? 'Generating Preview...' : 'Preview Calculation'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Preview Display */
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-blue-950 text-sm">Preview Calculation Ready</h4>
                      <p className="text-xs text-blue-800">
                        {previewResult.flatsCount} Flats will be billed across {previewResult.headsCount} heads.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Total Projected Bill</span>
                      <span className="text-xl font-bold text-slate-900">
                        {formatPaise(previewResult.totalAmountPaise || 0)}
                      </span>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th className="p-2.5">Flat</th>
                          <th className="p-2.5">Subtotal</th>
                          <th className="p-2.5">Tax</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewResult.sampleFlats?.map((sf: any, i: number) => (
                          <tr key={i}>
                            <td className="p-2.5 font-semibold text-slate-800">Flat {sf.flatNumber}</td>
                            <td className="p-2.5">{formatPaise(sf.subtotalPaise)}</td>
                            <td className="p-2.5">{formatPaise(sf.taxPaise)}</td>
                            <td className="p-2.5 font-bold text-slate-900 text-right">
                              {formatPaise(sf.totalPaise)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setPreviewResult(null)}
                      className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                    >
                      ← Back to Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCommit(previewResult.cycleId)}
                      disabled={isCommitting}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isCommitting ? 'Committing...' : 'Commit & Issue Bills'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
