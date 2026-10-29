'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AuthLayout,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  PasswordField,
  Stepper,
  Button,
  Alert,
} from '@grievease/ui';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

const STEPS = [
  { id: 1, label: 'Code' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Password' },
  { id: 4, label: 'Recovery' },
  { id: 5, label: 'All Set' },
];

function SetInitialPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const isAdmin = searchParams?.get('isAdmin') === 'true';

  const { t, locale, setLocale } = useAccessibility();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const minLength = isAdmin ? 12 : 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.setInitialPassword({
        activationToken: token,
        newPassword: password,
        confirmPassword,
      });

      if (isAdmin) {
        router.push(`/activate/totp?token=${encodeURIComponent(token)}`);
      } else {
        router.push(`/activate/recovery?token=${encodeURIComponent(token)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Your activation session may have expired.');
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
          <Stepper steps={STEPS} currentStep={3} />
        </div>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.auth.passwordStepTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.auth.passwordStepSubtitle} &bull;{' '}
              {isAdmin
                ? 'Admin accounts require at least 12 characters.'
                : 'Must be at least 10 characters.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <PasswordField
                id="initial-password"
                label={t.auth.newPasswordLabel}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showStrengthMeter
                minStrengthLength={minLength}
                required
                autoFocus
              />

              <PasswordField
                id="initial-password-confirm"
                label={t.auth.confirmPasswordLabel}
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

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
                  className="flex-1 text-base font-bold shadow-md shadow-teal-900/10"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t.auth.setPasswordButton}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function SetInitialPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading...
        </div>
      }
    >
      <SetInitialPasswordContent />
    </React.Suspense>
  );
}
