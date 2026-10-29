'use client';

import React, { useState } from 'react';
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
import { KeyRound, HelpCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

export default function ForgotPasswordPage() {
  const { t, locale, setLocale } = useAccessibility();

  const [tab, setTab] = useState<'code' | 'questions'>('code');

  // Recovery Code state
  const [codeUsername, setCodeUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSuccess, setCodeSuccess] = useState<any | null>(null);
  const [isSavedCodesConfirmed, setIsSavedCodesConfirmed] = useState(false);

  // Security Questions state
  const [qUsername, setQUsername] = useState('');
  const [step, setStep] = useState<'enter_user' | 'answer_questions' | 'pending_delay'>('enter_user');
  const [loadedQuestions, setLoadedQuestions] = useState<{ ordinal: number; questionText: string }[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [delayInfo, setDelayInfo] = useState<any | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handler for Tab 1 (Recovery Code)
  const handleRecoveryCodeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.useRecoveryCode({
        username: codeUsername.trim(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      });
      setCodeSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Invalid recovery code or username.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers for Tab 2 (Security Questions)
  const handleFetchQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.startRecovery(qUsername.trim());
      setLoadedQuestions(res.questions || []);
      setStep('answer_questions');
    } catch (err: any) {
      setError(err.message || 'Could not initiate question recovery.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formattedAnswers = loadedQuestions.map((q) => ({
      ordinal: q.ordinal,
      answer: answers[q.ordinal] || '',
    }));

    try {
      const res = await api.verifyRecoveryQuestions({
        username: qUsername.trim(),
        answers: formattedAnswers,
      });
      setDelayInfo(res);
      setStep('pending_delay');
    } catch (err: any) {
      setError(err.message || 'Verification failed. Max 3 attempts allowed per 24 hours.');
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
          <CardHeader className="space-y-1.5 pb-3">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t.auth.recoveryTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t.auth.recoverySubtitle}
            </CardDescription>

            {/* Segmented Tab Controls */}
            <div className="flex p-1 mt-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setTab('code');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-1.5 ${
                  tab === 'code'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t.auth.recoveryCodeTab}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('questions');
                  setError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all min-h-[40px] flex items-center justify-center gap-1.5 ${
                  tab === 'questions'
                    ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t.auth.securityQuestionsTab}</span>
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {/* ============================================================ */}
            {/* TAB 1: RECOVERY CODE (INSTANT)                               */}
            {/* ============================================================ */}
            {tab === 'code' && (
              <div>
                {codeSuccess ? (
                  <div className="space-y-4 text-center py-2 animate-fade-in">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="font-black text-lg text-slate-900 dark:text-white">
                        Password Reset Successful
                      </h4>
                      <p className="text-xs text-slate-500">
                        Your used recovery code has been burned. Below are your fresh 10 single-use codes:
                      </p>
                    </div>

                    <RecoveryCodesGrid
                      codes={codeSuccess.freshRecoveryCodes || []}
                      isConfirmed={isSavedCodesConfirmed}
                      onConfirmChange={setIsSavedCodesConfirmed}
                    />

                    <Link href="/login" className="block pt-2">
                      <Button
                        variant="primary"
                        size="lg"
                        disabled={!isSavedCodesConfirmed}
                        className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                      >
                        Sign in with New Password
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={handleRecoveryCodeReset} className="space-y-4">
                    <TextField
                      label="Username or Member ID"
                      placeholder="e.g. GV-A101-R1"
                      value={codeUsername}
                      onChange={(e) => setCodeUsername(e.target.value)}
                      required
                    />

                    <TextField
                      label="Single-Use Recovery Code"
                      placeholder="e.g. A1B2-C3D4"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                      leftIcon={<KeyRound className="w-4 h-4" />}
                      helperText="One of the 10 backup codes printed at initial activation."
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
                      {t.auth.resetPasswordButton}
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: SECURITY QUESTIONS                                    */}
            {/* ============================================================ */}
            {tab === 'questions' && (
              <div>
                {step === 'enter_user' && (
                  <form onSubmit={handleFetchQuestions} className="space-y-4">
                    <TextField
                      label="Enter your Member ID or Username"
                      placeholder="e.g. GV-A101-R1"
                      value={qUsername}
                      onChange={(e) => setQUsername(e.target.value)}
                      required
                      autoFocus
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Find Security Questions
                    </Button>
                  </form>
                )}

                {step === 'answer_questions' && (
                  <form onSubmit={handleVerifyQuestions} className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                      Answer all 3 security questions. Max 3 failed attempts allowed per 24 hours.
                    </div>

                    {loadedQuestions.map((q) => (
                      <div
                        key={q.ordinal}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5"
                      >
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {q.ordinal}. {q.questionText}
                        </label>
                        <TextField
                          placeholder="Your answer"
                          value={answers[q.ordinal] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.ordinal]: e.target.value })
                          }
                          required
                        />
                      </div>
                    ))}

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                      isLoading={isLoading}
                      rightIcon={<ArrowRight className="w-5 h-5" />}
                    >
                      Verify Answers
                    </Button>
                  </form>
                )}

                {step === 'pending_delay' && delayInfo && (
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4 animate-fade-in">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Cooling-Off Security Delay Active
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                        Your answers were correct. To protect against unauthorized takeovers, password reset links unlock after the mandatory cooling-off period ({delayInfo.cooldownHours || 24} hours).
                      </p>
                    </div>

                    <Link href="/login" className="block pt-2">
                      <Button variant="outline" size="lg" className="w-full">
                        {t.auth.backToLogin}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}
