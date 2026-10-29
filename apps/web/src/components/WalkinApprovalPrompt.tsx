'use client';

import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api-client';
import { soundAlerts } from '@/lib/sound-alerts';
import { useAccessibility } from './AccessibilityProvider';
import { SafetyHonestyBanner } from './SafetyHonestyBanner';
import { UserCheck, XCircle, Clock, ShieldCheck, Car, Users, User } from 'lucide-react';

export function WalkinApprovalPrompt() {
  const { t } = useAccessibility();
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [countdown, setCountdown] = useState<number>(120);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('notification', (payload: any) => {
        if (payload?.type === 'VISITOR_APPROVAL' || payload?.approvalRequestId) {
          setActiveRequest(payload);
          setCountdown(120);
          soundAlerts.playDoorbellChime();
        }
      });

      socket.on('visitor.walkin', (payload: any) => {
        setActiveRequest(payload);
        setCountdown(120);
        soundAlerts.playDoorbellChime();
      });

      socket.on('approval.resolved', (payload: any) => {
        if (activeRequest && payload.approvalRequestId === activeRequest.approvalRequestId) {
          setActiveRequest(null);
        }
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [activeRequest]);

  useEffect(() => {
    if (!activeRequest || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setActiveRequest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeRequest, countdown]);

  if (!activeRequest) return null;

  const handleDecision = async (decision: 'APPROVE' | 'DENY' | 'WAIT') => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.respondApproval({
        approvalRequestId: activeRequest.approvalRequestId || activeRequest.id,
        decision,
      });
      setActiveRequest(null);
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('already')) {
        setErrorMessage('Another flat member already responded to this visitor request.');
        setTimeout(() => setActiveRequest(null), 3000);
      } else {
        setErrorMessage(err.message || 'Failed to submit response.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border-2 border-teal-500/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
        <SafetyHonestyBanner className="mb-2" />

        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center font-bold">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="approval-title" className="text-lg font-black text-slate-900 dark:text-white">
                {t.visitors?.pendingApproval || 'Visitor at Security Gate'}
              </h2>
              <p className="text-xs text-slate-500">
                {countdown}s remaining before automatic default applies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>{countdown}s</span>
          </div>
        </div>

        {/* Visitor Card */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-base text-slate-900 dark:text-white">
                {activeRequest.visitorName || 'Guest Visitor'}
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Purpose: {activeRequest.purpose || 'Personal Visit'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{activeRequest.guestsCount || 1} guest(s)</span>
            </div>
            {activeRequest.vehicleNo && (
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Car className="w-4 h-4 text-slate-400" />
                <span>{activeRequest.vehicleNo}</span>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 text-xs rounded-xl font-medium border border-red-200 dark:border-red-900">
            {errorMessage}
          </div>
        )}

        {/* Action Buttons: 44px min target */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={() => handleDecision('APPROVE')}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t.visitors?.approve || 'Approve Entry'}</span>
          </button>

          <button
            onClick={() => handleDecision('DENY')}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span>{t.visitors?.deny || 'Deny Entry'}</span>
          </button>

          <button
            onClick={() => handleDecision('WAIT')}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 active:scale-95 text-slate-800 dark:text-slate-200 font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Clock className="w-4 h-4" />
            <span>{t.visitors?.letWait || 'Let Them Wait'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
