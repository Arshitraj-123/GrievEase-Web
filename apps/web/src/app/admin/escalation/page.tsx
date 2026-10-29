'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import {
  Flame,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldAlert,
  Server,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function EscalationMonitorPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getEscalationMonitor();
      setStats(res);
    } catch (err) {
      console.error('Failed to load escalation stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s polling
    return () => clearInterval(interval);
  }, []);

  const queue = stats?.queue || { waiting: 0, active: 0, delayed: 0, failed: 0 };
  const lastSweep = stats?.lastSweep ? new Date(stats.lastSweep).toLocaleString() : 'Never';
  const isSweepStale = stats?.sweepDelayed === true;

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Escalation Monitor">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs">
                BullMQ on Redis • Standalone Worker
              </Badge>
              <Badge className="bg-slate-800 text-slate-300 text-xs">
                Autonomous
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Auto-Escalation Engine Monitor
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Real-time BullMQ job queue telemetry, warning schedules, and hourly recovery sweep.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchStats}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-2 shrink-0 border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* Sweep Delayed Alert Banner */}
        {isSweepStale && (
          <div className="p-4 rounded-3xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-800 dark:text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold">CRITICAL: Hourly Recovery Sweep Delay Detected</h3>
              <p className="text-xs leading-relaxed mt-0.5">
                The periodic escalation sweep has not fired for over two intervals (2+ hours). Check Redis connectivity and worker service status.
              </p>
            </div>
          </div>
        )}

        {/* 1. Queue Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Delayed Jobs (SLA Timers)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              {loading ? '...' : queue.delayed}
            </div>
            <span className="text-[10px] text-teal-600 font-medium">Warning & breach triggers</span>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active Processing
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
              {loading ? '...' : queue.active}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Currently in-flight</span>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Failed Jobs (DLQ)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
              {loading ? '...' : queue.failed}
            </div>
            <span className="text-[10px] text-rose-500 font-medium">Auto-retry with backoff</span>
          </Card>

          <Card className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Last Hourly Sweep
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
              {loading ? '...' : lastSweep}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Missed timer recovery</span>
          </Card>
        </div>

        {/* 2-Column: Upcoming Breaches & Recent Escalation Events */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Upcoming Breaches */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming SLA Breaches ({stats?.upcomingBreaches?.length || 0})
            </h3>

            {stats?.upcomingBreaches?.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400">
                No active complaints near SLA breach deadline.
              </Card>
            ) : (
              <div className="space-y-2.5">
                {stats?.upcomingBreaches?.map((item: any) => (
                  <Link
                    key={item.id}
                    href={`/admin/grievances/${item.id}`}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 flex items-center justify-between transition-all block group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-600">
                          {item.public_id}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          Level {item.current_level}
                        </Badge>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 group-hover:text-teal-600 line-clamp-1">
                        {item.title}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-rose-600">
                        Due: {new Date(item.sla_due_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(item.sla_due_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: Recent Escalation Log Entries */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Escalations ({stats?.recentEscalations?.length || 0})
            </h3>

            {stats?.recentEscalations?.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate-400">
                No automatic or manual escalations recorded recently.
              </Card>
            ) : (
              <div className="space-y-2.5">
                {stats?.recentEscalations?.map((log: any) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Level {log.from_level} → Level {log.to_level}
                      </span>
                      <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px]">
                        {log.reason}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Complaint ID: {log.grievance_id?.slice(0, 8)}...</span>
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
