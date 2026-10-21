'use client';

import React, { useEffect, useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { Bell, CheckCheck, Wifi, ExternalLink, ShieldCheck, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { io, Socket } from 'socket.io-client';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read?: boolean;
  type?: string;
  created_at: string;
}

export default function ResidentNotificationsPage() {
  const { t } = useAccessibility();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', () => {
        setIsSocketConnected(true);
      });

      socket.on('disconnect', () => {
        setIsSocketConnected(false);
      });

      socket.on('notification', (newNotif: NotificationItem) => {
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const displayedList = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header with Live Status Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.notifications.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {t.notifications.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                isSocketConnected
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSocketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
              <span>
                {isSocketConnected ? t.notifications.liveConnected : t.notifications.liveDisconnected}
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-teal-200 dark:border-teal-800"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{t.notifications.markAllRead}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters (Min 44px tap target) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.notifications.allTab} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              filter === 'unread'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.notifications.unreadTab} ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {displayedList.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.notifications.emptyTitle}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t.notifications.emptyDescription}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {displayedList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => !item.read && handleMarkOneRead(item.id)}
                    className={`p-4 sm:p-5 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                      item.read
                        ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                        : 'bg-teal-50/40 dark:bg-teal-950/20 text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${
                          item.read ? 'bg-slate-300 dark:bg-slate-700' : 'bg-teal-500 ring-4 ring-teal-500/20'
                        }`}
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {item.title}
                          </span>
                          {!item.read && (
                            <Badge variant="default" className="text-[10px] px-2 py-0.5">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap mt-1">
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
