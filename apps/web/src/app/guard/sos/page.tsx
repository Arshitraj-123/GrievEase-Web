'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Siren,
  ShieldAlert,
  CheckCircle2,
  PhoneCall,
  Volume2,
  VolumeX,
  Send,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';

export default function GuardSosDeskPage() {
  const { t } = useAccessibility();
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [responderNote, setResponderNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDistressLoading, setIsDistressLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
    const poll = setInterval(loadAlerts, 5000);

    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.on('sos.alert', (newAlert: any) => {
        setActiveAlerts((prev) => [newAlert, ...prev]);
        setSelectedAlert(newAlert);
        soundAlerts.startEmergencySiren();
      });

      socket.on('sos.resolve', (data: any) => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== data.alertId));
        if (selectedAlert && selectedAlert.id === data.alertId) {
          setSelectedAlert(null);
          soundAlerts.stopSiren();
        }
      });
    } catch {}

    return () => {
      clearInterval(poll);
      soundAlerts.stopSiren();
      if (socket) socket.disconnect();
    };
  }, [selectedAlert]);

  const loadAlerts = async () => {
    try {
      const list = await api.listSosAlerts(undefined, true);
      setActiveAlerts(list || []);
      if (list && list.length > 0 && !selectedAlert) {
        setSelectedAlert(list[0]);
        soundAlerts.startEmergencySiren();
      } else if (!list || list.length === 0) {
        soundAlerts.stopSiren();
      }
    } catch {}
  };

  const handleAcknowledge = async () => {
    if (!selectedAlert) return;
    setIsSubmitting(true);
    try {
      const res = await api.acknowledgeSos(selectedAlert.id);
      setSelectedAlert(res);
      loadAlerts();
    } catch (err: any) {
      alert(err.message || 'Already acknowledged by another responder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (action: 'ON_THE_WAY' | 'ARRIVED' | 'NOTE') => {
    if (!selectedAlert) return;
    setIsSubmitting(true);
    try {
      await api.respondSos(selectedAlert.id, {
        action,
        note: responderNote ? responderNote.trim() : undefined,
      });
      setResponderNote('');
      loadAlerts();
    } catch {}
    finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (isFalseAlarm: boolean) => {
    if (!selectedAlert) return;
    const note = prompt(isFalseAlarm ? 'Enter reason for FALSE ALARM:' : 'Enter resolution outcome notes:');
    if (!note) return;

    try {
      await api.resolveSos(selectedAlert.id, {
        status: isFalseAlarm ? 'FALSE_ALARM' : 'RESOLVED',
        outcomeNote: note,
      });
      soundAlerts.stopSiren();
      setSelectedAlert(null);
      loadAlerts();
    } catch {}
  };

  const handleGuardDistress = async () => {
    if (!confirm('TRIGGER SENTRY DISTRESS ALERT? This immediately alerts all admins, police, and off-duty sentries.')) return;
    setIsDistressLoading(true);
    try {
      const res = await api.raiseSos({
        type: 'OTHER',
        note: 'GUARD DISTRESS: Physical confrontation or intruder breach at Main Gate!',
        locationMode: 'FLAT_ONLY',
      });
      setSelectedAlert(res);
      soundAlerts.startEmergencySiren();
      loadAlerts();
    } catch {}
    finally {
      setIsDistressLoading(false);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundAlerts.setMuted(next);
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="flex items-center justify-between">
          <div>
            <a
              href="/guard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Gate Console</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Siren className="w-7 h-7 text-red-600 animate-pulse" />
              <span>Security Guard SOS Emergency Desk</span>
            </h1>
          </div>

          <button
            onClick={toggleMute}
            className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-200"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-red-400" />}
          </button>
        </div>

        {/* Guard Distress Trigger Tile */}
        <div className="p-4 bg-red-950/60 border-2 border-red-700 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="text-xs font-black uppercase tracking-wider text-red-400">
              Sentry Self-Protection
            </div>
            <div className="text-sm font-bold text-white">
              Under attack, physical threat, or gate breach?
            </div>
          </div>
          <button
            onClick={handleGuardDistress}
            disabled={isDistressLoading}
            className="min-h-[52px] px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl flex items-center gap-2 shrink-0"
          >
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <span>TRIGGER GUARD DISTRESS</span>
          </button>
        </div>

        {/* Active Emergency Takeover Card */}
        {selectedAlert ? (
          <div className="p-6 bg-red-600 text-white rounded-3xl shadow-2xl border-4 border-red-700 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <Badge variant="warning" className="text-xs font-black uppercase bg-amber-300 text-slate-950 px-3 py-1">
                {selectedAlert.type} EMERGENCY
              </Badge>
              <span className="text-xs font-mono font-bold">
                Raised at {new Date(selectedAlert.raisedAt).toLocaleTimeString()}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-black">
                {selectedAlert.flatId ? `Flat ${selectedAlert.flatId}` : 'Main Security Gate'}
              </div>
              {selectedAlert.note && (
                <div className="p-3 bg-red-700/80 rounded-xl text-xs font-medium">
                  Note from Resident: &quot;{selectedAlert.note}&quot;
                </div>
              )}
            </div>

            {/* Responder Actions Grid (56px targets) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                onClick={handleAcknowledge}
                disabled={isSubmitting || selectedAlert.status !== 'RAISED'}
                className="min-h-[56px] px-4 py-3 bg-white hover:bg-slate-100 active:scale-95 text-red-700 font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>ACKNOWLEDGE (WIN)</span>
              </button>

              <button
                onClick={() => handleStatusUpdate('ON_THE_WAY')}
                disabled={isSubmitting}
                className="min-h-[56px] px-4 py-3 bg-red-800 hover:bg-red-900 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <User className="w-5 h-5" />
                <span>I AM ON THE WAY</span>
              </button>

              <button
                onClick={() => handleStatusUpdate('ARRIVED')}
                disabled={isSubmitting}
                className="min-h-[56px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ARRIVED AT SCENE</span>
              </button>
            </div>

            {/* Resolution Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-red-500">
              <button
                onClick={() => handleResolve(true)}
                className="text-xs font-bold text-amber-200 hover:text-white underline min-h-[44px] px-2"
              >
                Mark False Alarm
              </button>
              <button
                onClick={() => handleResolve(false)}
                className="min-h-[48px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
              >
                Resolve &amp; All Safe
              </button>
            </div>
          </div>
        ) : (
          <Card className="text-center py-12 p-6">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-2" />
            <CardTitle className="text-base font-bold">No Active Emergencies</CardTitle>
            <CardDescription className="text-xs mt-1">
              Gate room and responder channels are all clear. Keep console active to receive instant siren alerts.
            </CardDescription>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}
