'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { formatPaise, amountInWords } from '@grievease/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  DollarSign,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  ArrowLeft,
  RefreshCw,
  Plus,
  Clock,
  Building,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function CashCollectionDeskPage() {
  const router = useRouter();
  const [session, setSession] = useState<any | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [openingSession, setOpeningSession] = useState(false);

  // Form states
  const [flatSearch, setFlatSearch] = useState('');
  const [selectedFlat, setSelectedFlat] = useState<any | null>(null);
  const [flatStatement, setFlatStatement] = useState<any | null>(null);
  const [loadingStatement, setLoadingStatement] = useState(false);

  const [amountRupees, setAmountRupees] = useState('');
  const [payerName, setPayerName] = useState('');
  const [allocationStrategy, setAllocationStrategy] = useState<'OLDEST_FIRST' | 'SPECIFIC_BILL' | 'ADVANCE'>('OLDEST_FIRST');
  const [selectedBillId, setSelectedBillId] = useState<string>('');
  const [paymentNote, setPaymentNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const checkSession = async () => {
    setCheckingSession(true);
    try {
      const res = await api.getCurrentCashSession();
      setSession(res);
    } catch (err: any) {
      console.warn('Failed to check session', err);
    } finally {
      setCheckingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const handleOpenSession = async () => {
    setOpeningSession(true);
    setErrorMsg(null);
    try {
      const res = await api.openCashSession();
      setSession(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to open cashier session.');
    } finally {
      setOpeningSession(false);
    }
  };

  const handleSearchFlat = async (flatIdToSearch: string) => {
    if (!flatIdToSearch) return;
    setLoadingStatement(true);
    setErrorMsg(null);
    setSelectedFlat({ id: flatIdToSearch });
    try {
      const data = await api.getFlatLedger(flatIdToSearch);
      setFlatStatement(data);
      if (data?.flat) {
        setSelectedFlat(data.flat);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not load flat dues statement.');
    } finally {
      setLoadingStatement(false);
    }
  };

  const amountPaise = Math.round(Number(amountRupees || 0) * 100);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlat?.id) {
      setErrorMsg('Please select a flat first.');
      return;
    }
    if (amountPaise <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setDuplicateWarning(null);

    try {
      const res = await api.recordCashPayment({
        flatId: selectedFlat.id,
        amountPaise,
        receivedFromName: payerName || undefined,
        allocationStrategy,
        specificBillId: allocationStrategy === 'SPECIFIC_BILL' ? selectedBillId : undefined,
        note: paymentNote || undefined,
      });

      setSuccessReceipt(res);
      // Reset form
      setAmountRupees('');
      setPayerName('');
      setPaymentNote('');
      checkSession();
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('duplicate')) {
        setDuplicateWarning(err.message);
      } else {
        setErrorMsg(err.message || 'Failed to record cash payment.');
      }
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
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <DollarSign className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Cash Collection Desk</h1>
                <p className="text-sm text-slate-500">
                  Fast keyboard-first counter desk for manual cash maintenance receipts.
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
          </div>
        </div>

        {/* Cash Session Status Banner */}
        {checkingSession ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            Checking cashier cash session status...
          </div>
        ) : !session || session.status !== 'OPEN' ? (
          <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-950 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-base">Cashier Session Not Open</h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Anti-fraud policy requires an active, open cash session before collecting cash at the office.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenSession}
              disabled={openingSession}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              {openingSession ? 'Opening Session...' : 'Open Today’s Cash Session'}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-emerald-900">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold">Session Active:</span>
              <span>Opened {new Date(session.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-slate-400">•</span>
              <span>Collected Today: <strong>{formatPaise(session.total_collected_paise || 0)}</strong> ({session.payments_count || 0} receipts)</span>
            </div>
            <Link
              href="/admin/billing/day-close"
              className="text-emerald-700 hover:underline font-bold"
            >
              Close Shift →
            </Link>
          </div>
        )}

        {/* Success Receipt Banner */}
        {successReceipt && (
          <div className="p-6 bg-emerald-600 text-white rounded-2xl shadow-lg space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-200" />
                <div>
                  <h3 className="text-xl font-bold">Payment Successfully Recorded</h3>
                  <p className="text-xs text-emerald-100">
                    Gapless sequential receipt issued and posted to flat ledger.
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-white border-white/50 text-xs font-mono font-bold">
                {successReceipt.receiptNo}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-700/60 p-4 rounded-xl text-xs">
              <div>
                <span className="text-emerald-200 block">Amount Collected</span>
                <span className="text-base font-bold text-white">
                  {formatPaise(successReceipt.amountPaise)}
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block">Flat / Unit</span>
                <span className="text-base font-bold text-white">
                  {successReceipt.flatNumber || 'Flat'}
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block">Remaining Dues</span>
                <span className="text-base font-bold text-white">
                  {formatPaise(successReceipt.remainingBalancePaise || 0)}
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block">Digital Hash</span>
                <span className="font-mono text-[11px] text-emerald-200 block truncate">
                  {successReceipt.receiptHash || 'Verified'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/app/payments/${successReceipt.id}`}
                target="_blank"
                className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                Print / View Receipt
              </Link>
              <button
                onClick={() => setSuccessReceipt(null)}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Collect Next Payment
              </button>
            </div>
          </div>
        )}

        {/* Duplicate Warning */}
        {duplicateWarning && (
          <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Duplicate Payment Warning</p>
              <p>{duplicateWarning}</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Collection Form (enabled only if session is OPEN) */}
        {session?.status === 'OPEN' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form */}
            <div className="md:col-span-2 space-y-4">
              <Card className="border border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Resident Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    {/* Flat search input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Search Flat / Unit Number *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={flatSearch}
                          onChange={(e) => setFlatSearch(e.target.value)}
                          placeholder="e.g. 101, A-202, B-304..."
                          className="flex-1 px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSearchFlat(flatSearch)}
                          disabled={loadingStatement || !flatSearch.trim()}
                          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Search className="w-3.5 h-3.5" />
                          {loadingStatement ? 'Loading...' : 'Find Flat'}
                        </button>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cash Amount Received (₹) *
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={amountRupees}
                        onChange={(e) => setAmountRupees(e.target.value)}
                        placeholder="e.g. 3500"
                        className="w-full px-4 py-3 border-2 border-emerald-500/40 rounded-xl text-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      {amountPaise > 0 && (
                        <p className="text-xs text-slate-500 mt-1 italic">
                          Amount in words: {amountInWords(amountPaise)}
                        </p>
                      )}
                    </div>

                    {/* Payer Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Received From (Resident / Representative Name)
                      </label>
                      <input
                        type="text"
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="e.g. Ramesh Sharma"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    {/* Allocation Strategy */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Payment Allocation
                        </label>
                        <select
                          value={allocationStrategy}
                          onChange={(e) => setAllocationStrategy(e.target.value as any)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                        >
                          <option value="OLDEST_FIRST">Oldest Unpaid Bill First (Default)</option>
                          <option value="SPECIFIC_BILL">Specific Bill Cycle</option>
                          <option value="ADVANCE">Advance Maintenance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Collector Note
                        </label>
                        <input
                          type="text"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="Optional memo..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || amountPaise <= 0 || !selectedFlat}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 min-h-[48px]"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      {submitting ? 'Recording & Issuing...' : 'Record Cash & Print Receipt'}
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Right 1 Col: Flat Ledger Summary */}
            <div className="space-y-4">
              <Card className="border border-slate-200 shadow-sm bg-slate-50/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Flat Dues Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedFlat ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-400 block">Selected Unit</span>
                        <h4 className="text-lg font-bold text-slate-900">
                          Flat {selectedFlat.flat_number || selectedFlat.id}
                        </h4>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-400 block">Current Outstanding</span>
                        <h4 className="text-2xl font-bold text-rose-700">
                          {formatPaise(flatStatement?.balancePaise || 0)}
                        </h4>
                      </div>

                      {flatStatement?.unpaidBills && flatStatement.unpaidBills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-600 uppercase">
                            Unpaid Bills ({flatStatement.unpaidBills.length})
                          </span>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {flatStatement.unpaidBills.map((b: any) => (
                              <div
                                key={b.id}
                                className="p-2 bg-white rounded-lg border border-slate-100 text-xs flex justify-between"
                              >
                                <span className="font-semibold text-slate-800">
                                  {b.bill_no}
                                </span>
                                <span className="font-bold text-rose-600">
                                  {formatPaise(b.total_paise)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      <Building className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      Enter a flat number on the left to see current balance and unpaid bills.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

