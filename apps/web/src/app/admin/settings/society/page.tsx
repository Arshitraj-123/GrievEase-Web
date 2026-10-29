'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import { Settings, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function SocietySettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSocietySettings();
      setSettings(res || {});
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    setSuccessMessage(null);
    try {
      await api.updateSocietySetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSuccessMessage(`Setting "${key}" updated.`);
    } catch (err: any) {
      alert(err.message || 'Error updating setting.');
    } finally {
      setSavingKey(null);
    }
  };

  const settingDefs = [
    {
      key: 'rate_limit_per_24h',
      label: 'Resident 24h Rate Limit',
      desc: 'Max submissions per 24h per resident (counted across named and anonymous by blind index).',
      defaultValue: '5',
      type: 'number',
    },
    {
      key: 'duplicate_window_days',
      label: 'Duplicate Check Window (Days)',
      desc: 'Timeframe for trigram similarity duplicate detection warning.',
      defaultValue: '7',
      type: 'number',
    },
    {
      key: 'auto_close_hours',
      label: 'Auto-Close Window (Hours)',
      desc: 'Resolved grievances auto-close after this period unless disputed by resident.',
      defaultValue: '48',
      type: 'number',
    },
    {
      key: 'remind_after_hours',
      label: 'Minimum Hours Before Follow-Up Reminder',
      desc: 'Hours before resident can trigger a resolver follow-up notification (max 1 per 24h).',
      defaultValue: '24',
      type: 'number',
    },
    {
      key: 'warn_before_hours',
      label: 'SLA Breach Warning Window (Hours)',
      desc: 'Hours prior to SLA breach when the warning reminder is dispatched to the resolver.',
      defaultValue: '12',
      type: 'number',
    },
    {
      key: 'max_evidence',
      label: 'Maximum Attached Evidence Files',
      desc: 'Maximum photos, videos, or PDFs allowed per complaint submission.',
      defaultValue: '10',
      type: 'number',
    },
    {
      key: 'emergency_bypass_to_level',
      label: 'Emergency Bypass Target Level',
      desc: 'Level to which EMERGENCY complaints immediately skip (pending client decision).',
      defaultValue: '2',
      type: 'number',
      isPendingClient: true,
    },
    {
      key: 'chairman_alert_minutes',
      label: 'Emergency Chairman Alert Window (Minutes)',
      desc: 'Minutes before emergency alert reaches Chairman if L1/L2 does not acknowledge (pending client decision).',
      defaultValue: '30',
      type: 'number',
      isPendingClient: true,
    },
    {
      key: 'rating_required_before_autoclose',
      label: 'Require Rating Before Auto-Close',
      desc: 'If true, resolved complaints pause until resident submits a rating (pending client decision).',
      defaultValue: 'false',
      type: 'select',
      options: ['false', 'true'],
      isPendingClient: true,
    },
  ];

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Society Settings">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <Link
          href="/admin"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Society Grievance Parameters
          </h1>
          <p className="text-xs text-slate-500">
            Configure society-wide rate limits, auto-close windows, and emergency bypass rules.
          </p>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {settingDefs.map((def) => {
            const currentValue = settings[def.key] ?? def.defaultValue;

            return (
              <Card
                key={def.key}
                className="p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {def.label}
                    </span>
                    {def.isPendingClient && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                        Pending Client Confirmation
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {def.desc}
                  </p>
                  <code className="text-[10px] text-slate-400 font-mono">{def.key}</code>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {def.type === 'select' ? (
                    <select
                      id={`input-${def.key}`}
                      defaultValue={currentValue}
                      className="px-3 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900 min-h-[40px]"
                    >
                      {def.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      id={`input-${def.key}`}
                      defaultValue={currentValue}
                      className="w-24 px-3 py-2 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900 min-h-[40px]"
                    />
                  )}

                  <Button
                    type="button"
                    disabled={savingKey === def.key}
                    onClick={() => {
                      const inputEl = document.getElementById(`input-${def.key}`) as HTMLInputElement | HTMLSelectElement;
                      if (inputEl) handleUpdate(def.key, inputEl.value);
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                  >
                    {savingKey === def.key ? 'Saving...' : 'Update'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </ShellLayout>
  );
}
