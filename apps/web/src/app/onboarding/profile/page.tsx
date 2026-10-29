'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AuthLayout,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  TextField,
  Button,
  Alert,
} from '@grievease/ui';
import { UserCheck, Languages, ArrowRight, Building2, Phone } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { locale, setLocale } = useAccessibility();

  const [society, setSociety] = useState<any | null>(null);
  const [selectedLang, setSelectedLang] = useState<'en' | 'hi' | 'mr'>(locale);
  const [mobile, setMobile] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCurrentSociety()
      .then((s) => setSociety(s))
      .catch(() => {});
  }, []);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMsg(null);

    try {
      await setLocale(selectedLang);
      router.push('/app');
    } catch (err: any) {
      setStatusMsg(err.message || 'Error updating profile');
      setIsSaving(false);
    }
  };

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-3 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800 shadow-xs">
              <UserCheck className="w-7 h-7" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Welcome to GrievEase
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {society?.name || 'Your Society Community'} &bull; Finalize your preferences before entering your portal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {statusMsg && <Alert variant="info">{statusMsg}</Alert>}

            <form onSubmit={handleComplete} className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Languages className="w-4 h-4 text-teal-600" />
                  <span>Preferred Interface Language</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिन्दी' },
                    { code: 'mr', label: 'मराठी' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setSelectedLang(l.code as 'en' | 'hi' | 'mr')}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        selectedLang === l.code
                          ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Phone (Optional) */}
              <TextField
                label="Emergency Contact Number (Optional)"
                placeholder="+91 98765 43210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="Used only for urgent emergency council broadcasts."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-base font-bold shadow-md shadow-teal-900/10 mt-2"
                isLoading={isSaving}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Enter Resident Portal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
