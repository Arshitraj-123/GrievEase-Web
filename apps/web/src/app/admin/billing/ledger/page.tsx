'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  FileText,
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Building,
  Lock,
  History,
} from 'lucide-react';

function FlatLedgerContent() {
  const searchParams = useSearchParams();
  const initialFlatId = searchParams.get('flatId') || '';

  const [flatQuery, setFlatQuery] = useState(initialFlatId);
  const [statement, setStatement] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLedger = async (targetId: string) => {
    if (!targetId.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setVerificationResult(null);
    try {
      const data = await api.getFlatLedger(targetId.trim());
      setStatement(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load flat statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialFlatId) {
      loadLedger(initialFlatId);
    }
  }, [initialFlatId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLedger(flatQuery);
  };

  const handleVerifyChain = async () => {
    if (!statement?.flat?.id) return;
    setVerifying(true);
    try {
      const res = await api.verifyFlatLedger(statement.flat.id);
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        error: err.message || 'Cryptographic chain verification failed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Flat Ledger Explorer</h1>
                <p className="text-sm text-slate-500">
                  Inspect append-only accounting entries and verify cryptographic hash chains.
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

        {/* Search Bar */}
        <Card className="border border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={flatQuery}
                  onChange={(e) => setFlatQuery(e.target.value)}
                  placeholder="Enter Flat Number or Flat ID (e.g. 101, A-202)..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !flatQuery.trim()}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {loading ? 'Searching...' : 'Explore Ledger'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Error message */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Statement & Hash Chain Content */}
        {statement && (
          <div className="space-y-6">
            {/* Summary Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                  Flat Account Statement
                </span>
                <h2 className="text-2xl font-bold mt-1">
                  Flat {statement.flat?.flat_number || flatQuery}
                  {statement.flat?.wing_name ? ` (${statement.flat.wing_name} Wing)` : ''}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Occupancy: {statement.flat?.occupancy || 'Owner Occupied'} • Area: {statement.flat?.area_sqft || '—'} sq.ft
                </p>
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                <span className="text-xs text-slate-400">Derived Net Balance</span>
                <span
                  className={`text-3xl font-mono font-bold ${
                    statement.balancePaise > 0
                      ? 'text-rose-400'
                      : statement.balancePaise < 0
                      ? 'text-emerald-400'
                      : 'text-white'
                  }`}
                >
                  {formatPaise(statement.balancePaise)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {statement.balancePaise > 0
                    ? 'Total Dues Outstanding'
                    : statement.balancePaise < 0
                    ? 'Advance Balance Credited'
                    : 'Fully Settled (Nil Dues)'}
                </span>
              </div>
            </div>

            {/* Cryptographic Verification Action Bar */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-blue-950">Append-Only Hash Chain Integrity</h4>
                  <p className="text-[11px] text-blue-800">
                    Each ledger entry contains SHA-256(prev_hash + entry_data). Database triggers prevent any in-place UPDATE or DELETE.
                  </p>
                </div>
              </div>
              <button
                onClick={handleVerifyChain}
                disabled={verifying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                {verifying ? 'Verifying Chain...' : 'Verify Cryptographic Chain'}
              </button>
            </div>

            {/* Verification Result Banner */}
            {verificationResult && (
              <div>
                {verificationResult.valid ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold">Hash Chain Cryptographically Intact</p>
                      <p className="text-emerald-800">
                        Zero tampering detected across all {statement.entries?.length || 0} ledger sequence rows from genesis.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-rose-50 border border-rose-300 text-rose-950 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                    <div className="text-xs">
                      <p className="font-bold">Cryptographic Tampering Detected!</p>
                      <p className="text-rose-800">
                        {verificationResult.error || 'Hash chain sequence mismatch detected in ledger records.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Entries Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  Chronological Ledger Entries ({statement.entries?.length || 0})
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Seq</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Narration</th>
                      <th className="px-4 py-3 text-right">Debit (₹)</th>
                      <th className="px-4 py-3 text-right">Credit (₹)</th>
                      <th className="px-4 py-3 font-mono">Hash Stamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {statement.entries?.map((e: any) => {
                      const isDebit = e.direction === 'DEBIT';
                      return (
                        <tr key={e.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-400">
                            #{e.seq}
                          </td>
                          <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                            {new Date(e.created_at).toLocaleDateString([], {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {e.entry_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-800">{e.narration}</td>
                          <td className="px-4 py-3 text-right font-bold text-rose-700">
                            {isDebit ? formatPaise(e.amount_paise) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-700">
                            {!isDebit ? formatPaise(e.amount_paise) : '—'}
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {e.hash?.slice(0, 12)}...
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

export default function FlatLedgerExplorerPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
          Loading flat ledger...
        </div>
      }
    >
      <FlatLedgerContent />
    </React.Suspense>
  );
}

