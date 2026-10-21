'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { KeyRound, ShieldCheck, ArrowRight, Smartphone } from 'lucide-react';
import { api } from '@/lib/api-client';

function TwoFactorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tempToken = searchParams?.get('temp') || '';
  const isSetup = searchParams?.get('setup') === 'true';
  const nextUrl = searchParams?.get('next') || '/admin';

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup state if require2faSetup
  const [setupData, setSetupData] = useState<{
    totpToken: string;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isSetup && setupData) {
        await api.confirmTotp({
          totpToken: setupData.totpToken,
          code: code.trim(),
        });
      } else {
        await api.verify2fa({
          tempToken,
          code: code.trim(),
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </Link>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 w-fit mb-1">
              Two-Factor Authentication
            </div>
            <CardTitle className="text-xl">
              {isSetup ? 'Enrol Offline Authenticator' : 'Verify Authenticator Code'}
            </CardTitle>
            <CardDescription>
              {isSetup
                ? 'Scan the QR code below with your mobile authenticator app.'
                : 'Enter the 6-digit code from your authenticator app or an 8-character backup code.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger">{error}</Alert>}

            {isSetup && setupData && (
              <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex justify-center p-2 bg-white rounded-lg shadow-sm">
                  <img src={setupData.qrCode} alt="TOTP QR" className="w-32 h-32" />
                </div>
                <div className="text-xs text-slate-500 font-mono text-center select-all">
                  Key: {setupData.secret}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="login-2fa-code"
                label={isSetup ? 'Enter 6-Digit Code to Confirm' : '6-Digit TOTP or Backup Code'}
                placeholder={isSetup ? '123456' : '123456 or ABCD-1234'}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="text-lg font-mono tracking-widest text-center"
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verify & Continue
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              <Link href="/login" className="hover:underline">
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TwoFactorPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <TwoFactorContent />
    </React.Suspense>
  );
}
