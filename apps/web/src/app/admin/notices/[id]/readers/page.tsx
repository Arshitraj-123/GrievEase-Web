'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackNoticeReaders } from '@/lib/fallback-community';
import {
  ArrowLeft,
  Users,
  Eye,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function NoticeReadersPage() {
  const params = useParams();
  const noticeId = typeof params?.id === 'string' ? params.id : '';

  const [data, setData] = useState<any>(fallbackNoticeReaders);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'UNACKNOWLEDGED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReaders() {
      setIsLoading(true);
      try {
        const res = await api.getNoticeReaders(noticeId);
        if (res && res.totalAudience) {
          setData(res);
        } else {
          setData(fallbackNoticeReaders);
        }
      } catch {
        setData(fallbackNoticeReaders);
      } finally {
        setIsLoading(false);
      }
    }
    loadReaders();
  }, [noticeId]);

  const readPercent = data.totalAudience > 0 ? Math.round((data.readCount / data.totalAudience) * 100) : 0;
  const ackPercent = data.totalAudience > 0 ? Math.round((data.acknowledgedCount / data.totalAudience) * 100) : 0;

  const flatsList = data.unacknowledgedFlats || [];
  const filteredFlats = flatsList.filter((f: any) => {
    if (filter === 'UNREAD') return !f.hasRead;
    if (filter === 'UNACKNOWLEDGED') return !f.isAcknowledged;
    return true;
  });

  const handleExport = () => {
    const sanitizeFormula = (val: string | null | undefined): string => {
      if (!val) return '';
      const str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) return `'${str}`;
      return str;
    };

    const headers = ['Flat Number', 'Wing', 'Has Read', 'Has Acknowledged'];
    const rows = flatsList.map((f: any) => [
      sanitizeFormula(f.flatNumber),
      sanitizeFormula(f.wingName),
      f.hasRead ? 'YES' : 'NO',
      f.isAcknowledged ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Notice_Reader_Compliance_${noticeId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ShellLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/notices"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Noticeboard Management
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                Audience Compliance & Receipt Tracking
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Notice Readers & Acknowledgments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {data.title || 'Notice Readers Report'}
            </p>
          </div>

          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export Formula-Safe CSV</span>
          </button>
        </div>

        {/* Privacy Shield Alert */}
        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800">Resident Privacy Protection: </span>
            To protect individual resident privacy, this report displays apartment unit numbers only. Resident names, phone numbers, and individual device data are never disclosed or exported.
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Total Audience</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">{data.totalAudience}</span>
              <span className="text-xs text-slate-400">flats</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Read Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-teal-700">{readPercent}%</span>
              <span className="text-xs text-slate-400">({data.readCount} read)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Acknowledged</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600">{ackPercent}%</span>
              <span className="text-xs text-slate-400">({data.acknowledgedCount} ack)</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-medium text-slate-500">Pending Flat Action</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-600">{data.unacknowledgedCount}</span>
              <span className="text-xs text-slate-400">flats pending</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'ALL' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Pending Action ({flatsList.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'UNREAD' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Unread Only ({flatsList.filter((f: any) => !f.hasRead).length})
          </button>
          <button
            onClick={() => setFilter('UNACKNOWLEDGED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              filter === 'UNACKNOWLEDGED' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Unacknowledged ({flatsList.filter((f: any) => !f.isAcknowledged).length})
          </button>
        </div>

        {/* Table of pending flats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Units Pending Acknowledgment or Reading
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredFlats.map((flat: any, idx: number) => (
              <div
                key={idx}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">
                      Flat {flat.flatNumber}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{flat.wingName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                      flat.hasRead
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {flat.hasRead ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {flat.hasRead ? 'Read' : 'Unread'}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
                      flat.isAcknowledged
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {flat.isAcknowledged ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {flat.isAcknowledged ? 'Acknowledged' : 'Pending Ack'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
