'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AuthLayout,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CodeInput,
  Stepper,
  Button,
  Alert,
  CopyButton,
  RecoveryCodesGrid,
} from '@grievease/ui';
import { Smartphone, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

const STEPS = [
  { id: 1, label: 'Code' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Password' },
  { id: 4, label: 'Authenticator' },
  { id: 5, label: 'All Set' },
];

function ActivateTotpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const { locale, setLocale } = useAccessibility();

  const [totpData, setTotpData] = useState<{
    totpToken: string;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackupConfirmed, setIsBackupConfirmed] = useState(false);

  useEffect(() => {
    if (!token) return;
    api
      .enrolTotp(token)
      .then((data) => setTotpData(data))
      .catch((err) => setError(err.message || 'Failed to initialize TOTP enrolment.'));
  }, [token]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpData) return;
    setError(null);

    if (code.trim().length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    try {
      await api.confirmTotp({
        totpToken: totpData.totpToken,
        code: code.trim(),
      });
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid 6-digit code. Please verify the time on your authenticator app.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <div className="mb-6">
          <Stepper steps={STEPS} currentStep={4} />
        </div>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enrol 2-Factor Authenticator (TOTP)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Administrative roles require offline Time-Based One-Time Password (TOTP) enforcement before entering the system.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {totpData ? (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                    <img src={totpData.qrCode} alt="TOTP QR Code" className="w-32 h-32" />
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      <span>Scan with Authenticator App</span>
                    </div>
                    <p>Use Google Authenticator, Microsoft Authenticator, or Bitwarden on your mobile phone.</p>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                        Or enter key manually:
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-200 dark:bg-slate-700 p-1.5 rounded-lg select-all text-slate-900 dark:text-slate-100">
                        <span className="truncate">{totpData.secret}</span>
                        <CopyButton textToCopy={totpData.secret} iconOnly />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <CodeInput
                    length={6}
                    label="Enter 6-Digit Authenticator Code"
                    value={code}
                    onChange={(c) => setCode(c)}
                    allowAlpha={false}
                    autoFocus
                  />
                </div>

                {totpData.backupCodes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <RecoveryCodesGrid
                      codes={totpData.backupCodes}
                      isConfirmed={isBackupConfirmed}
                      onConfirmChange={setIsBackupConfirmed}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.push('/activate')}
                    leftIcon={<ArrowLeft className="w-4 h-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={!isBackupConfirmed}
                    className="flex-1 text-base font-bold shadow-md shadow-teal-900/10"
                    isLoading={isLoading}
                    rightIcon={<ArrowRight className="w-5 h-5" />}
                  >
                    Confirm &amp; Access Admin
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Initializing authenticator security vault...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function ActivateTotpPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading...
        </div>
      }
    >
      <ActivateTotpContent />
    </React.Suspense>
  );
}
