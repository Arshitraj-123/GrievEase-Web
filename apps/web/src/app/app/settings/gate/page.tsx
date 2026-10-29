'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
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
  Moon,
  Users,
  CheckCircle2,
  Save,
} from 'lucide-react';

export default function GateSettingsPage() {
  const { t } = useAccessibility();
  const [timeoutAction, setTimeoutAction] = useState<'DENY' | 'ASK_GUARD' | 'ALLOW_IF_FREQUENT'>('DENY');
  const [isDndEnabled, setIsDndEnabled] = useState(false);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('07:00');
  const [delegateMember, setDelegateMember] = useState('Self (Primary)');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <a
            href="/app/visitors"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Visitors</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-teal-600" />
            <span>{t.visitors?.gateSettings || 'Gate & Approval Preferences'}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure default behaviour when you miss walk-in prompts, DND quiet hours, and delegate rules.
          </p>
        </div>

        {isSaved && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">
          {/* Timeout Default Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <span>{t.visitors?.timeoutAction || 'When Approval Times Out'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Action taken if no family member responds to a walk-in prompt within the 120-second window.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {[
                {
                  value: 'DENY',
                  label: t.visitors?.timeoutDeny || 'Deny Entry Automatically',
                  desc: 'Most secure. Unresponsive guests are politely turned away at the gate.',
                },
                {
                  value: 'ASK_GUARD',
                  label: t.visitors?.timeoutAskGuard || 'Ask Guard to Decide',
                  desc: 'Guard may allow entry by logging a mandatory GUARD_OVERRIDE note.',
                },
                {
                  value: 'ALLOW_IF_FREQUENT',
                  label: t.visitors?.timeoutAllowFrequent || 'Allow Only if Frequent Guest',
                  desc: 'Pre-vetted frequent guests are allowed in; strangers are denied.',
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeoutAction(opt.value as any)}
                  className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-start gap-3 min-h-[56px] ${
                    timeoutAction === opt.value
                      ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                      timeoutAction === opt.value
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {timeoutAction === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{opt.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* DND Schedule Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Moon className="w-5 h-5 text-indigo-600" />
                <span>{t.visitors?.dndSchedule || 'Do Not Disturb (DND)'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                During DND hours, gate chime sounds are silenced and non-emergency visitors are auto-held at the gate.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Enable DND Schedule
                </span>
                <input
                  type="checkbox"
                  checked={isDndEnabled}
                  onChange={(e) => setIsDndEnabled(e.target.checked)}
                  className="w-5 h-5 accent-teal-600 rounded-md cursor-pointer"
                />
              </div>

              {isDndEnabled && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">From Time</label>
                    <input
                      type="time"
                      value={dndStart}
                      onChange={(e) => setDndStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Till Time</label>
                    <input
                      type="time"
                      value={dndEnd}
                      onChange={(e) => setDndEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs min-h-[44px]"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delegate Flat Member */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>{t.visitors?.delegateResident || 'Delegate Approval Member'}</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Nominate which co-resident receives priority walk-in gate approval notifications.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <select
                value={delegateMember}
                onChange={(e) => setDelegateMember(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              >
                <option value="Self (Primary)">Self (Primary Account Holder)</option>
                <option value="All Co-Residents">All Registered Flat Co-Residents (Parallel)</option>
              </select>
            </CardContent>
          </Card>

          <button
            type="submit"
            className="w-full min-h-[48px] py-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Gate Preferences</span>
          </button>
        </form>
      </div>
    </ShellLayout>
  );
}
