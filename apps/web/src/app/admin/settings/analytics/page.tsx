'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Settings,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lock,
  Save,
  ArrowLeft,
} from 'lucide-react';
import { getAnalyticsSettings, updateAnalyticsSettings } from '@/lib/api';
import { AnalyticsSettingsDto } from '@grievease/contracts';
import { useTranslation } from '@/i18n';

export default function AnalyticsSettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<AnalyticsSettingsDto>({
    publicDashboardEnabled: true,
    publicDashboardVisibility: 'RESIDENTS_ONLY',
    minCellSize: 5,
    perfThresholdExcellent: 90,
    perfThresholdOnTrack: 75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    getAnalyticsSettings()
      .then((data) => {
        if (data) setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const ok = await updateAnalyticsSettings(settings);
      if (ok) {
        setMessage({ type: 'success', text: 'Analytics settings updated and audited successfully.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to update settings. Verify Super Admin authorization.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Admin Panel</span>
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            {t('analytics.analyticsSettingsTitle')}
          </h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('analytics.analyticsSettingsSubtitle')}
        </p>
      </div>

      {/* Pending Client Decision Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong>Pending Client Decision:</strong> Visibility defaults to <code>RESIDENTS_ONLY</code> and performance rating thresholds (90% / 75%) are operational defaults marked for committee ratification. Changes to public visibility require Super Admin credentials and are recorded in the audit log.
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border border-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Toggle: Public Dashboard Enabled */}
        <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Enable Transparency Dashboard
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              When disabled, <code>/society/[slug]/transparency</code> returns a 404 response.
            </span>
          </div>
          <input
            type="checkbox"
            checked={settings.publicDashboardEnabled}
            onChange={(e) => setSettings({ ...settings, publicDashboardEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
          />
        </div>

        {/* Radio: Visibility Mode */}
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
            Dashboard Visibility Restriction
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2">
            Control whether non-authenticated internet visitors can access the public dashboard.
          </span>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="RESIDENTS_ONLY"
                checked={settings.publicDashboardVisibility === 'RESIDENTS_ONLY'}
                onChange={() => setSettings({ ...settings, publicDashboardVisibility: 'RESIDENTS_ONLY' })}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Residents Only (Default) — Requires authenticated resident login
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value="PUBLIC"
                checked={settings.publicDashboardVisibility === 'PUBLIC'}
                onChange={() => setSettings({ ...settings, publicDashboardVisibility: 'PUBLIC' })}
                className="text-teal-600 focus:ring-teal-500"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Public — Open to all internet visitors and prospective homebuyers
              </span>
            </label>
          </div>
        </div>

        {/* Input: Minimum Cell Size Suppression Threshold */}
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-1">
          <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
            Small-Number Suppression Threshold (MIN_CELL_SIZE)
          </label>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
            Any cell with fewer than this count is displayed as &quot;&lt;5&quot; to prevent resident re-identification.
          </span>
          <input
            type="number"
            min="1"
            max="50"
            value={settings.minCellSize}
            onChange={(e) => setSettings({ ...settings, minCellSize: parseInt(e.target.value, 10) || 5 })}
            className="w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
          />
        </div>

        {/* Resolver Thresholds */}
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              Resolver SLA Hit Rate Classification Thresholds (%)
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Thresholds used to label resolver performance neutrally (Pending client ratification).
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                &quot;Excellent&quot; Threshold (%)
              </label>
              <input
                type="number"
                min="50"
                max="100"
                value={settings.perfThresholdExcellent}
                onChange={(e) =>
                  setSettings({ ...settings, perfThresholdExcellent: parseInt(e.target.value, 10) || 90 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                &quot;On Track&quot; Threshold (%)
              </label>
              <input
                type="number"
                min="30"
                max="95"
                value={settings.perfThresholdOnTrack}
                onChange={(e) =>
                  setSettings({ ...settings, perfThresholdOnTrack: parseInt(e.target.value, 10) || 75 })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving & Auditing...' : 'Save & Audit Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
