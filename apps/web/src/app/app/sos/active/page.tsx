'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { soundAlerts } from '@/lib/sound-alerts';
import { useAccessibility } from '@/components/AccessibilityProvider';
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
  Siren,
  Volume2,
  VolumeX,
  PhoneCall,
  CheckCircle2,
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  MapPin,
} from 'lucide-react';

function ActiveSosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alertId = searchParams?.get('id') || '';
  const { t } = useAccessibility();

  const [alert, setAlert] = useState<any | null>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [emergencyPhone, setEmergencyPhone] = useState('+91-22-2555-0199');

  useEffect(() => {
    // Start siren immediately
    soundAlerts.startEmergencySiren();
    setIsMuted(soundAlerts.isMuted());

    // Fetch alert details
    const loadAlert = async () => {
      try {
        const list = await api.listSosAlerts(undefined, true);
        const current = list?.find((a: any) => a.id === alertId) || list?.[0];
        if (current) {
          setAlert(current);
          const resps = await api.getSosResponses(current.id);
          setResponses(resps || []);
        }
      } catch {
        // Mock fallback active state
        setAlert({
          id: alertId || 'mock-sos-1',
          type: 'MEDICAL',
          status: 'RAISED',
          raisedAt: new Date().toISOString(),
          locationMode: 'FLAT_ONLY',
        });
      }
    };

    loadAlert();
    const poll = setInterval(loadAlert, 3000);

    // Socket.io live listener
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('sos.ack', (payload: any) => {
        if (!alertId || payload.alertId === alertId) {
          setAlert((prev: any) => ({ ...prev, status: 'ACKNOWLEDGED', acknowledgedBy: payload.acknowledgedBy }));
          soundAlerts.playNotificationPip();
        }
      });

      socket.on('sos.response', (payload: any) => {
        if (!alertId || payload.alertId === alertId) {
          setResponses((prev) => [payload, ...prev]);
          soundAlerts.playNotificationPip();
        }
      });

      socket.on('sos.resolve', (payload: any) => {
        if (!alertId || payload.alertId === alertId) {
          soundAlerts.stopSiren();
          router.push('/app/sos/history');
        }
      });
    } catch {}

    // Fetch gate security number
    api.getEmergencyContacts().then((contacts: any[]) => {
      if (contacts && contacts.length > 0) {
        const gate = contacts.find((c: any) => c.category === 'SECURITY' || c.name?.toLowerCase().includes('gate'));
        if (gate && gate.phoneNumber) {
          setEmergencyPhone(gate.phoneNumber);
        }
      }
    }).catch(() => {});

    return () => {
      clearInterval(poll);
      soundAlerts.stopSiren();
      if (socket) socket.disconnect();
    };
  }, [alertId, router]);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundAlerts.setMuted(next);
  };

  const handleResolve = async () => {
    if (!confirm('Confirm that you are safe and want to resolve this emergency alert?')) return;
    setIsResolving(true);
    soundAlerts.stopSiren();

    try {
      await api.resolveSos(alert?.id || alertId, {
        status: 'RESOLVED',
        outcomeNote: 'Resident confirmed safe directly from resident app.',
      });
      router.push('/app/sos/history');
    } catch {
      router.push('/app/sos/history');
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Loud Active Siren Banner */}
        <div className="bg-red-600 text-white rounded-3xl p-6 shadow-2xl border-4 border-red-700 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Siren className="w-8 h-8 text-amber-300 animate-bounce" />
              <div>
                <h1 className="text-xl font-black uppercase tracking-wider">
                  {t.sos?.alertActive || 'EMERGENCY SOS ACTIVE'}
                </h1>
                <p className="text-xs text-red-100">
                  {t.sos?.loudAlertActive || 'Audible siren sounding on guard and responder consoles'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute siren' : 'Mute siren'}
              className="p-3 bg-red-700 hover:bg-red-800 rounded-2xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
            </button>
          </div>

          <div className="bg-red-700/80 rounded-2xl p-4 flex items-center justify-between text-xs font-bold">
            <span>Status:</span>
            <Badge variant="warning" className="text-xs font-black uppercase bg-amber-400 text-slate-950">
              {alert?.status || 'RAISED'}
            </Badge>
          </div>

          {alert?.acknowledgedBy && (
            <div className="p-3 bg-white text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t.sos?.firstAck || 'Acknowledged by security responder'}</span>
            </div>
          )}
        </div>

        {/* Responders En Route Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <span>Live Responder Activity</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Updates posted in real-time by guards and assigned responders.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {responses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <Clock className="w-5 h-5 mx-auto animate-spin text-teal-600" />
                <p>Waiting for responders to acknowledge and post en-route updates...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {responses.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600" />
                      <span className="font-bold">{r.userName || r.role || 'Security Guard'}</span>
                      <Badge variant="outline" className="text-[10px]">{r.action}</Badge>
                    </div>
                    <span className="text-slate-400 text-[10px]">
                      {new Date(r.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Telephone Fallback Buttons */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Direct Telephone Backup
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${emergencyPhone}`}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
              <span className="truncate">Gate: {emergencyPhone}</span>
            </a>
            <a
              href="tel:112"
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 text-red-600 shrink-0" />
              <span>National: 112</span>
            </a>
          </div>
        </div>

        {/* Resolve Button */}
        <button
          onClick={handleResolve}
          disabled={isResolving}
          className="w-full min-h-[56px] py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{t.sos?.iAmSafe || "I Am Safe - Resolve SOS Alert"}</span>
        </button>
      </div>
    </ShellLayout>
  );
}

export default function ActiveSosPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading SOS console...</div>}>
      <ActiveSosContent />
    </Suspense>
  );
}
