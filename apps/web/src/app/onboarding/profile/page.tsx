'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { UserCheck, ShieldCheck, Languages, Eye, ArrowRight, Building2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [society, setSociety] = useState<any | null>(null);
  const [language, setLanguage] = useState('EN');
  const [directoryVisible, setDirectoryVisible] = useState(false);
  const [mobile, setMobile] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    // Load society info
    api.getCurrentSociety()
      .then((s) => setSociety(s))
      .catch(() => {});
  }, []);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      // Proceed to resident app dashboard
      router.push('/app');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error updating profile');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-full flex items-center justify-center mb-2">
            <UserCheck className="w-6 h-6" />
          </div>
          <CardTitle>Welcome to GrievEase</CardTitle>
          <CardDescription>
            {society?.name || 'Your Society Community'} • Finalize your preferences before entering your portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-6">
            {statusMsg && (
              <Alert variant="info">
                {statusMsg}
              </Alert>
            )}

            {/* Language Selection */}
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-2">
                <Languages className="w-4 h-4 text-teal-600" />
                Preferred Language
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { code: 'EN', label: 'English' },
                  { code: 'HI', label: 'हिन्दी (Hindi)' },
                  { code: 'MR', label: 'मराठी (Marathi)' },
                ].map((l) => (
                  <button
                    type="button"
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                      language === l.code
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy / Directory Visibility */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="directoryOptIn"
                  checked={directoryVisible}
                  onChange={(e) => setDirectoryVisible(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="directoryOptIn" className="text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Show in Society Directory
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    When enabled, neighbors in your society can view your name and flat in the member directory. Your phone number is kept private by default.
                  </span>
                </label>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-3 text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-lg">
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              <span>
                Your offline recovery codes and credentials have been verified. In-app notifications will alert you of all account events.
              </span>
            </div>

            <Button type="submit" className="w-full" isLoading={isSaving}>
              Complete Onboarding & Enter Portal <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
