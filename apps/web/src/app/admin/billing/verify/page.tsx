'use client';

import React, { useState } from 'react';
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
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  FileCheck,
  Building,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export default function ReceiptVerificationPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setHasSearched(true);
    try {
      const data = await api.verifyReceipt(query.trim());
      setResult(data);
    } catch (err: any) {
      setResult({ matched: false, error: err.message || 'Receipt verification failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Receipt Verification Desk</h1>
                <p className="text-sm text-slate-500">
                  Verify the authenticity of physical or digital cash receipts against the society ledger.
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/billing/receipts"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Receipts Register
          </Link>
        </div>

        {/* Verification Input Box */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Enter Receipt Reference
            </CardTitle>
            <CardDescription className="text-xs">
              Enter the receipt number (e.g. RC/2026-27/000001) or digital verification hash stamp.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. RC/2026-27/000001 or hash..."
                className="flex-1 px-4 py-3 border border-slate-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Verifying...' : 'Verify Receipt'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Verification Result */}
        {hasSearched && (
          <div>
            {result?.matched ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl shadow-sm space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-emerald-950">
                      Genuine Digital Receipt Verified
                    </h3>
                    <p className="text-xs text-emerald-700">
                      This receipt matches the society’s immutable append-only ledger.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-400 block">Receipt #</span>
                    <span className="font-mono font-bold text-slate-900">{result.receiptNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Flat / Unit</span>
                    <span className="font-semibold text-slate-800">Flat {result.flatNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Amount Paid</span>
                    <span className="font-bold text-emerald-700 text-sm">
                      {formatPaise(result.amountPaise)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Receipt Status</span>
                    <Badge variant={result.status === 'RECORDED' ? 'default' : 'danger'}>
                      {result.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-rose-50 border-2 border-rose-300 rounded-2xl shadow-sm flex items-center gap-4 text-rose-900 animate-in fade-in">
                <XCircle className="w-8 h-8 text-rose-600 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold">No Matching Receipt Found</h3>
                  <p className="text-xs text-rose-700 mt-0.5">
                    No receipt exists with reference "{query}". Please check the number or contact the society office.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
