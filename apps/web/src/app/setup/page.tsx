'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { ShieldAlert, KeyRound, Lock, User, ArrowRight, Printer, Check, Copy } from 'lucide-react';
import { api } from '@/lib/api-client';

function FirstRunSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams?.get('token') || '';

  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [setupToken, setSetupToken] = useState(initialToken);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Success data
  const [completedData, setCompletedData] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    api
      .getSetupStatus()
      .then((res) => setIsAvailable(res.available))
      .catch(() => setIsAvailable(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 12) {
      setError('Super Admin password must be at least 12 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.setupFirstAdmin({
        setupToken: setupToken.trim(),
        name: name.trim(),
        username: username.trim(),
        password,
      });
      setCompletedData(res);
    } catch (err: any) {
      setError(err.message || 'Setup token is invalid or expired. Check console for new token.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAvailable === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">404 - Setup Unavailable</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            First-time Super Admin bootstrap has already been completed or is permanently locked.
          </p>
          <Button variant="primary" size="sm" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  if (completedData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-lg w-full border border-teal-300 dark:border-teal-700 shadow-2xl space-y-6">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-2">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl">Super Admin Setup Completed</CardTitle>
            <CardDescription>
              Scan your offline Authenticator QR code and store the 10 backup codes. The /setup endpoint is now permanently sealed.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="p-2 bg-white rounded-xl shadow-sm shrink-0">
                <img src={completedData.qrCode} alt="TOTP QR" className="w-36 h-36" />
              </div>
              <div className="text-xs space-y-2">
                <span className="font-semibold text-slate-900 dark:text-white block">Offline TOTP Secret</span>
                <p className="text-slate-500">Scan with Google Authenticator, Microsoft Authenticator, or Bitwarden.</p>
                <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-200 dark:bg-slate-800 p-1.5 rounded-lg select-all">
                  <span className="truncate">{completedData.totpSecret}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(completedData.totpSecret);
                      setCopiedKey(true);
                      setTimeout(() => setCopiedKey(false), 2000);
                    }}
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Emergency Backup Codes (10 Single-Use Codes)
              </div>
              <div className="grid grid-cols-2 gap-1.5 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs">
                {completedData.backupCodes?.map((c: string, idx: number) => (
                  <span key={idx}>#{idx + 1}: {c}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                Print Slip
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={() => router.push('/login')}>
                Go to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </div>
          <p className="text-xs text-slate-500">First-Run Super Admin Bootstrap</p>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              One-Time Initial Setup
            </div>
            <CardTitle className="text-xl">Create First Super Administrator</CardTitle>
            <CardDescription>
              Provide the 256-bit setup token printed to your server terminal via `pnpm admin:bootstrap`.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Input
                id="setup-token"
                label="256-bit Setup Token"
                placeholder="64-character hexadecimal token"
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                leftIcon={<KeyRound className="w-4 h-4" />}
                className="font-mono text-xs"
                required
              />

              <Input
                id="setup-name"
                label="Full Name"
                placeholder="e.g. Chief Administrator"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                id="setup-username"
                label="Username"
                placeholder="superadmin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                id="setup-password"
                label="Password (Minimum 12 characters)"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText="Must be >= 12 characters, not easily guessed."
                required
              />

              <Input
                id="setup-confirm-password"
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Initialize Super Admin & Enrol TOTP
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function FirstRunSetupPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <FirstRunSetupContent />
    </React.Suspense>
  );
}
