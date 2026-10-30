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
  FolderPlus,
  Scale,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  RefreshCw,
} from 'lucide-react';

export default function OpeningBalancesMigrationPage() {
  const [csvText, setCsvText] = useState(
    'flat_number, amount_rupees, direction, narration\n101, 2500, DEBIT, Legacy maintenance arrears\n102, 1000, CREDIT, Legacy maintenance advance\n103, 0, DEBIT, Nil opening balance',
  );
  const [preview, setPreview] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      // Parse CSV text into row objects
      const lines = csvText.trim().split('\n');
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [flatNumber, amountRupees, direction, narration] = line
          .split(',')
          .map((s) => s.trim());

        if (flatNumber) {
          rows.push({
            flatNumber,
            amountPaise: Math.round(Number(amountRupees || 0) * 100),
            direction: (direction || 'DEBIT').toUpperCase(),
            narration: narration || 'Opening balance migration',
          });
        }
      }

      if (rows.length === 0) {
        setActionError('No valid rows parsed from input.');
        return;
      }

      const res = await api.previewOpeningBalances(rows);
      setPreview(res);
    } catch (err: any) {
      setActionError(err.message || 'Failed to generate opening balances preview.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (
      !confirm(
        'Commit these opening balances to the immutable society ledger? This will create opening ledger rows for each flat.',
      )
    ) {
      return;
    }

    setCommitting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.commitOpeningBalances({
        items: preview.items || [],
        creatorId: preview.creatorId || 'admin',
      });
      setActionSuccess(`Opening balances committed successfully! ${res.committedCount || ''} ledger entries created.`);
      setPreview(null);
    } catch (err: any) {
      setActionError(
        err.message ||
          'Failed to commit opening balances. Note: Maker-Checker requires a separate approver.',
      );
    } finally {
      setCommitting(false);
    }
  };

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <FolderPlus className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Opening Balances Migration</h1>
                <p className="text-sm text-slate-500">
                  Migrate historical dues and advances into the hash-chained ledger with Maker-Checker sign-off.
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/admin/billing"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Overview
          </Link>
        </div>

        {/* Maker-Checker Alert */}
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-950 rounded-2xl flex items-start gap-3">
          <Scale className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">Maker-Checker Policy for Opening Balances</p>
            <p className="text-purple-800">
              Opening balance entries establish the starting point for every flat's ledger chain.
              The person preparing this CSV import cannot sign off on the commit.
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

        {/* CSV Input Form */}
        {!preview ? (
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                Paste Opening Balances CSV
              </CardTitle>
              <CardDescription className="text-xs">
                Format: <code>flat_number, amount_rupees, direction (DEBIT or CREDIT), narration</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreview} className="space-y-4">
                <textarea
                  rows={8}
                  required
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-4 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-400">
                    Use DEBIT for historical dues; CREDIT for prepaid advances.
                  </span>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {loading ? 'Validating CSV...' : 'Preview Balances'}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Preview Result */
          <div className="space-y-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Opening Balances Preview</h3>
                  <p className="text-xs text-slate-500">
                    {preview.items?.length || 0} flats parsed. Review totals before committing to ledger.
                  </p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  Edit Input
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-xs text-rose-800 font-semibold block">Total Opening Debits</span>
                  <span className="text-2xl font-bold text-rose-900">
                    {formatPaise(preview.totalDebitPaise || 0)}
                  </span>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-xs text-emerald-800 font-semibold block">Total Opening Credits</span>
                  <span className="text-2xl font-bold text-emerald-900">
                    {formatPaise(preview.totalCreditPaise || 0)}
                  </span>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Flat</th>
                      <th className="p-2.5">Direction</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5">Narration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.items?.map((item: any, i: number) => (
                      <tr key={i}>
                        <td className="p-2.5 font-bold text-slate-800">Flat {item.flatNumber}</td>
                        <td className="p-2.5">
                          <Badge
                            variant={item.direction === 'DEBIT' ? 'danger' : 'default'}
                            className="text-[10px]"
                          >
                            {item.direction}
                          </Badge>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatPaise(item.amountPaise)}
                        </td>
                        <td className="p-2.5 text-slate-500">{item.narration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={committing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {committing ? 'Committing...' : 'Commit Opening Balances'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
