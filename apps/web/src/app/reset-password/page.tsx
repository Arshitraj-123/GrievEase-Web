'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  RecoveryCodesGrid,
} from '@grievease/ui';
import { KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const { locale, setLocale } = useAccessibility();

  const [ticketToken, setTicketToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [isCodesConfirmed, setIsCodesConfirmed] = useState(false);

  useEffect(() => {
    const token =
      searchParams?.get('token') ||
      searchParams?.get('ticket') ||
      searchParams?.get('ticketToken');
    if (token) {
      setTicketToken(token);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ticketToken.trim()) {
      setError('Reset ticket token is required.');
      return;
    }
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPasswordWithTicket({
        ticketToken: ticketToken.trim(),
        newPassword,
      });

      if (res.freshRecoveryCodes) {
        setRecoveryCodes(res.freshRecoveryCodes);
      } else {
        router.push('/login?reset=success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Cooling-off delay may still be active.');
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
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {recoveryCodes ? 'Fresh Recovery Codes' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {recoveryCodes
                ? 'Your password has been updated. Securely store your 10 newly generated recovery codes.'
                : 'Enter your new passphrase to regain access to your account.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {recoveryCodes ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />

                <RecoveryCodesGrid
                  codes={recoveryCodes}
                  isConfirmed={isCodesConfirmed}
                  onConfirmChange={setIsCodesConfirmed}
                />

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!isCodesConfirmed}
                  onClick={() => router.push('/login?reset=success')}
                  className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Continue to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <TextField
                  label="Reset Ticket Token"
                  value={ticketToken}
                  onChange={(e) => setTicketToken(e.target.value)}
                  placeholder="Paste your reset token"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  required
                />

                <PasswordField
                  label="New Password"
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  showStrengthMeter
                  minStrengthLength={10}
                  required
                />

                <PasswordField
                  label="Confirm New Password"
                  placeholder="••••••••••••"
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
                  Set New Password
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
