'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
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
  Filter,
  History,
  ShieldCheck,
  User,
  Clock,
} from 'lucide-react';

export default function VisitorHistoryPage() {
  const { t } = useAccessibility();
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState('ALL');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.listVisitLogs();
      setLogs(data || []);
    } catch {
      setLogs([
        {
          id: 'vl-hist-1',
          visitorName: 'Suresh Raina',
          purpose: 'Inspection',
          source: 'WALKIN',
          decision: 'APPROVED',
          inAt: new Date(Date.now() - 86400000).toISOString(),
          outAt: new Date(Date.now() - 80000000).toISOString(),
          vehicleNo: 'MH-01-AX-9911',
        },
        {
          id: 'vl-hist-2',
          visitorName: 'Kunal Patil',
          purpose: 'Delivery',
          source: 'DELIVERY',
          decision: 'APPROVED',
          inAt: new Date(Date.now() - 172800000).toISOString(),
          outAt: new Date(Date.now() - 170000000).toISOString(),
          vehicleNo: null,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export formula-safe CSV: prepends `'` to values starting with `=`, `+`, `-`, `@`
   */
  const handleExportCsv = () => {
    if (logs.length === 0) return;

    const escapeCell = (str: any) => {
      let val = str === null || str === undefined ? '' : String(str);
      if (/^[=+\-@\t\r]/.test(val)) {
        val = `'${val}`;
      }
      return `"${val.replace(/"/g, '""')}"`;
    };

    const headers = ['Visitor Name', 'Purpose', 'Source', 'Decision', 'Vehicle', 'In Time', 'Out Time'];
    const rows = logs.map((l) => [
      escapeCell(l.visitorName),
      escapeCell(l.purpose),
      escapeCell(l.source),
      escapeCell(l.decision),
      escapeCell(l.vehicleNo),
      escapeCell(l.inAt ? new Date(l.inAt).toISOString() : ''),
      escapeCell(l.outAt ? new Date(l.outAt).toISOString() : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `visitor_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (filterSource === 'ALL') return true;
    return l.source === filterSource;
  });

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <a
              href="/app/visitors"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Visitors</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-7 h-7 text-purple-600" />
              <span>{t.visitors?.historyTitle || 'Visitor History'}</span>
            </h1>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={logs.length === 0}
            className="min-h-[44px] px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>{t.visitors?.exportSafeCsv || 'Export Safe CSV'}</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'PREAPPROVED', 'WALKIN', 'DELIVERY'].map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`min-h-[44px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterSource === src
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {src === 'ALL' ? 'All Sources' : src}
            </button>
          ))}
        </div>

        {/* Logs List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history logs...</div>
        ) : filteredLogs.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No visit records matching current filter.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <Card key={log.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {log.visitorName}
                    </span>
                    <Badge variant={log.decision === 'APPROVED' ? 'success' : 'default'} className="text-[10px]">
                      {log.decision}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {log.source}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500">
                    {log.purpose} {log.vehicleNo && `• Vehicle: ${log.vehicleNo}`}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400 shrink-0">
                  <div>{log.inAt ? new Date(log.inAt).toLocaleDateString() : ''}</div>
                  <div>
                    In: {log.inAt ? new Date(log.inAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
