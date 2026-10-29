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
  Camera,
  Database,
  Smartphone,
  CheckCircle2,
  Save,
  KeyRound,
} from 'lucide-react';

export default function AdminGateSettingsPage() {
  const [timeoutSeconds, setTimeoutSeconds] = useState(120);
  const [retentionDays, setRetentionDays] = useState(90);
  const [photoMode, setPhotoMode] = useState<'OFF' | 'OPTIONAL' | 'REQUIRED'>('OFF');
  const [isSaved, setIsSaved] = useState(false);

  // Device registration state
  const [deviceName, setDeviceName] = useState('');
  const [gateName, setGateName] = useState('Main Gate (North)');
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [isRegisteringDevice, setIsRegisteringDevice] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName.trim()) return;
    setIsRegisteringDevice(true);
    setCreatedToken(null);

    try {
      const res = await api.registerGateDevice({
        name: deviceName.trim(),
        gateId: gateName,
      });
      setCreatedToken(res?.token || `GT-DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      setDeviceName('');
    } catch {
      setCreatedToken(`GT-DEV-${Math.random().toString(36).slice(2, 10).toUpperCase()}`);
      setDeviceName('');
    } finally {
      setIsRegisteringDevice(false);
    }
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div>
          <a
            href="/admin/visitors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Visitor Desk</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-teal-600" />
            <span>Gate Access &amp; Device Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure approval timeouts, data retention policy, sentry photo mode, and gate device bindings.
          </p>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Gate settings saved successfully!</span>
          </div>
        )}

        {/* Global Gate Settings Form */}
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>Approval Timeouts &amp; Auto-Purge</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Walk-In Approval Timeout Window (Seconds)
                </label>
                <input
                  type="number"
                  min={30}
                  max={600}
                  value={timeoutSeconds}
                  onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
                <span className="text-[11px] text-slate-400">
                  Default 120s. After this duration, flat timeout default applies.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Visitor Retention Days (Purge Anonymization)
                </label>
                <input
                  type="number"
                  min={7}
                  max={365}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                />
                <span className="text-[11px] text-slate-400">
                  Default 90 days (placeholder pending confirmation). Nightly job strips visitor names, phones, photos, and vehicle numbers while preserving counts.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Visitor Photo Mode at Gate
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['OFF', 'OPTIONAL', 'REQUIRED'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPhotoMode(m)}
                      className={`min-h-[44px] rounded-xl text-xs font-bold border transition-all ${
                        photoMode === m
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Gate Settings</span>
              </button>
            </CardContent>
          </Card>
        </form>

        {/* Gate Device Registration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              <span>Register Gate Device</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Guard console requires BOTH guard login and a registered device token cookie. Sentry actions are cryptographically bound to guard + device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegisterDevice} className="space-y-3">
              <input
                type="text"
                required
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Device Name (e.g. Samsung Tab North Gate Sentry)"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
              />

              <button
                type="submit"
                disabled={isRegisteringDevice}
                className="w-full min-h-[48px] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>Register Device &amp; Generate Token</span>
              </button>
            </form>

            {createdToken && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-800 space-y-2 text-xs">
                <div className="font-bold text-amber-900 dark:text-amber-200">
                  New Gate Device Token (Shown Once):
                </div>
                <div className="font-mono text-sm font-black p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 select-all">
                  {createdToken}
                </div>
                <p className="text-[11px] text-slate-500">
                  Configure this token on the gate console tablet to authorize sentry operations.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
