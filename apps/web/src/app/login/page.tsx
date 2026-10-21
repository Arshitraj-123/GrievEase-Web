'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { ShieldCheck, Lock, User, Cpu, ArrowRight } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { solveChallengeInWorker } from '@grievease/ui';
import { useAccessibility } from '@/components/AccessibilityProvider';
import LanguageSelector from '@/components/LanguageSelector';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '';

  const { t, locale, setLocale } = useAccessibility();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSolvingPow, setIsSolvingPow] = useState(false);

  const handleSubmit = async (e: React.FormEvent, powSolution?: { nonce: string; solution: string }) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload: any = { username, password };
      if (powSolution) {
        payload.challengeNonce = powSolution.nonce;
        payload.challengeSolution = powSolution.solution;
      }

      const res = await api.login(payload);

      if (res.require2fa || res.require2faSetup) {
        router.push(
          `/login/2fa?temp=${encodeURIComponent(res.tempToken)}&setup=${res.require2faSetup ? 'true' : 'false'}&next=${encodeURIComponent(nextUrl)}`
        );
        return;
      }

      // Route by role
      handleRoleRedirect(res.user?.role || res.role);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'CHALLENGE_REQUIRED') {
        // Automatically solve PoW challenge in worker
        setIsSolvingPow(true);
        setError('Security check required. Solving cryptographic challenge...');
        try {
          const solution = await solveChallengeInWorker(err.data.nonce, err.data.difficulty);
          setIsSolvingPow(false);
          // Re-submit with solution
          return handleSubmit(e, { nonce: err.data.nonce, solution });
        } catch {
          setIsSolvingPow(false);
          setError('Challenge verification failed. Please try again.');
        }
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_INVITED') {
        router.push(`/activate?user=${encodeURIComponent(username)}`);
      } else {
        setError(err.message || 'Invalid username or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleRedirect = (role?: string) => {
    if (nextUrl) {
      router.push(nextUrl);
      return;
    }
    switch (role) {
      case 'SECRETARY':
      case 'CHAIRMAN':
      case 'COMMITTEE':
      case 'GOVERNING_BODY':
      case 'SUPER_ADMIN':
        router.push('/admin');
        break;
      case 'GUARD':
        router.push('/guard');
        break;
      case 'VENDOR':
        router.push('/vendor');
        break;
      case 'RESIDENT':
      default:
        router.push('/app');
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        <div className="text-center space-y-1.5">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold text-base">
              G
            </span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </Link>
          <p className="text-xs text-slate-500">Autonomous Society Governance & Grievance Resolution</p>
        </div>

        <div className="flex justify-center mb-2">
          <LanguageSelector currentLocale={locale} onLocaleChange={setLocale} />
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl sm:text-2xl font-bold">{t.auth.loginTitle}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t.auth.loginSubtitle} • No OTP login is required.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {isSolvingPow && (
                <div className="flex items-center gap-3 p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl text-teal-800 dark:text-teal-200 text-xs animate-pulse">
                  <Cpu className="w-5 h-5 shrink-0" />
                  <span>Solving offline proof-of-work challenge on your device...</span>
                </div>
              )}

              <Input
                id="login-username"
                label={t.auth.usernameLabel}
                placeholder={t.auth.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                className="min-h-[48px] text-base"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.auth.passwordLabel}
                  </label>
                  <Link
                    href="/recovery"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-medium min-h-[44px] inline-flex items-center"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <Input
                  id="login-password"
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="min-h-[48px] text-base"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 min-h-[48px] text-base font-semibold"
                isLoading={isLoading || isSolvingPow}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isLoading ? t.auth.loggingIn : t.auth.loginButton}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Received an invitation code?{' '}
                <Link href="/activate" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline min-h-[44px] inline-flex items-center">
                  {t.auth.activateAccount}
                </Link>
              </div>
              <div className="text-[11px] text-slate-400">
                Locked or disabled?{' '}
                <Link href="/account-help" className="underline hover:text-slate-600 min-h-[44px] inline-flex items-center">
                  {t.auth.accountHelp}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
