'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@grievease/ui';
import {
  MessageSquare,
  Bell,
  ShieldCheck,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Smartphone,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { io, Socket } from 'socket.io-client';

interface ActivityItem {
  id: string;
  title: string;
  message: string;
  created_at: string;
  read?: boolean;
}

export default function ResidentDashboardPage() {
  const { t } = useAccessibility();
  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [lastVisitTime, setLastVisitTime] = useState<string>('');
  const [grievanceCounts, setGrievanceCounts] = useState({
    open: 0,
    inProgress: 0,
    escalated: 0,
    resolved: 0,
    total: 0,
  });

  useEffect(() => {
    // 1. Fetch user profile
    api.getProfile()
      .then((p) => setProfile(p))
      .catch(() => {});

    // 2. Fetch notifications
    api.getNotifications()
      .then((data) => {
        setNotifications(data.items || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {});

    // 3. Fetch user grievances for status chips
    api.listMyGrievances()
      .then((items: any[]) => {
        if (Array.isArray(items)) {
          const counts = {
            open: items.filter((g) => ['SUBMITTED', 'ACKNOWLEDGED'].includes(g.status)).length,
            inProgress: items.filter((g) => ['IN_PROGRESS', 'PENDING_INFO'].includes(g.status)).length,
            escalated: items.filter((g) => g.status === 'ESCALATED').length,
            resolved: items.filter((g) => ['RESOLVED', 'CLOSED'].includes(g.status)).length,
            total: items.length,
          };
          setGrievanceCounts(counts);
        }
      })
      .catch(() => {});

    // 4. Track last visit time
    const storedLastVisit = localStorage.getItem('grievease_last_visit');
    const nowStr = new Date().toISOString();
    if (storedLastVisit) {
      setLastVisitTime(new Date(storedLastVisit).toLocaleString());
    } else {
      setLastVisitTime('First session today');
    }
    localStorage.setItem('grievease_last_visit', nowStr);

    // 4. Live Socket.io connection for realtime activity feed
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('notification', (newNotif: ActivityItem) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const flatLabel = profile?.flatNumber
    ? `Flat ${profile.flatNumber}`
    : 'Green Valley Residency';

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Welcome Header: Mobile-First 360px+ */}
        <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-teal-900 via-slate-900 to-slate-950 text-white shadow-xl border border-teal-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs">
                  {t.nav.societyName} • {flatLabel}
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {t.appHome.welcomeTitle}, {profile?.fullName || t.nav.residentRole}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
                {t.appHome.welcomeSubtitle}
              </p>
            </div>

            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <Link
                href="/app/notifications"
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-[0.98] text-white text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-md"
              >
                <Bell className="w-4 h-4" />
                <span>{unreadCount} {t.nav.notifications}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Primary Action & Status Chips (Mobile-First 360px+) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <Link
              href="/app/grievances/new"
              className="min-h-[52px] px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base inline-flex items-center justify-center gap-3 shadow-lg shadow-teal-900/20 transition-all border border-teal-400/30 group"
            >
              <div className="p-1.5 rounded-lg bg-white/20 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <span>{t.grievances.raiseButton}</span>
              <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/app/grievances"
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all"
            >
              <span>{t.grievances.myGrievances} ({grievanceCounts.total})</span>
            </Link>
          </div>

          {/* 4 Status Chips: Open, In Progress, Escalated, Resolved */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <Link
              href="/app/grievances?status=OPEN"
              className="p-3 rounded-2xl bg-sky-50/70 hover:bg-sky-100/70 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 border border-sky-200/80 dark:border-sky-800/60 transition-all group min-h-[44px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider">
                  {t.grievances.open}
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-sky-950 dark:text-sky-100 mt-1">
                {grievanceCounts.open}
              </div>
            </Link>

            <Link
              href="/app/grievances?status=IN_PROGRESS"
              className="p-3 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/60 transition-all group min-h-[44px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  {t.grievances.inProgress}
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-950 dark:text-amber-100 mt-1">
                {grievanceCounts.inProgress}
              </div>
            </Link>

            <Link
              href="/app/grievances?status=ESCALATED"
              className="p-3 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-800/60 transition-all group min-h-[44px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  {t.grievances.escalated}
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-950 dark:text-rose-100 mt-1">
                {grievanceCounts.escalated}
              </div>
            </Link>

            <Link
              href="/app/grievances?status=RESOLVED"
              className="p-3 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200/80 dark:border-emerald-800/60 transition-all group min-h-[44px] flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  {t.grievances.resolved}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 dark:text-emerald-100 mt-1">
                {grievanceCounts.resolved}
              </div>
            </Link>
          </div>
        </div>

        {/* 1. "Since your last visit" Summary Card */}
        <Card className="border border-teal-200/60 dark:border-teal-900/40 bg-teal-50/30 dark:bg-teal-950/20 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-teal-600 text-white">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{t.appHome.sinceLastVisitTitle}</CardTitle>
                <CardDescription className="text-xs">
                  {lastVisitTime ? `Last active: ${lastVisitTime}` : t.appHome.sinceLastVisitSubtitle}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Unread Alerts Metric */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${unreadCount > 0 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-white">{unreadCount}</div>
                  <div className="text-[11px] text-slate-500">{t.appHome.unreadNotifications}</div>
                </div>
              </div>

              {/* Security Health */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.appHome.securityStatus}</div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    {t.appHome.securityStatusActive}
                  </div>
                </div>
              </div>

              {/* Device Session */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">{t.appHome.sessionsActive}</div>
                  <div className="text-[11px] text-slate-500">15-minute inactivity protection</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Live Resident Services (Strictly Only Live Modules) */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            {t.appHome.quickActionsTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Grievances */}
            <Link
              href="/app/grievances"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex items-start justify-between group min-h-[44px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-teal-600 transition-colors">
                    {t.appHome.viewGrievances}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Permanent resolution, dedicated SLA timers, 4-tier escalation
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all mt-1" />
            </Link>

            {/* Profile & Security */}
            <Link
              href="/app/settings/security"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex items-start justify-between group min-h-[44px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-teal-600 transition-colors">
                    {t.appHome.manageSecurity}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Font size, language choice, sessions, credentials
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all mt-1" />
            </Link>

            {/* Notifications Center */}
            <Link
              href="/app/notifications"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex items-start justify-between group min-h-[44px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-teal-600 transition-colors">
                    {t.nav.notifications}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Live updates, secretary broadcasts, activity logs
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all mt-1" />
            </Link>

            {/* Help & Support */}
            <Link
              href="/account-help"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-teal-500 transition-all flex items-start justify-between group min-h-[44px]"
            >
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-teal-600 transition-colors">
                    {t.appHome.helpSupport}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Emergency recovery, account unlocking, contact council
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all mt-1" />
            </Link>
          </div>
        </div>

        {/* 3. Recent Activity Feed (Live over Socket.io) */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base sm:text-lg">{t.appHome.recentActivityTitle}</CardTitle>
              <CardDescription className="text-xs">
                {t.appHome.recentActivitySubtitle}
              </CardDescription>
            </div>
            <Link
              href="/app/notifications"
              className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline min-h-[44px] flex items-center"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t.appHome.noActivity}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-3 flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{item.message}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
