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
  TextField,
  PasswordField,
  Button,
  Alert,
  CopyButton,
  RecoveryCodesGrid,
} from '@grievease/ui';
import { ShieldCheck, Lock, User, ArrowRight, Smartphone } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

function FirstRunSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams?.get('token') || '';

  const { locale, setLocale } = useAccessibility();

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
  const [isBackupConfirmed, setIsBackupConfirmed] = useState(false);

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
      <AuthLayout
        LinkComponent={Link}
        currentLocale={locale}
        onLocaleChange={setLocale}
      >
        <div className="w-full">
          <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden text-center p-6 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">Setup Unavailable</CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
              First-time Super Admin bootstrap has already been completed or is permanently locked.
            </p>
            <Button variant="primary" size="lg" className="w-full" onClick={() => router.push('/login')}>
              Go to Sign In
            </Button>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className="w-full">
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Initial Installation</span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {completedData ? 'Super Admin Provisioned' : 'Super Admin Bootstrap'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {completedData
                ? 'Save your offline TOTP authenticator key and 10 master backup codes below.'
                : 'Initialize the root administrator credentials with master token verification.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {completedData ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-teal-50 dark:bg-teal-950/40 rounded-2xl border border-teal-200 dark:border-teal-800 space-y-3">
                  <div className="flex items-center gap-2 text-teal-900 dark:text-teal-100 font-bold">
                    <Smartphone className="w-4 h-4 text-teal-600" />
                    <span>Offline TOTP Secret</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono text-xs bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 select-all">
                    <span className="truncate flex-1">{completedData.totpSecret}</span>
                    <CopyButton textToCopy={completedData.totpSecret} iconOnly />
                  </div>
                </div>

                <div className="space-y-2">
                  <RecoveryCodesGrid
                    codes={completedData.backupCodes || []}
                    isConfirmed={isBackupConfirmed}
                    onConfirmChange={setIsBackupConfirmed}
                  />
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!isBackupConfirmed}
                  className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                  onClick={() => router.push('/login')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Proceed to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <TextField
                  label="Bootstrap Setup Token"
                  value={setupToken}
                  onChange={(e) => setSetupToken(e.target.value)}
                  placeholder="Paste master token from server console"
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                <TextField
                  label="Administrator Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Rajesh Varma"
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <PasswordField
                  label="Master Password (min 12 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showStrengthMeter
                  minStrengthLength={12}
                  required
                />

                <PasswordField
                  label="Confirm Master Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Bootstrap System Root
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function FirstRunSetupPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading setup...
        </div>
      }
    >
      <FirstRunSetupContent />
    </React.Suspense>
  );
}
