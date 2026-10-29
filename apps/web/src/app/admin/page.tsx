'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@grievease/ui';
import {
  Users,
  ShieldAlert,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Inbox,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Settings,
  GitCommit,
  UserCheck,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [society, setSociety] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [kpis, setKpis] = useState<{
    assignedToMe: number;
    overdue: number;
    nearBreach: number;
    resolvedToday: number;
  }>({
    assignedToMe: 0,
    overdue: 0,
    nearBreach: 0,
    resolvedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCurrentSociety().catch(() => null),
      api.getProfile().catch(() => null),
      api.getAdminKPIs().catch(() => null),
    ]).then(([socData, profData, kpiData]) => {
      if (socData) setSociety(socData);
      if (profData) setProfile(profData);
      if (kpiData) {
        setKpis({
          assignedToMe: Number(kpiData.assignedToMe || 0),
          overdue: Number(kpiData.overdue || 0),
          nearBreach: Number(kpiData.nearBreach || 0),
          resolvedToday: Number(kpiData.resolvedToday || 0),
        });
      }
      setLoading(false);
    });
  }, []);

  return (
    <ShellLayout role="ADMIN" userRoleTitle={profile?.role?.replace('_', ' ') || 'Administrator'}>
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs">
                {society?.name || 'Green Valley Residency'}
              </Badge>
              <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-xs">
                Role: {profile?.role || 'ADMIN'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Society Operations & Grievance Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Live SLA tracking, 4-tier automated escalation, audit inspection, and governance settings.
            </p>
          </div>

          <Link
            href="/admin/inbox"
            className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-lg shadow-teal-900/30 transition-all shrink-0"
          >
            <Inbox className="w-4 h-4" />
            <span>Open Resolver Inbox</span>
          </Link>
        </div>

        {/* 1. Role-Aware KPI Cards */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Real-Time Resolution Metrics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Assigned To Me */}
            <Link
              href="/admin/inbox?assignedToMe=true"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Assigned To Me
                </span>
                <UserCheck className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
                {loading ? '...' : kpis.assignedToMe}
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">Requires action</span>
            </Link>

            {/* Overdue */}
            <Link
              href="/admin/inbox?status=ESCALATED"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                  Overdue
                </span>
                <ShieldAlert className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-2">
                {loading ? '...' : kpis.overdue}
              </div>
              <span className="text-[10px] text-rose-500 mt-0.5 block">SLA Breached</span>
            </Link>

            {/* Near Breach */}
            <Link
              href="/admin/inbox?urgent=true"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
                  Near Breach
                </span>
                <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-2">
                {loading ? '...' : kpis.nearBreach}
              </div>
              <span className="text-[10px] text-amber-500 mt-0.5 block">&lt; 12 hours remaining</span>
            </Link>

            {/* Resolved Today */}
            <Link
              href="/admin/inbox?status=RESOLVED"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Resolved Today
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2">
                {loading ? '...' : kpis.resolvedToday}
              </div>
              <span className="text-[10px] text-emerald-500 mt-0.5 block">Closed & signed-off</span>
            </Link>
          </div>
        </div>

        {/* 2. Operations & Triage Quick Launch Grid */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Workflow & Monitoring Tools
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/admin/inbox"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                    Resolver Inbox
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Filter by status, level, SLA deadlines
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/escalation"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-rose-600">
                    Escalation Monitor
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    BullMQ queues, hourly sweep, breach stats
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/audit"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
                  <GitCommit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600">
                    Audit Trail & Hash Verifier
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    SHA-256 chain verification & CSV exports
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/escalated"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600">
                    Executive Review (L3/L4)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chairman & Governing Body rulings
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/flagged"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                    Flagged Complaints
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Frivolous, abusive, or overdue complaints
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/leave"
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-sky-600">
                    Resolver Leave
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Leave recording & auto-reassignment
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* 3. Governance & System Settings Section */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Governance Configuration
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href="/admin/settings/governance"
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all text-center group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                4-Level Chain
              </div>
              <span className="text-[10px] text-slate-400">Assignments & Vacancy</span>
            </Link>

            <Link
              href="/admin/settings/sla"
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all text-center group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                SLA Config
              </div>
              <span className="text-[10px] text-slate-400">Category & Level Matrix</span>
            </Link>

            <Link
              href="/admin/settings/categories"
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all text-center group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                Categories
              </div>
              <span className="text-[10px] text-slate-400">EN/HI/MR Names</span>
            </Link>

            <Link
              href="/admin/settings/society"
              className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500 transition-all text-center group"
            >
              <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-teal-600">
                Society Settings
              </div>
              <span className="text-[10px] text-slate-400">Rate limits & Auto-close</span>
            </Link>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
