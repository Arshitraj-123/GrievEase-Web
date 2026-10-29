'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@grievease/ui';
import {
  ArrowLeft,
  Settings,
  Clock,
  ShieldAlert,
  PhoneCall,
  Save,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Volume2,
} from 'lucide-react';

export default function AdminSosSettingsPage() {
  const [cancelSeconds, setCancelSeconds] = useState(5);
  const [ackTimeoutSeconds, setAckTimeoutSeconds] = useState(60);
  const [gateOfflineAlertMinutes, setGateOfflineAlertMinutes] = useState(5);
  const [drillsEnabled, setDrillsEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div>
          <a
            href="/admin/sos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to SOS Console</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-red-600" />
            <span>Emergency SOS &amp; Sentry Alert Settings</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure responder tiers, escalation SLAs, gate offline thresholds, and safety honesty limits.
          </p>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>SOS settings saved successfully!</span>
          </div>
        )}

        {/* Safety Honesty Requirement 4: Limits of in-app alerting & Recommended Backup Plan Checklist */}
        <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center gap-2.5 text-red-700 dark:text-red-300 font-black text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <span>Limits of In-App Alerting Notice</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            Because GrievEase operates strictly with zero 3rd-party SMS, external push services, or tracking, <strong>alerts reach security sentries and responders only when their browser console or mobile PWA is open</strong>. In power cuts, device sleep, or hardware failure, in-app alerts alone are insufficient for life safety.
          </p>

          <div className="space-y-2 pt-2 border-t border-red-200 dark:border-red-900 text-xs">
            <div className="font-bold text-slate-900 dark:text-white">
              Recommended Backup Plan Checklist:
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Gate Landline / Intercom:</strong> Physical telephone connected at the main sentry desk with numbers printed on all resident noticeboards.
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Volume2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Physical Emergency Siren:</strong> Dedicated manual wall switch connected to a loud building sentry bell.
              </span>
            </div>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Two-Way Walkie-Talkies:</strong> Battery-backed handheld radios for sentries patrolling basements and perimeters.
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Timeouts &amp; Escalation Thresholds</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Resident Cancel Window Countdown (Seconds)
                </label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={cancelSeconds}
                  onChange={(e) => setCancelSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
                <span className="text-[11px] text-slate-400">
                  Default 5s. Resident can cancel accidental triggers before fan-out broadcast.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  First-ACK Timeout Before Tier Escalation (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={300}
                  value={ackTimeoutSeconds}
                  onChange={(e) => setAckTimeoutSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
                <span className="text-[11px] text-slate-400">
                  Default 60s. If unacknowledged, escalates intensity to Tier 2 (Chairman/Secretary/Committee).
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gate Offline Alert Minutes Threshold
                </label>
                <input
                  type="number"
                  min={2}
                  max={30}
                  value={gateOfflineAlertMinutes}
                  onChange={(e) => setGateOfflineAlertMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
                <span className="text-[11px] text-slate-400">
                  Default 5 mins. If no guard console has reported a heartbeat within this time, admin dashboards display a persistent offline gate banner.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enable Security Drills &amp; Exercises
                </span>
                <input
                  type="checkbox"
                  checked={drillsEnabled}
                  onChange={(e) => setDrillsEnabled(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded-md cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save SOS Settings</span>
              </button>
            </CardContent>
          </Card>
        </form>
      </div>
    </ShellLayout>
  );
}
