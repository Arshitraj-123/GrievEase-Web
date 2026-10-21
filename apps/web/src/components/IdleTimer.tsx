'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Modal, Button } from '@grievease/ui';
import { Clock, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';

const IDLE_LIMIT_MS = 14 * 60 * 1000; // 14 minutes
const WARNING_SECONDS = 60; // 60 seconds warning

export function IdleTimer() {
  const router = useRouter();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_SECONDS);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Skip idle timer on public landing/auth pages
  const isAuthPage =
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/activate') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/session-expired') ||
    pathname.startsWith('/account-help');

  const handleLogoutDueToInactivity = useCallback(async () => {
    setShowWarning(false);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    try {
      await api.logout();
    } catch {}
    router.push(`/session-expired?next=${encodeURIComponent(pathname || '/')}`);
  }, [pathname, router]);

  const startWarningCountdown = useCallback(() => {
    setShowWarning(true);
    setSecondsRemaining(WARNING_SECONDS);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          handleLogoutDueToInactivity();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [handleLogoutDueToInactivity]);

  const resetIdleTimer = useCallback(() => {
    if (showWarning) return; // Don't silently reset if warning modal is active

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      startWarningCountdown();
    }, IDLE_LIMIT_MS);
  }, [showWarning, startWarningCountdown]);

  const stayLoggedIn = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setShowWarning(false);
    setSecondsRemaining(WARNING_SECONDS);
    try {
      await api.refresh();
    } catch {}
    resetIdleTimer();
  };

  useEffect(() => {
    if (isAuthPage) return;

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach((evt) => window.addEventListener(evt, handleActivity));
    resetIdleTimer();

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthPage, resetIdleTimer]);

  if (isAuthPage || !showWarning) return null;

  return (
    <Modal
      isOpen={showWarning}
      onClose={() => {}}
      title="Session Inactivity Warning"
      className="max-w-md border-amber-300 dark:border-amber-700"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
          <div className="text-sm">
            You have been inactive for nearly 15 minutes. For security, your session will automatically terminate in:
          </div>
        </div>

        <div className="text-center py-3">
          <div className="inline-flex items-center gap-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
            <Clock className="w-7 h-7" />
            <span>00:{secondsRemaining.toString().padStart(2, '0')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Click below to continue your current session.</p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" onClick={handleLogoutDueToInactivity}>
            Log out now
          </Button>
          <Button variant="primary" size="sm" onClick={stayLoggedIn}>
            Stay Logged In
          </Button>
        </div>
      </div>
    </Modal>
  );
}
