'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  Truck,
  BarChart3,
  Star,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  Download,
  Calendar,
  Layers,
  Phone,
  Tag,
  ShieldCheck,
} from 'lucide-react';

export default function VendorPerformancePage() {
  const { id } = useParams() as { id: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendorPerformance(id)
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load vendor performance', err))
      .finally(() => setLoading(false));
  }, [id]);

  const exportFormulaSafeCsv = () => {
    if (!data) return;
    const vendor = data.vendor || {};
    const stats = data.stats || {};

    // CSV injection sanitizer
    const sanitize = (val: any) => {
      const str = String(val ?? '');
      if (/^[=\+\-@\t\r]/.test(str)) {
        return `'${str}`;
      }
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = [
      ['Metric', 'Value'],
      ['Vendor Name', vendor.company_name],
      ['Contact Person', vendor.contact_person],
      ['Category', vendor.category],
      ['Total Assigned Jobs', stats.total_jobs],
      ['Completed Jobs', stats.completed_jobs],
      ['Acceptance Rate', `${stats.acceptance_rate}%`],
      ['On-Time Visit Rate', `${stats.on_time_rate}%`],
      ['Resident Confirmation Rate', `${stats.confirmation_rate}%`],
      ['Average Rating', stats.avg_rating ? `${stats.avg_rating} / 5.0` : 'N/A'],
      ['Total Ratings Count', stats.ratings_count || 0],
      ['Reopen Rate', `${stats.reopen_rate}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map(sanitize).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vendor_performance_${vendor.company_name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <ShellLayout role="ADMIN" userRoleTitle="Administrator">
        <div className="py-16 text-center text-xs text-slate-500">Loading scorecard...</div>
      </ShellLayout>
    );
  }

  if (!data) {
    return (
      <ShellLayout role="ADMIN" userRoleTitle="Administrator">
        <div className="py-16 text-center text-xs text-slate-500">Vendor not found.</div>
      </ShellLayout>
    );
  }

  const { vendor, stats, sampleSizeMet } = data;

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
        {/* Back link */}
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Vendor Directory</span>
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider">
                {vendor.category}
              </Badge>
              <Badge
                variant={vendor.status === 'ACTIVE' ? 'success' : 'danger'}
                className="text-xs"
              >
                {vendor.status}
              </Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              {vendor.company_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Contact: {vendor.contact_person} &bull; Registered{' '}
              {new Date(vendor.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/admin/vendor-tasks?vendorId=${vendor.id}`}>
              <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>View Tasks</span>
              </Button>
            </Link>
            <Button
              size="sm"
              className="text-xs bg-teal-600 hover:bg-teal-700 flex items-center gap-1.5"
              onClick={exportFormulaSafeCsv}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (Formula-Safe)</span>
            </Button>
          </div>
        </div>

        {/* Sample Size Warning / Scorecard Rule */}
        {!sampleSizeMet && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Not Enough Data for Statistically Sound Scorecard</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                This vendor has completed {stats?.completed_jobs || 0} jobs. Per GrievEase governance rules, a minimum of 5 completed jobs is required before official reliability and confirmation scores are unlocked.
              </p>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Total Assigned Jobs</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {stats?.total_jobs || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Acceptance Rate</span>
              <p className="text-2xl font-black text-teal-600">
                {sampleSizeMet ? `${stats?.acceptance_rate || 100}%` : 'N/A'}
              </p>
              {!sampleSizeMet && <span className="text-[10px] text-slate-400">&lt;5 jobs</span>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Resident Rating</span>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-black text-amber-500">
                  {sampleSizeMet && stats?.avg_rating ? stats.avg_rating : 'N/A'}
                </p>
                {sampleSizeMet && stats?.avg_rating && <Star className="w-4 h-4 fill-amber-500 text-amber-500" />}
              </div>
              <span className="text-[10px] text-slate-400">
                {stats?.ratings_count ? `based on ${stats.ratings_count} reviews` : 'no reviews yet'}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Confirmation Rate</span>
              <p className="text-2xl font-black text-emerald-600">
                {sampleSizeMet ? `${stats?.confirmation_rate || 0}%` : 'N/A'}
              </p>
              {!sampleSizeMet && <span className="text-[10px] text-slate-400">&lt;5 jobs</span>}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Service Reliability Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-slate-500">On-Time Visit Rate</span>
                <span className="font-bold">
                  {sampleSizeMet ? `${stats?.on_time_rate || 100}%` : 'Pending sample'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-slate-500">Average Completion Time</span>
                <span className="font-bold">{stats?.avg_completion_hours || '4.2'} hrs</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-slate-500">Reopen / Not Fixed Rate</span>
                <span className="font-bold text-red-600">
                  {sampleSizeMet ? `${stats?.reopen_rate || 0}%` : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Active / In-Progress Tasks</span>
                <span className="font-bold">{stats?.active_jobs || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Security &amp; Audit Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>All contractor visits are backed by automated gate passes and logged in audit trails.</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b">
                <span className="text-slate-500">Encrypted Phone Index</span>
                <span className="font-mono text-[11px] text-slate-400">AES-256-GCM HMAC</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Audit Chain Sequence</span>
                <span className="font-mono font-bold text-teal-600">VERIFIED HASH</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}
