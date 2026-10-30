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
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Scale,
  RefreshCw,
  ArrowLeft,
  Building,
  FileCheck,
  Lock,
} from 'lucide-react';

export default function CashDayClosePage() {
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Close Session Form states
  const [countedRupees, setCountedRupees] = useState('');
  const [varianceNote, setVarianceNote] = useState('');
  const [depositedRupees, setDepositedRupees] = useState('');
  const [depositRef, setDepositRef] = useState('');
  const [depositOn, setDepositOn] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadSession = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await api.getCurrentCashSession();
      setCurrentSession(data);
    } catch (err: any) {
      console.warn('Failed to load current session', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const handleOpenSession = async () => {
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.openCashSession();
      setCurrentSession(res);
      setActionSuccess('New cash session opened successfully!');
    } catch (err: any) {
      setActionError(err.message || 'Failed to open session.');
    } finally {
      setSubmitting(false);
    }
  };

  const expectedPaise = Number(currentSession?.total_collected_paise || 0);
  const countedPaise = Math.round(Number(countedRupees || 0) * 100);
  const variancePaise = expectedPaise - countedPaise;

  const handleCloseSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSession) return;
    if (variancePaise !== 0 && !varianceNote.trim()) {
      setActionError('Variance detected! A variance explanation note is mandatory.');
      return;
    }

    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.closeCashSession({
        sessionId: currentSession.id,
        countedPaise,
        varianceNote: varianceNote || undefined,
        depositedPaise: depositedRupees ? Math.round(Number(depositedRupees) * 100) : undefined,
        depositRef: depositRef || undefined,
        depositOn: depositOn ? new Date(depositOn).toISOString() : undefined,
      });
      setActionSuccess('Cash session closed. Awaiting Chairman/Committee reconciliation.');
      setCountedRupees('');
      setVarianceNote('');
      setDepositedRupees('');
      setDepositRef('');
      loadSession();
    } catch (err: any) {
      setActionError(err.message || 'Failed to close cash session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReconcile = async (sessionId: string) => {
    if (!confirm('Reconcile and sign off on this closed cash session?')) return;
    setSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.reconcileCashSession(sessionId);
      setActionSuccess('Session reconciled successfully!');
      loadSession();
    } catch (err: any) {
      setActionError(err.message || 'Reconciliation failed. Note: Cashier cannot reconcile self.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Clock className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Daily Cash Close & Reconciliation</h1>
                <p className="text-sm text-slate-500">
                  Count physical drawer cash, log bank deposit slips, and enforce Maker-Checker reconciliation.
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
              onClick={loadSession}
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
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            {actionError}
          </div>
        )}

        {/* Current Session Panel */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
            <p className="font-medium">Loading session status...</p>
          </div>
        ) : !currentSession || currentSession.status !== 'OPEN' ? (
          <Card className="border border-slate-200 shadow-sm text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Active Cash Session</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Open a new cash session at the start of your shift to begin accepting cash payments at the counter.
              </p>
            </div>
            <button
              onClick={handleOpenSession}
              disabled={submitting}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm rounded-xl transition shadow-sm inline-flex items-center gap-2"
            >
              <DollarSign className="w-4 h-4" />
              {submitting ? 'Opening Session...' : 'Open New Cash Session'}
            </button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Session Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border border-slate-200 shadow-sm bg-emerald-50/40">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-slate-500">Expected Drawer Cash</span>
                  <h3 className="text-2xl font-bold text-emerald-800 mt-1">
                    {formatPaise(expectedPaise)}
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Calculated from {currentSession.payments_count || 0} recorded receipts
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-slate-500">Shift Started</span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {new Date(currentSession.opened_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </h3>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {new Date(currentSession.opened_at).toLocaleDateString()}
                  </span>
                </CardContent>
              </Card>

              <Card className="border border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-slate-500">Session Status</span>
                  <div className="mt-1">
                    <Badge variant="default" className="text-xs font-semibold bg-emerald-600">
                      ACTIVE (OPEN)
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Cashier ID: {currentSession.collector_id?.slice(0, 8)}...
                  </span>
                </CardContent>
              </Card>
            </div>

            {/* Shift Close Form */}
            <Card className="border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  Perform Daily Cash Close
                </CardTitle>
                <CardDescription className="text-xs">
                  Count all currency notes and coins physically present in the cash drawer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCloseSession} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Physically Counted Cash (₹) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        required
                        value={countedRupees}
                        onChange={(e) => setCountedRupees(e.target.value)}
                        placeholder="e.g. 24500"
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-base font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Variance Amount
                      </label>
                      <div
                        className={`px-3 py-2.5 rounded-xl border font-mono font-bold text-sm ${
                          variancePaise === 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {countedRupees ? formatPaise(Math.abs(variancePaise)) : '₹ 0.00'}{' '}
                        {countedRupees && variancePaise > 0
                          ? '(Shortage)'
                          : countedRupees && variancePaise < 0
                          ? '(Excess)'
                          : '(Balanced)'}
                      </div>
                    </div>
                  </div>

                  {/* Mandatory Variance Note if variance !== 0 */}
                  {variancePaise !== 0 && countedRupees && (
                    <div>
                      <label className="block text-xs font-semibold text-rose-700 mb-1">
                        Mandatory Variance Explanation Note *
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={varianceNote}
                        onChange={(e) => setVarianceNote(e.target.value)}
                        placeholder="Explain any physical cash shortage or excess in detail for audit review..."
                        className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none bg-rose-50/30"
                      />
                    </div>
                  )}

                  {/* Bank Deposit Record */}
                  <div className="pt-2 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">
                      Bank Deposit Slip Information (Optional if depositing next day)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Amount Deposited (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={depositedRupees}
                          onChange={(e) => setDepositedRupees(e.target.value)}
                          placeholder="e.g. 24000"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Bank Deposit Slip Ref / UTR
                        </label>
                        <input
                          type="text"
                          value={depositRef}
                          onChange={(e) => setDepositRef(e.target.value)}
                          placeholder="e.g. CHQ/SLIP-98124"
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Deposit Date
                        </label>
                        <input
                          type="date"
                          value={depositOn}
                          onChange={(e) => setDepositOn(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="submit"
                      disabled={submitting || !countedRupees}
                      className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      {submitting ? 'Closing Session...' : 'Close & Submit for Reconciliation'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

