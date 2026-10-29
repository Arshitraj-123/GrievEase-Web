'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import {
  GitCommit,
  ShieldCheck,
  ShieldAlert,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Calendar,
  Terminal,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [latestHash, setLatestHash] = useState<string>('');

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Verification State
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean;
    brokenAtSeq?: number;
    count?: number;
    headHash?: string;
  } | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getFilteredAuditLogs({
        page,
        limit: 25,
        action: actionFilter || undefined,
        entityType: entityTypeFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setLogs(Array.isArray(res.items) ? res.items : []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    api.getLatestAuditHash().then((res) => {
      if (res && res.hash) setLatestHash(res.hash);
    }).catch(() => {});
  }, [page]);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const res = await api.verifyAuditChain();
      setVerifyResult(res);
      if (res.headHash) setLatestHash(res.headHash);
    } catch (err: any) {
      setVerifyResult({ valid: false, brokenAtSeq: 1 });
    } finally {
      setVerifying(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const csvDownloadUrl = api.exportAuditCsvUrl(fromDate || undefined, toDate || undefined);

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Audit & Verification">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs">
                SHA-256 Hash Chain • Immutable Ledger
              </Badge>
              <Badge className="bg-slate-800 text-slate-300 text-xs">
                Formula-Safe CSV
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Cryptographic Audit Trail
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Verify chain integrity, review unalterable event snapshots, and export audited compliance logs.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleVerifyChain}
              disabled={verifying}
              className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all border border-purple-400/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{verifying ? 'Verifying Chain...' : 'Verify Cryptographic Chain'}</span>
            </button>

            <a
              href={csvDownloadUrl}
              download
              className="min-h-[48px] px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-2 border border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Verification Status Banner */}
        {verifyResult && (
          <div
            className={`p-4 sm:p-5 rounded-3xl border-2 flex items-start gap-3.5 shadow-md ${
              verifyResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-900 dark:text-rose-100'
            }`}
          >
            {verifyResult.valid ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="text-sm font-black">
                {verifyResult.valid
                  ? 'Audit Chain Intact & Cryptographically Verified'
                  : 'CRITICAL WARNING: Tampered Audit Chain Detected'}
              </h3>
              <p className="text-xs leading-relaxed font-medium">
                {verifyResult.valid
                  ? `Successfully validated ${verifyResult.count || 'all'} sequential entries without breakage. Head hash: ${verifyResult.headHash?.slice(0, 16)}...`
                  : `Chain verification failed at sequence #${verifyResult.brokenAtSeq}. An entry was modified or inserted out of order.`}
              </p>
            </div>
          </div>
        )}

        {/* Latest Head Hash & CLI Verification Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">
              Latest SHA-256 Head Hash (Root of Trust)
            </span>
            <code className="font-mono text-slate-800 dark:text-purple-300 font-bold break-all">
              {latestHash || 'Calculating...'}
            </code>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <Terminal className="w-4 h-4 text-teal-600" />
            <span>CLI command: <code>pnpm --filter @grievease/api audit:verify</code></span>
          </div>
        </div>

        {/* Filter Bar */}
        <form onSubmit={handleApplyFilter} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <input
            type="text"
            placeholder="Action (e.g. GRIEVANCE_STATUS)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs min-h-[40px]"
          />

          <input
            type="text"
            placeholder="Entity (e.g. grievance)"
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs min-h-[40px]"
          />

          <input
            type="date"
            placeholder="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs min-h-[40px]"
          />

          <input
            type="date"
            placeholder="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs min-h-[40px]"
          />

          <Button
            type="submit"
            className="min-h-[40px] rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
          >
            Apply Filters
          </Button>
        </form>

        {/* Log Entries Table */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No audit records match the current filter range.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-xs space-y-1.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-600 text-[11px]">
                      #{log.seq}
                    </span>
                    <Badge variant="neutral" className="font-mono text-[10px]">
                      {log.action}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {log.entity_type}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>Actor: <span className="font-medium text-slate-800 dark:text-slate-300">{log.actor_role} ({log.actor_id?.slice(0, 8)}...)</span></div>
                  <div>Entity ID: <span className="font-mono text-slate-800 dark:text-slate-300">{log.entity_id?.slice(0, 12)}...</span></div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all space-y-0.5">
                  <div>Hash: {log.current_hash}</div>
                  <div className="text-slate-400">Prev: {log.previous_hash}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="min-h-[40px] px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 disabled:opacity-40 font-bold"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            type="button"
            disabled={logs.length < 25}
            onClick={() => setPage((p) => p + 1)}
            className="min-h-[40px] px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 disabled:opacity-40 font-bold"
          >
            Next
          </button>
        </div>
      </div>
    </ShellLayout>
  );
}
