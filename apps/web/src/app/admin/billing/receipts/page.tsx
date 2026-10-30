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
  Receipt,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Printer,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export default function AdminReceiptsRegisterPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await api.listAdminPayments();
      if (Array.isArray(data)) setPayments(data);
    } catch (err: any) {
      console.warn('Failed to load payments register', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.receipt_no && p.receipt_no.toLowerCase().includes(q)) ||
      (p.flat_number && p.flat_number.toLowerCase().includes(q)) ||
      (p.received_from_name && p.received_from_name.toLowerCase().includes(q)) ||
      (p.collector_name && p.collector_name.toLowerCase().includes(q))
    );
  });

  return (
    <ShellLayout activeNav="admin-billing">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Receipt className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Digital Receipts Register</h1>
                <p className="text-sm text-slate-500">
                  Sequential cash collection receipts with tamper-evident digital hashes.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/billing/verify"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition"
            >
              <FileCheck className="w-4 h-4" />
              Verify Receipt
            </Link>
            <Link
              href="/admin/billing/collect"
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              Record Cash
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by receipt #, flat, collector..."
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 w-full"
            />
          </div>
          <button
            onClick={loadPayments}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-3" />
            <p className="font-medium">Loading receipts register...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No receipts found</p>
            <p className="text-xs text-slate-400 mt-1">
              Cash payments recorded at the office will appear in this register.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Receipt #</th>
                  <th className="px-5 py-3.5">Flat / Payer</th>
                  <th className="px-5 py-3.5">Date Received</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Collector</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {p.receipt_no}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 block">
                        Flat {p.wing_name ? `${p.wing_name}-` : ''}
                        {p.flat_number}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {p.received_from_name || 'Resident'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      {new Date(p.received_on).toLocaleDateString([], {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700 text-sm">
                      {formatPaise(p.amount_paise)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{p.collector_name}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={p.status === 'RECORDED' ? 'default' : 'danger'}
                        className="text-[10px]"
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/app/payments/${p.id}`}
                        target="_blank"
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold inline-flex items-center gap-1 text-xs transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
