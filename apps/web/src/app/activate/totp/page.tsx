'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { ShieldCheck, KeyRound, Copy, Check, ArrowRight, Smartphone } from 'lucide-react';
import { api } from '@/lib/api-client';

function ActivateTotpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [totpData, setTotpData] = useState<{
    totpToken: string;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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

  const copySecret = () => {
    if (!totpData) return;
    navigator.clipboard.writeText(totpData.secret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 w-fit mb-1">
              Admin Security Requirement
            </div>
            <CardTitle className="text-xl">Enrol 2-Factor Authentication (TOTP)</CardTitle>
            <CardDescription>
              Administrative roles require offline Time-Based One-Time Password (TOTP) enforcement before entering the system.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && <Alert variant="danger">{error}</Alert>}

            {totpData ? (
              <form onSubmit={handleVerify} className="space-y-5">
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                    <img src={totpData.qrCode} alt="TOTP QR Code" className="w-36 h-36" />
                  </div>
                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-teal-600" />
                      <span>Scan with your Authenticator</span>
                    </div>
                    <p>Use Google Authenticator, Microsoft Authenticator, or Bitwarden on your mobile phone.</p>
                    <div className="pt-1">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Or enter key manually:</span>
                      <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] bg-slate-200 dark:bg-slate-800 p-1.5 rounded-lg select-all text-slate-800 dark:text-slate-200">
                        <span className="truncate">{totpData.secret}</span>
                        <button type="button" onClick={copySecret} className="hover:text-teal-600">
                          {copiedKey ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Emergency Backup Codes (Save these securely)
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300">
                    {totpData.backupCodes.map((bc, idx) => (
                      <span key={idx}>#{idx + 1}: {bc}</span>
                    ))}
                  </div>
                </div>

                <Input
                  id="totp-confirm-code"
                  label="Enter 6-Digit Code from App"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  className="text-lg font-mono tracking-widest text-center"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Verify & Enter Admin Console
                </Button>
              </form>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500 animate-pulse">
                Generating offline authenticator secret...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ActivateTotpPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActivateTotpContent />
    </React.Suspense>
  );
}
