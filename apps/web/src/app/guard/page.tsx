'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { guardSyncManager } from '@/lib/guard-offline-sync';
import { soundAlerts } from '@/lib/sound-alerts';
import { io, Socket } from 'socket.io-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  Shield,
  UserCheck,
  Eye,
  Truck,
  Users,
  Siren,
  AlertOctagon,
  ShieldCheck,
  Clock,
  Lock,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Plus,
} from 'lucide-react';

export default function GuardGateDashboard() {
  const [onlineStatus, setOnlineStatus] = useState<'LIVE' | 'RECONNECTING' | 'OFFLINE'>('LIVE');
  const [insideCount, setInsideCount] = useState<number>(0);
  const [expectedCount, setExpectedCount] = useState<number>(0);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [activeSos, setActiveSos] = useState<any | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    // 1. Start Wake Lock to keep console awake
    guardSyncManager.requestWakeLock();
    // 2. Start 15s Heartbeats
    guardSyncManager.startHeartbeat();

    loadDashboardStats();
    const poll = setInterval(loadDashboardStats, 10000);

    // Socket.io for live updates
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => setOnlineStatus('LIVE'));
      socket.on('disconnect', () => setOnlineStatus('OFFLINE'));

      socket.on('sos.alert', (alert: any) => {
        setActiveSos(alert);
        soundAlerts.startEmergencySiren();
      });

      socket.on('sos.resolve', () => {
        setActiveSos(null);
        soundAlerts.stopSiren();
      });

      socket.on('visitor.walkin', (walkin: any) => {
        setPendingApprovals((prev) => [walkin, ...prev]);
        soundAlerts.playDoorbellChime();
      });
    } catch {}

    const updateSyncCount = () => {
      const q = guardSyncManager.getQueue();
      setPendingSyncCount(q.filter((i) => i.status === 'PENDING').length);
    };
    updateSyncCount();

    return () => {
      clearInterval(poll);
      guardSyncManager.stopHeartbeat();
      guardSyncManager.releaseWakeLock();
      soundAlerts.stopSiren();
      if (socket) socket.disconnect();
    };
  }, []);

  const loadDashboardStats = async () => {
    try {
      const inside = await api.listVisitLogs(undefined, true);
      setInsideCount(Array.isArray(inside) ? inside.length : 0);

      const passes = await api.listVisitorPasses();
      setExpectedCount(Array.isArray(passes) ? passes.length : 0);

      const sosList = await api.listSosAlerts(undefined, true);
      if (sosList && sosList.length > 0) {
        setActiveSos(sosList[0]);
      } else {
        setActiveSos(null);
      }
      setOnlineStatus('LIVE');
    } catch {
      setOnlineStatus('OFFLINE');
    }
  };

  const handleSyncOffline = async () => {
    const res = await guardSyncManager.syncPending();
    const q = guardSyncManager.getQueue();
    setPendingSyncCount(q.filter((i) => i.status === 'PENDING').length);
    loadDashboardStats();
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Top High-Contrast Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border-2 border-slate-800 rounded-3xl text-white shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-600 rounded-2xl">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Main Gate Security Console</h1>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span>Gate #1 (North Gate)</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {onlineStatus === 'LIVE' ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <strong className="text-emerald-400">Live Connection (15s Heartbeat)</strong>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <strong className="text-red-400">Offline Mode (Local Cache)</strong>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <button
                onClick={handleSyncOffline}
                className="min-h-[48px] px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Sync {pendingSyncCount} Pending</span>
              </button>
            )}

            <a
              href="/guard/lock"
              className="min-h-[48px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700"
            >
              <Lock className="w-4 h-4" />
              <span>Lock Screen</span>
            </a>
          </div>
        </div>

        {/* SOS Alert Emergency Banner Takeover */}
        {activeSos && (
          <a
            href="/guard/sos"
            className="block p-5 bg-red-600 hover:bg-red-700 text-white rounded-3xl shadow-2xl border-4 border-red-700 animate-bounce transition-all min-h-[64px]"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Siren className="w-8 h-8 text-amber-300 animate-spin" />
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                    CRITICAL EMERGENCY ALERT ACTIVE
                  </div>
                  <div className="text-lg font-black">
                    {activeSos.type} Emergency • Flat {activeSos.flatId || 'Tower A-402'}
                  </div>
                </div>
              </div>
              <span className="px-4 py-2 bg-white text-red-700 font-black text-xs rounded-xl shrink-0 shadow-md">
                RESPOND NOW &rarr;
              </span>
            </div>
          </a>
        )}

        {/* High-Contrast KPI Cards (min 56px touch target) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/guard/entry"
            className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl hover:border-teal-500 shadow-md space-y-2 block min-h-[110px]"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Expected Today</span>
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">
              {expectedCount}
            </div>
            <div className="text-[11px] text-teal-600 font-bold">Tap to Verify Code &rarr;</div>
          </a>

          <a
            href="/guard/inside"
            className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl hover:border-emerald-500 shadow-md space-y-2 block min-h-[110px]"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Inside Society</span>
              <Eye className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600">
              {insideCount}
            </div>
            <div className="text-[11px] text-slate-500 font-bold">Check out visitors &rarr;</div>
          </a>

          <a
            href="/guard/deliveries"
            className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl hover:border-blue-500 shadow-md space-y-2 block min-h-[110px]"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Deliveries Desk</span>
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              Couriers
            </div>
            <div className="text-[11px] text-blue-600 font-bold">Log arrival &rarr;</div>
          </a>

          <a
            href="/guard/staff"
            className="p-5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl hover:border-purple-500 shadow-md space-y-2 block min-h-[110px]"
          >
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase">Staff Scanner</span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              Staff Pass
            </div>
            <div className="text-[11px] text-purple-600 font-bold">Scan daily badge &rarr;</div>
          </a>
        </div>

        {/* Quick Action Large Tiles (56px+ target, one-handed touch layout) */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Sentry Operations &amp; Gate Actions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: 'Check-In & QR Scan',
                desc: 'Verify 6-digit gate code or scan pass QR; 3-tap walk-in entry',
                icon: UserCheck,
                href: '/guard/entry',
                color: 'bg-teal-600 text-white',
              },
              {
                title: 'Inside Society List',
                desc: 'View active vehicles, mark visitor exit, flag overstays',
                icon: Eye,
                href: '/guard/inside',
                color: 'bg-emerald-600 text-white',
              },
              {
                title: 'Delivery Drop-Off Desk',
                desc: 'Record Amazon, Swiggy courier arrivals & gate drop-offs',
                icon: Truck,
                href: '/guard/deliveries',
                color: 'bg-blue-600 text-white',
              },
              {
                title: 'Domestic Staff Scan',
                desc: 'Scan staff QR pass to record append-only GUARD_SCAN attendance',
                icon: Users,
                href: '/guard/staff',
                color: 'bg-purple-600 text-white',
              },
              {
                title: 'Report Incident',
                desc: 'Log security observations, suspicious vehicle with photos',
                icon: AlertOctagon,
                href: '/guard/incidents',
                color: 'bg-amber-600 text-white',
              },
              {
                title: 'Patrol Checkpoints',
                desc: 'Scan society QR tags along boundary wall and basements',
                icon: ShieldCheck,
                href: '/guard/patrol',
                color: 'bg-indigo-600 text-white',
              },
              {
                title: 'Shift & Handover',
                desc: 'Shift check-in/out, log notes and handover to next guard',
                icon: Clock,
                href: '/guard/shift',
                color: 'bg-slate-700 text-white',
              },
              {
                title: 'Emergency SOS Console',
                desc: 'Respond to active medical, fire, or guard distress alerts',
                icon: Siren,
                href: '/guard/sos',
                color: 'bg-red-600 text-white',
              },
              {
                title: 'Console PIN Lock',
                desc: 'Lock console during guard break or temporary absence',
                icon: Lock,
                href: '/guard/lock',
                color: 'bg-slate-800 text-white',
              },
            ].map((action, idx) => {
              const Icon = action.icon;
              return (
                <a
                  key={idx}
                  href={action.href}
                  className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 shadow-md transition-all flex items-center justify-between gap-3 min-h-[72px] active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${action.color} shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-black text-sm text-slate-900 dark:text-white">
                        {action.title}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        {action.desc}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
