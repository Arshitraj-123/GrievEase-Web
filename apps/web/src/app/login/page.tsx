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
  Countdown,
} from '@grievease/ui';
import { User, ArrowRight, HelpCircle, ShieldCheck, KeyRound, CheckCircle2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { solveChallengeInWorker } from '@grievease/ui';
import { useAccessibility } from '@/components/AccessibilityProvider';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '';
  const reasonParam = searchParams?.get('reason') || '';
  const isResetSuccess = searchParams?.get('reset') === 'success';

  const { t, locale, setLocale } = useAccessibility();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(false);
  const [showMemberIdHelp, setShowMemberIdHelp] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSolvingPow, setIsSolvingPow] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Lockout / Rate limit state
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Load remembered Member ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('grievease_saved_member_id');
      if (saved) {
        setUsername(saved);
        setRememberId(true);
      }
    }
  }, []);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleSubmit = async (
    e?: React.FormEvent,
    powSolution?: { nonce: string; solution: string }
  ) => {
    if (e) e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Inline field validation
    const errs: { username?: string; password?: string } = {};
    if (!username.trim()) {
      errs.username = 'Please enter your Member ID or username.';
    }
    if (!password) {
      errs.password = 'Please enter your password.';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {
      const payload: any = { username: username.trim(), password };
      if (powSolution) {
        payload.challengeNonce = powSolution.nonce;
        payload.challengeSolution = powSolution.solution;
      }

      const res = await api.login(payload);

      // Save or clear remembered Member ID
      if (typeof window !== 'undefined') {
        if (rememberId) {
          localStorage.setItem('grievease_saved_member_id', username.trim());
        } else {
          localStorage.removeItem('grievease_saved_member_id');
        }
      }

      setIsSuccess(true);

      // Handle 2FA redirect
      if (res.require2fa || res.require2faSetup) {
        setTimeout(() => {
          router.push(
            `/login/2fa?temp=${encodeURIComponent(res.tempToken)}&setup=${
              res.require2faSetup ? 'true' : 'false'
            }&next=${encodeURIComponent(nextUrl)}`
          );
        }, 500);
        return;
      }

      // Handle role-based redirect
      setTimeout(() => {
        handleRoleRedirect(res.user?.role || res.role);
      }, 500);
    } catch (err: any) {
      setIsSuccess(false);
      triggerShake();

      if (err instanceof ApiError && err.code === 'CHALLENGE_REQUIRED') {
        setIsSolvingPow(true);
        setError('Security check required. Solving cryptographic challenge...');
        try {
          const solution = await solveChallengeInWorker(err.data.nonce, err.data.difficulty);
          setIsSolvingPow(false);
          return handleSubmit(undefined, { nonce: err.data.nonce, solution });
        } catch {
          setIsSolvingPow(false);
          setError('Challenge verification failed. Please try again.');
        }
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_INVITED') {
        router.push(`/activate?user=${encodeURIComponent(username.trim())}`);
      } else if (err instanceof ApiError && err.code === 'ACCOUNT_LOCKED') {
        const seconds = err.data?.lockoutRemainingSeconds || 900;
        setLockoutSeconds(seconds);
        setError(`This account is temporarily locked due to consecutive failed attempts.`);
      } else {
        if (err.data?.remainingAttempts !== undefined) {
          setRemainingAttempts(err.data.remainingAttempts);
          setError(
            `${err.message || 'Invalid credentials.'} (${err.data.remainingAttempts} ${
              t.auth.attemptsRemaining
            })`
          );
        } else {
          setError(err.message || 'Invalid Member ID or password.');
        }
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
    <AuthLayout
      LinkComponent={Link}
      currentLocale={locale}
      onLocaleChange={setLocale}
    >
      <div className={`w-full transition-transform ${isShaking ? 'animate-shake' : ''}`}>
        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.auth.welcomeBackTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.auth.welcomeBackSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Session Expired Banner */}
            {reasonParam === 'expired' && (
              <Alert variant="warning" title={t.auth.sessionExpiredTitle}>
                {t.auth.sessionExpiredSubtitle}
              </Alert>
            )}

            {/* Protected Route Banner */}
            {nextUrl && !reasonParam && (
              <Alert variant="info" title="Sign In Required">
                Please sign in to access your destination.
              </Alert>
            )}

            {/* Password Reset Success Banner */}
            {isResetSuccess && (
              <Alert variant="success" title="Password Updated">
                Your password was reset successfully. Sign in with your new credentials.
              </Alert>
            )}

            {/* General Form Error Alert */}
            {error && (
              <Alert variant="danger" role="alert">
                <div className="space-y-1">
                  <span>{error}</span>
                  {lockoutSeconds && (
                    <div className="pt-1">
                      <Countdown
                        initialSeconds={lockoutSeconds}
                        onExpire={() => {
                          setLockoutSeconds(null);
                          setError(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              </Alert>
            )}

            {/* Proof-of-Work Verification Banner */}
            {isSolvingPow && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs font-semibold animate-pulse motion-reduce:animate-none"
              >
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>{t.auth.humanVerification}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Member ID / Username Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-username"
                    className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {t.auth.usernameLabel}
                    <span className="text-red-500 ml-1 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowMemberIdHelp((prev) => !prev)}
                    className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-semibold inline-flex items-center gap-1 min-h-[36px]"
                    aria-expanded={showMemberIdHelp}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t.auth.memberIdHelpTitle}</span>
                  </button>
                </div>

                {/* Popover explaining Member ID */}
                {showMemberIdHelp && (
                  <div className="p-3 bg-teal-50/80 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200 space-y-1 animate-fade-in">
                    <p className="font-semibold">{t.auth.memberIdHelpTitle}</p>
                    <p className="text-teal-800 dark:text-teal-300">
                      {t.auth.memberIdHelpText}
                    </p>
                  </div>
                )}

                <TextField
                  id="login-username"
                  placeholder={t.auth.usernamePlaceholder}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  leftIcon={<User className="w-4 h-4" />}
                  error={fieldErrors.username}
                  autoComplete="username"
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="login-password"
                    className="block text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    {t.auth.passwordLabel}
                    <span className="text-red-500 ml-1 font-bold">*</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline font-semibold min-h-[36px] inline-flex items-center"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>

                <PasswordField
                  id="login-password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  error={fieldErrors.password}
                  autoComplete="current-password"
                  required
                />
              </div>

              {/* Remember Member ID Checkbox */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="remember-member-id"
                  type="checkbox"
                  checked={rememberId}
                  onChange={(e) => setRememberId(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
                />
                <label
                  htmlFor="remember-member-id"
                  className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                >
                  {t.auth.rememberMemberId}
                </label>
              </div>

              {/* Primary Sign In Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 text-base font-bold shadow-md shadow-teal-900/10"
                isLoading={isLoading || isSolvingPow}
                isSuccess={isSuccess}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {isLoading ? t.auth.loggingIn : isSuccess ? 'Success!' : t.auth.loginButton}
              </Button>
            </form>

            {/* Secondary Actions & Activation Banner */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
              {/* Highlighted Invitation Card */}
              <Link
                href="/activate"
                className="flex items-center justify-between p-3.5 rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/30 hover:bg-teal-100/60 dark:hover:bg-teal-950/60 transition-colors group text-left min-h-[44px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-teal-700 dark:group-hover:text-teal-300">
                      {t.auth.gotInvitationCode}
                    </span>
                    <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                      {t.auth.activateAccount} &rarr;
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
              </Link>

              {/* Account Locked Helper */}
              <div className="text-center pt-1">
                <Link
                  href="/account-help"
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 min-h-[36px] inline-flex items-center"
                >
                  {t.auth.accountLockedHelp}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading GrievEase...
        </div>
      }
    >
      <LoginContent />
    </React.Suspense>
  );
}
