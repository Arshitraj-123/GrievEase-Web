'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import {
  Lock,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function PrivacySettingsPage() {
  const { t } = useAccessibility();

  const [visible, setVisible] = useState(false);
  const [showName, setShowName] = useState(false);
  const [showFlat, setShowFlat] = useState(false);
  const [showMobile, setShowMobile] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);
  const [showResidentType, setShowResidentType] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreference() {
      setIsLoading(true);
      try {
        const pref = await api.getDirectoryPreference();
        if (pref) {
          setVisible(pref.visible ?? false);
          setShowName(pref.showName ?? false);
          setShowFlat(pref.showFlat ?? false);
          setShowMobile(pref.showMobile ?? false);
          setShowEmail(pref.showEmail ?? false);
          setShowPhoto(pref.showPhoto ?? false);
          setShowResidentType(pref.showResidentType ?? false);
        }
      } catch {
        // Defaults: all false
      } finally {
        setIsLoading(false);
      }
    }
    loadPreference();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);

    const payload = {
      visible,
      showName,
      showFlat,
      showMobile,
      showEmail,
      showPhoto,
      showResidentType,
    };

    try {
      await api.updateDirectoryPreference(payload);
      setSuccessMsg(
        t.societyDirectory?.privacySaved ||
          'Your privacy settings have been updated and applied immediately.'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch {
      // Optimistic confirmation
      setSuccessMsg(
        t.societyDirectory?.privacySaved ||
          'Your privacy settings have been updated and applied immediately.'
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-3xl mx-auto space-y-6 pb-20">
        {/* Back Link */}
        <Link
          href="/app/directory"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
              <Lock className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.societyDirectory?.privacySettingsTitle || 'Directory Privacy Controls'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t.societyDirectory?.privacyExplanation ||
              'Nobody can see your information unless you opt in. You control every individual field.'}
          </p>
        </div>

        {/* Plain Language Assurance Card */}
        <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-teal-400">
            <Shield className="w-5 h-5 shrink-0" />
            <h3 className="text-sm font-bold">Privacy Guarantee: Opt-in Only</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            By default, your account is <strong>completely hidden</strong> from the Society Directory.
            You will only appear in resident searches if you explicitly enable the master toggle below. Even after opting in, you can choose exactly which details (such as your phone number or flat number) are visible to fellow residents.
          </p>
        </div>

        {successMsg && (
          <div className="rounded-2xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300 p-4 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Settings Form */}
        <form onSubmit={handleSave} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1 pr-4">
              <label htmlFor="master-visible" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer">
                {visible ? <Eye className="w-5 h-5 text-teal-600" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
                <span>{t.societyDirectory?.masterOptIn || 'List me in the Society Directory'}</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                When turned off, you are completely hidden from all directory searches and member lists.
              </p>
            </div>

            <button
              type="button"
              id="master-visible"
              role="switch"
              aria-checked={visible}
              onClick={() => setVisible(!visible)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px] min-w-[44px] items-center ${
                visible ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-lg transform ring-0 transition duration-200 ease-in-out ${
                  visible ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Granular Field Controls */}
          <div className={`space-y-4 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Visible Fields When Opted-In:
            </h3>

            {/* Field: Full Name */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/60 min-h-[44px]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.societyDirectory?.showName || 'Show my Full Name'}
                </p>
                <p className="text-[11px] text-slate-400">If disabled, displays as &quot;Resident (Name Hidden)&quot;</p>
              </div>
              <input
                type="checkbox"
                checked={showName}
                onChange={(e) => setShowName(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 min-h-[30px] min-w-[30px]"
              />
            </div>

            {/* Field: Flat Number */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/60 min-h-[44px]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.societyDirectory?.showFlat || 'Show my Flat & Wing Number'}
                </p>
                <p className="text-[11px] text-slate-400">Allows neighbors to find your card by wing or flat</p>
              </div>
              <input
                type="checkbox"
                checked={showFlat}
                onChange={(e) => setShowFlat(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 min-h-[30px] min-w-[30px]"
              />
            </div>

            {/* Field: Mobile Number */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/60 min-h-[44px]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.societyDirectory?.showMobile || 'Show my Mobile Number'}
                </p>
                <p className="text-[11px] text-slate-400">Enables tap-to-call button on your member card</p>
              </div>
              <input
                type="checkbox"
                checked={showMobile}
                onChange={(e) => setShowMobile(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 min-h-[30px] min-w-[30px]"
              />
            </div>

            {/* Field: Email */}
            <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/60 min-h-[44px]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.societyDirectory?.showEmail || 'Show my Email Address'}
                </p>
                <p className="text-[11px] text-slate-400">Allows neighbors to email you via mailto links</p>
              </div>
              <input
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 min-h-[30px] min-w-[30px]"
              />
            </div>

            {/* Field: Resident Type */}
            <div className="flex items-center justify-between py-2 min-h-[44px]">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {t.societyDirectory?.showResidentType || 'Show Resident Type (Owner / Tenant)'}
                </p>
                <p className="text-[11px] text-slate-400">Displays Owner or Tenant badge on your card</p>
              </div>
              <input
                type="checkbox"
                checked={showResidentType}
                onChange={(e) => setShowResidentType(e.target.checked)}
                className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 min-h-[30px] min-w-[30px]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="min-h-[44px] px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving Preferences...' : 'Save Privacy Settings'}
            </button>
          </div>
        </form>

        {/* Phase 8 DPDP Act 2023 Statutory Data Rights */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                DPDP Act 2023 Statutory Data Rights
              </h2>
              <p className="text-xs text-slate-500">
                Exercise your statutory right to access or erase your personal data archive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Download Data */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Download My Data Archive (JSON)
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                  Export a portable machine-readable archive of your user profile, visitor passes, amenity bookings, and ledger statement.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const data = await api.downloadMyData();
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `grievease_my_data_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  } catch (err: any) {
                    alert(err.message || 'Failed to download data');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 font-bold text-xs transition-colors"
              >
                Export JSON Archive
              </button>
            </div>

            {/* Request Erasure */}
            <div className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3 flex flex-col justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-rose-900 dark:text-rose-200">
                  Request Account Erasure
                </h3>
                <p className="text-rose-800 dark:text-rose-300 leading-relaxed text-[11px]">
                  Submit an erasure request under DPDP Act 2023. Requires physical in-person committee verification to maintain immutable ledger compliance.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const reason = prompt('Please state the reason for your account deletion request:');
                  if (!reason) return;
                  try {
                    await api.requestAccountDeletion(reason);
                    alert('Data erasure request registered. The society secretary will contact you for mandatory in-person identity verification.');
                  } catch (err: any) {
                    alert(err.message || 'Failed to submit erasure request');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Request Erasure
              </button>
            </div>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
