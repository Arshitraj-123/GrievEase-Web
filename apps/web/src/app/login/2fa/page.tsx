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
  TextField,
  Button,
  Alert,
  CopyButton,
  RecoveryCodesGrid,
} from '@grievease/ui';
import { ShieldCheck, KeyRound, Smartphone, ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams?.get('temp') || '';
  const isSetup = searchParams?.get('setup') === 'true';
  const nextUrl = searchParams?.get('next') || '/admin';

  const { t, locale, setLocale } = useAccessibility();

  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup state if require2faSetup
  const [setupData, setSetupData] = useState<{
    totpToken: string;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [isBackupConfirmed, setIsBackupConfirmed] = useState(false);

  useEffect(() => {
    if (!tempToken) {
      router.push('/login');
      return;
    }
    if (isSetup) {
      api
        .enrolTotp(tempToken)
        .then((data) => setSetupData(data))
        .catch((err) => setError(err.message || 'Failed to initialize TOTP setup.'));
    }
  }, [tempToken, isSetup, router]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    const submissionCode = useBackupCode ? backupCode.trim().toUpperCase() : code.trim();
    if (!submissionCode) {
      setError(useBackupCode ? 'Please enter your backup code.' : 'Please enter the 6-digit authenticator code.');
      return;
    }

    setIsLoading(true);

    try {
      if (isSetup && setupData) {
        await api.confirmTotp({
          totpToken: setupData.totpToken,
          code: submissionCode,
        });
      } else {
        await api.verify2fa({
          tempToken,
          code: submissionCode,
        });
      }

      router.push(nextUrl);
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA code. Please check your authenticator clock or backup code.');
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
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-300 w-fit mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Two-Factor Authentication</span>
            </div>

            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isSetup ? 'Enrol Offline Authenticator' : t.auth.twoFactorTitle}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isSetup
                ? 'Scan the QR code below with your mobile authenticator app (Google Authenticator, Microsoft Authenticator, or Bitwarden).'
                : useBackupCode
                ? 'Enter one of your 8-character single-use emergency backup codes.'
                : t.auth.twoFactorSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {isSetup && setupData && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                    <img src={setupData.qrCode} alt="TOTP QR" className="w-32 h-32" />
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      <span>Scan with Authenticator</span>
                    </div>
                    <p>Open your authenticator app and point your camera at the QR code.</p>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                        Manual secret key:
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-200 dark:bg-slate-700 p-1.5 rounded-lg select-all text-slate-900 dark:text-slate-100">
                        <span className="truncate">{setupData.secret}</span>
                        <CopyButton textToCopy={setupData.secret} iconOnly />
                      </div>
                    </div>
                  </div>
                </div>

                {setupData.backupCodes && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <RecoveryCodesGrid
                      codes={setupData.backupCodes}
                      isConfirmed={isBackupConfirmed}
                      onConfirmChange={setIsBackupConfirmed}
                    />
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!useBackupCode ? (
                <div className="space-y-1.5">
                  <CodeInput
                    length={6}
                    label={t.auth.twoFactorCodeLabel}
                    value={code}
                    onChange={(val) => setCode(val)}
                    onComplete={(val) => {
                      if (!isSetup || isBackupConfirmed) {
                        setCode(val);
                      }
                    }}
                    allowAlpha={false}
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <TextField
                    id="backup-code-input"
                    label="8-Character Backup Code"
                    placeholder="e.g. A1B2-C3D4"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    className="font-mono tracking-widest uppercase"
                    autoFocus
                    required
                  />
                </div>
              )}

              {/* Toggle Between TOTP and Backup Code */}
              {!isSetup && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode((prev) => !prev);
                      setError(null);
                    }}
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold min-h-[36px]"
                  >
                    {useBackupCode ? 'Use 6-digit authenticator code instead' : t.auth.useBackupCode}
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => router.push('/login')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSetup && !isBackupConfirmed}
                  className="flex-1 text-base font-bold shadow-md shadow-teal-900/10"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t.auth.verify2faButton}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function TwoFactorPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading 2FA...
        </div>
      }
    >
      <TwoFactorContent />
    </React.Suspense>
  );
}
