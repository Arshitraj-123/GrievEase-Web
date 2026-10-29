'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { SafetyHonestyBanner } from '@/components/SafetyHonestyBanner';
import { soundAlerts } from '@/lib/sound-alerts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@grievease/ui';
import {
  Siren,
  HeartPulse,
  Flame,
  ShieldAlert,
  AlertTriangle,
  MapPin,
  XCircle,
  PhoneCall,
  ArrowLeft,
  Clock,
} from 'lucide-react';

export default function ResidentSosPage() {
  const router = useRouter();
  const { t } = useAccessibility();

  const [type, setType] = useState<'MEDICAL' | 'FIRE' | 'THEFT' | 'OTHER'>('MEDICAL');
  const [note, setNote] = useState('');
  const [shareGps, setShareGps] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number; accuracy?: number }>({});
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);

  useEffect(() => {
    if (shareGps && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [shareGps]);

  const startCountdown = () => {
    setError(null);
    setIsCountingDown(true);
    setCountdown(5);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current);
          dispatchSos();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setIsCountingDown(false);
    setCountdown(5);
  };

  const dispatchSos = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.raiseSos({
        type,
        note: note ? note.trim().slice(0, 200) : undefined,
        locationMode: shareGps ? 'SHARED' : 'FLAT_ONLY',
        lat: shareGps ? coords.lat : undefined,
        lng: shareGps ? coords.lng : undefined,
        accuracy: shareGps ? coords.accuracy : undefined,
        cancelWindowSeconds: 5,
      });

      router.push(`/app/sos/active?id=${res.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch SOS alert. Please call gate security immediately!');
      setIsCountingDown(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Safety Honesty Banner if gate is offline */}
        <SafetyHonestyBanner />

        <div>
          <a
            href="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </a>
          <h1 className="text-3xl font-black text-red-600 flex items-center gap-2 mt-1">
            <Siren className="w-8 h-8 animate-pulse text-red-600" />
            <span>{t.sos?.title || 'Emergency SOS Desk'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fan-out alert within 2 seconds to on-duty security sentries and verified building responders.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-600 text-white font-bold text-xs rounded-2xl shadow-lg border-2 border-red-700 space-y-2">
            <div>{error}</div>
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-red-700 rounded-xl font-bold min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call National Emergency (112)</span>
            </a>
          </div>
        )}

        {/* Countdown Active State */}
        {isCountingDown ? (
          <div className="bg-red-600 text-white rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-red-700">
            <div className="space-y-2">
              <div className="text-xs font-black uppercase tracking-widest text-amber-200">
                DISPATCHING EMERGENCY ALERT
              </div>
              <div className="font-mono text-7xl font-black">{countdown}s</div>
              <p className="text-xs opacity-90">
                Cancel window active. Alert will broadcast to all guards &amp; committee at 0s.
              </p>
            </div>

            <button
              onClick={cancelCountdown}
              className="w-full min-h-[56px] py-4 bg-white hover:bg-slate-100 text-red-700 font-black text-lg rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-6 h-6 text-red-600" />
              <span>{t.sos?.cancelButton || 'CANCEL SOS ALERT'}</span>
            </button>
          </div>
        ) : (
          <Card className="border-red-200 dark:border-red-900/60 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                Select Emergency Category
              </CardTitle>
              <CardDescription className="text-xs">
                Responders are dispatched based on emergency type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    id: 'MEDICAL',
                    label: t.sos?.typeMedical || 'Medical Emergency',
                    icon: HeartPulse,
                    color: 'text-rose-600',
                    border: 'hover:border-rose-500',
                  },
                  {
                    id: 'FIRE',
                    label: t.sos?.typeFire || 'Fire Outbreak',
                    icon: Flame,
                    color: 'text-amber-600',
                    border: 'hover:border-amber-500',
                  },
                  {
                    id: 'THEFT',
                    label: t.sos?.typeTheft || 'Theft / Intruder',
                    icon: ShieldAlert,
                    color: 'text-purple-600',
                    border: 'hover:border-purple-500',
                  },
                  {
                    id: 'OTHER',
                    label: t.sos?.typeOther || 'General Emergency',
                    icon: AlertTriangle,
                    color: 'text-blue-600',
                    border: 'hover:border-blue-500',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setType(item.id as any)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all min-h-[80px] flex flex-col justify-between ${
                        type === item.id
                          ? 'border-red-600 bg-red-50/60 dark:bg-red-950/40 shadow-xs'
                          : `border-slate-200 dark:border-slate-800 ${item.border}`
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${item.color}`} />
                      <span className="font-bold text-xs text-slate-900 dark:text-white mt-2">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Optional Note for Responders (Max 200 chars)
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Elderly person fell in bedroom, need stretcher"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
              </div>

              {/* Geolocation consent */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <div className="text-xs">
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {t.sos?.shareGps || 'Share precise GPS coordinates'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Default is registered flat only. Only attached for this alert.
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={shareGps}
                  onChange={(e) => setShareGps(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded-md cursor-pointer shrink-0"
                />
              </div>

              {/* Big Red Trigger Button (min 56px touch target) */}
              <button
                type="button"
                onClick={startCountdown}
                className="w-full min-h-[56px] py-4 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Siren className="w-6 h-6 animate-bounce" />
                <span>{t.sos?.raiseButton || 'TRIGGER SOS EMERGENCY'}</span>
              </button>
            </CardContent>
          </Card>
        )}

        {/* History link */}
        <div className="text-center pt-2">
          <a
            href="/app/sos/history"
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-bold underline"
          >
            View Past SOS Alerts History
          </a>
        </div>
      </div>
    </ShellLayout>
  );
}
