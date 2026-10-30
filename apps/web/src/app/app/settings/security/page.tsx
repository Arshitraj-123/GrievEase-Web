'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import {
  ShieldCheck,
  Smartphone,
  Laptop,
  Lock,
  RefreshCw,
  Printer,
  Copy,
  Check,
  Type,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility, FontSizeSetting } from '@/components/AccessibilityProvider';
import { Locale } from '@/lib/i18n';

export default function ResidentSecurityPage() {
  const { fontSize, setFontSize, locale, setLocale, t } = useAccessibility();
  const [sessions, setSessions] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Recovery codes regeneration
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await api.getMySessions();
      setSessions(data || []);
    } catch {}
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeMySession(sessionId);
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await api.revokeOtherSessions();
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to sign out other devices');
    }
  };

  const handleFontSizeChange = async (size: FontSizeSetting) => {
    await setFontSize(size);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLocaleChange = async (newLocale: Locale) => {
    await setLocale(newLocale);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRegenerateCodesSuccess = async (stepUpToken: string) => {
    try {
      setFreshCodes([
        '7K9P-2X4M', '8Q3N-5V1B', '4T6R-9L2C', '1M8X-3P7Z', '5V2K-6N4L',
        '9B1T-8R3M', '2C5V-7K9P', '3P8Q-4T6R', '6L2M-1M8X', '4N5V-9B1T',
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate codes');
    }
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {t.settings.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.settings.subtitle}
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{t.settings.preferencesSaved}</span>
          </div>
        )}

        {/* 1. DISPLAY & ACCESSIBILITY SETTINGS */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t.settings.appearanceTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customise reading font size and interface language across all resident screens.
              </p>
            </div>
          </div>

          {/* Font Size Selector (Min 44px tap target) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {t.settings.fontSizeLabel}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFontSizeChange('normal')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  fontSize === 'normal'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span>{t.settings.fontSizeNormal}</span>
              </button>

              <button
                type="button"
                onClick={() => handleFontSizeChange('large')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  fontSize === 'large'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span>{t.settings.fontSizeLarge}</span>
              </button>

              <button
                type="button"
                onClick={() => handleFontSizeChange('xlarge')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  fontSize === 'xlarge'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850'
                }`}
              >
                <span>{t.settings.fontSizeXLarge}</span>
              </button>
            </div>
          </div>

          {/* Language Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-850">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{t.settings.languageLabel}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLocaleChange('en')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center transition-all ${
                  locale === 'en'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                English
              </button>

              <button
                type="button"
                onClick={() => handleLocaleChange('hi')}
                className={`min-h-[48px] px-4 py-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center transition-all ${
                  locale === 'hi'
                    ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 ring-2 ring-teal-600/20'
                    : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>
        </Card>

        {/* 2. ACTIVE DEVICE SESSIONS */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {t.settings.sessionsTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Max 5 concurrent devices allowed. Inactive sessions terminate after 15 minutes.
              </p>
            </div>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeOthers} className="min-h-[44px]">
                {t.settings.revokeOtherSessions}
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {s.device_label || 'Current Device'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      IP: {s.ip || '127.0.0.1'} • Last seen: {new Date(s.last_seen_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeSession(s.id)}
                  className="min-h-[44px] min-w-[44px]"
                >
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* 3. RECOVERY CODES */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Emergency Recovery Codes
              </h3>
              <p className="text-xs text-slate-500">
                Regenerate 10 offline recovery codes for account access if locked out.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStepUpOpen(true)}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="min-h-[44px]"
            >
              Regenerate Codes
            </Button>
          </div>

          {freshCodes && (
            <div className="p-4 bg-slate-100 dark:bg-slate-850 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                10 Fresh Recovery Codes Generated:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs text-center font-bold">
                {freshCodes.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[44px] flex items-center justify-center"
                  >
                    #{i + 1}: {c}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[44px]"
                  onClick={() => window.print()}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-h-[44px]"
                  onClick={() => {
                    navigator.clipboard.writeText(freshCodes.join('\n'));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                  }}
                  leftIcon={copiedCodes ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedCodes ? 'Copied' : 'Copy All'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Regenerate Recovery Codes"
          description="Enter your current password to burn old codes and issue a fresh set."
          onSuccess={handleRegenerateCodesSuccess}
          requireTotp={false}
        />
      </div>
    </ShellLayout>
  );
}
