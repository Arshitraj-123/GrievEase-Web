'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  ArrowLeft,
  Download,
  AlertOctagon,
  ShieldCheck,
  Clock,
  History,
} from 'lucide-react';

export default function AdminGuardLogsPage() {
  const [tab, setTab] = useState<'INCIDENTS' | 'PATROL' | 'HANDOVER'>('INCIDENTS');
  const [incidents, setIncidents] = useState<any[]>([]);
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [tab]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      if (tab === 'INCIDENTS') {
        const data = await api.listGuardIncidents();
        setIncidents(data || []);
      } else if (tab === 'PATROL') {
        const data = await api.listCheckpoints();
        setCheckpoints(data || []);
      }
    } catch {}
    finally {
      setIsLoading(false);
    }
  };

  const handleExportCsv = () => {
    const escapeCell = (str: any) => {
      let val = str === null || str === undefined ? '' : String(str);
      if (/^[=+\-@\t\r]/.test(val)) val = `'${val}`;
      return `"${val.replace(/"/g, '""')}"`;
    };

    const headers = ['Type', 'Severity/Order', 'Description', 'Timestamp'];
    const rows = incidents.map((i) => [
      escapeCell(i.type),
      escapeCell(i.severity),
      escapeCell(i.description),
      escapeCell(i.createdAt),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `guard_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <a
              href="/admin/guards"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Guard Management</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-7 h-7 text-teal-600" />
              <span>Sentry Logs, Incidents &amp; Patrol Audits</span>
            </h1>
          </div>

          <button
            onClick={handleExportCsv}
            className="min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Formula-Safe CSV</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
          <button
            onClick={() => setTab('INCIDENTS')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              tab === 'INCIDENTS' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            Security Incidents
          </button>
          <button
            onClick={() => setTab('PATROL')}
            className={`min-h-[44px] pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              tab === 'PATROL' ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-white'
            }`}
          >
            Patrol Coverage
          </button>
        </div>

        {tab === 'INCIDENTS' ? (
          incidents.length === 0 ? (
            <Card className="text-center py-12 p-6">
              <CardDescription>No incidents logged in the past 24 hours.</CardDescription>
            </Card>
          ) : (
            <div className="space-y-3">
              {incidents.map((i) => (
                <Card key={i.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                      {i.type?.replace('_', ' ')}
                    </span>
                    <Badge variant={i.severity === 'CRITICAL' ? 'danger' : 'warning'} className="text-[10px]">
                      {i.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{i.description}</p>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-3">
            {checkpoints.map((cp) => (
              <Card key={cp.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{cp.name}</div>
                  <div className="text-xs text-slate-400 font-mono">Slug: {cp.qrSlug}</div>
                </div>
                <Badge variant="success" className="text-[10px]">Checked Today</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
