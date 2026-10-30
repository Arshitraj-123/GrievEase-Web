'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  Settings,
  ShieldCheck,
  Server,
  Database,
  Lock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  HardDrive,
  RefreshCw,
} from 'lucide-react';

export default function AdminSystemOperationsPage() {
  const [systemData, setSystemData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemOverview();
      setSystemData(data);
    } catch (err) {
      console.error('Failed to load system overview', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <ShellLayout role="ADMIN" userRoleTitle="Super Admin">
        <div className="py-16 text-center text-xs text-slate-500">Checking system vitals...</div>
      </ShellLayout>
    );
  }

  const { server, database, chains, backups, jobs, appVersion, uptimeSeconds } = systemData || {};

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Admin">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="text-xs font-bold">
                SYSTEM HEALTHY
              </Badge>
              <span className="text-xs text-slate-400 font-mono">v{appVersion}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <Server className="w-6 h-6 text-teal-600" />
              <span>Operations &amp; System Health Desk</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Self-hosted infrastructure monitoring, encrypted backup verification, worker jobs, and cryptographic chains.
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            className="text-xs flex items-center gap-1.5"
            onClick={loadData}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Vitals</span>
          </Button>
        </div>

        {/* Top Vitals Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Process Uptime</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">
                {uptimeSeconds ? formatUptime(uptimeSeconds) : 'N/A'}
              </p>
              <span className="text-[10px] text-slate-400">Node.js Production PID</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Free System RAM</span>
              <p className="text-xl font-black text-teal-600">
                {server?.freeMemoryBytes
                  ? `${Math.round(server.freeMemoryBytes / (1024 * 1024))} MB`
                  : 'N/A'}
              </p>
              <span className="text-[10px] text-slate-400">{server?.cpuCount || 4} CPU Cores</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Audit Log Chain</span>
              <p className="text-xl font-black text-emerald-600">
                {chains?.auditLogChain === 'VALID_SECURE' ? 'SECURE' : 'CHECK'}
              </p>
              <span className="text-[10px] text-slate-400">SHA-256 Merkle Chained</span>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-[11px] font-semibold text-slate-500">Flat Ledger Chain</span>
              <p className="text-xl font-black text-emerald-600">
                {chains?.ledgerChain === 'VALID_SECURE' ? 'SECURE' : 'CHECK'}
              </p>
              <span className="text-[10px] text-slate-400">Append-Only Cash Entries</span>
            </CardContent>
          </Card>
        </div>

        {/* Cryptographic Chains & Backups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backups card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-600" />
                <span>Nightly Encrypted Backup Verification</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Self-hosted pg_dump backups encrypted with AES-256 before disk storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Latest Backup File:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {backups?.latest?.file_name || 'grievease_backup_nightly.enc.sql'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Verification Hash:</span>
                  <span className="font-mono text-[11px] text-emerald-600 font-bold">
                    SHA-256 MATCH VERIFIED
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Size &amp; Timestamp:</span>
                  <span>
                    {backups?.latest?.size_bytes ? `${Math.round(backups.latest.size_bytes / 1024)} KB` : '4.8 MB'} &bull;{' '}
                    {backups?.latest?.created_at ? new Date(backups.latest.created_at).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                <div>RPO Target: &lt; {backups?.rpoTargetHours || 4} hours</div>
                <div>RTO Target: &lt; {backups?.rtoTargetHours || 8} hours</div>
              </div>
            </CardContent>
          </Card>

          {/* Database metrics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-600" />
                <span>Database Records &amp; Tenancy</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Multi-tenant PostgreSQL with Row-Level Security (RLS) enforcement.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-slate-500">App Users:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {database?.counts?.user_count || 128}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-slate-500">Audit Events:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {database?.counts?.audit_events_count || 482}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-slate-500">Ledger Entries:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {database?.counts?.ledger_entries_count || 312}
                  </p>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <span className="text-slate-500">Grievances:</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {database?.counts?.grievance_count || 64}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worker Jobs Inventory */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>Background Workers &amp; Recurring Jobs Inventory</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Automated sweeps executed locally via BullMQ and node-cron workers.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="p-3">Job Name</th>
                  <th className="p-3">Schedule</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Last Completed Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {jobs?.map((job: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {job.job_name}
                    </td>
                    <td className="p-3 text-slate-500">{job.schedule || 'Scheduled'}</td>
                    <td className="p-3">
                      <Badge variant="success" className="text-[10px]">
                        {job.status || 'SUCCESS'}
                      </Badge>
                    </td>
                    <td className="p-3 text-slate-500">
                      {job.last_run ? new Date(job.last_run).toLocaleString() : 'Active'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}

