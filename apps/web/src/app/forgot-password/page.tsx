'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { ShieldCheck, KeyRound, HelpCircle, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function ForgotPasswordPage() {
  const [tab, setTab] = useState<'code' | 'questions'>('code');

  // Recovery Code state
  const [codeUsername, setCodeUsername] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [codeSuccess, setCodeSuccess] = useState<any | null>(null);

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </Link>
          <p className="text-xs text-slate-500">Autonomous Society Governance & Grievance Resolution</p>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Account Recovery</CardTitle>
            <CardDescription>
              Choose your recovery method below. Note: Admin roles must contact the Super Admin directly.
            </CardDescription>

            <div className="flex border-b border-slate-200 dark:border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => { setTab('code'); setError(null); }}
                className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                  tab === 'code'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                1. Recovery Code (Instant)
              </button>
              <button
                type="button"
                onClick={() => { setTab('questions'); setError(null); }}
                className={`flex-1 pb-2.5 text-xs font-semibold text-center border-b-2 transition-colors ${
                  tab === 'questions'
                    ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                2. Security Questions (24h Delay)
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

            {/* TAB 1: RECOVERY CODE */}
            {tab === 'code' && (
              <div>
                {codeSuccess ? (
                  <div className="space-y-4 text-center py-4">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Password Reset Successful</h4>
                    <p className="text-xs text-slate-500">
                      Your previous recovery code has been burned. Below is your fresh set of 10 single-use codes:
                    </p>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs">
                      {codeSuccess.freshRecoveryCodes?.map((c: string, idx: number) => (
                        <span key={idx}>#{idx + 1}: {c}</span>
                      ))}
                    </div>
                    <Button variant="primary" className="w-full mt-2" onClick={() => (window.location.href = '/login')}>
                      Sign in with new password
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleRecoveryCodeReset} className="space-y-4">
                    <Input
                      label="Username / Member ID"
                      placeholder="resident.rohan"
                      value={codeUsername}
                      onChange={(e) => setCodeUsername(e.target.value)}
                      required
                    />

                    <Input
                      label="Single-Use Recovery Code"
                      placeholder="e.g. A1B2-C3D4"
                      value={recoveryCode}
                      onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                      className="font-mono tracking-widest uppercase"
                      leftIcon={<KeyRound className="w-4 h-4" />}
                      helperText="One of the 10 backup codes printed at initial activation."
                      required
                    />

                    <Input
                      label="New Password"
                      type="password"
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      helperText="Minimum 10 characters."
                      required
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />

                    <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                      Reset Password & Get Fresh Codes
                    </Button>
                  </form>
                )}
              </div>
            )}

            {/* TAB 2: SECURITY QUESTIONS */}
            {tab === 'questions' && (
              <div>
                {step === 'enter_user' && (
                  <form onSubmit={handleFetchQuestions} className="space-y-4">
                    <Input
                      label="Enter your Username"
                      placeholder="resident.rohan"
                      value={qUsername}
                      onChange={(e) => setQUsername(e.target.value)}
                      required
                    />
                    <Button type="submit" variant="primary" className="w-full" isLoading={isLoading}>
                      Find Questions & Continue
                    </Button>
                  </form>
                )}

                {step === 'answer_questions' && (
                  <form onSubmit={handleVerifyQuestions} className="space-y-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-200">
                      Please answer all 3 security questions. Max 3 failed attempts allowed per 24 hours.
                    </div>

                    {loadedQuestions.map((q) => (
                      <div key={q.ordinal} className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {q.ordinal}. {q.questionText}
                        </label>
                        <Input
                          placeholder="Your answer"
                          value={answers[q.ordinal] || ''}
                          onChange={(e) =>
                            setAnswers({ ...answers, [q.ordinal]: e.target.value })
                          }
                          required
                        />
                      </div>
                    ))}

                    <Button type="submit" variant="primary" className="w-full mt-2" isLoading={isLoading}>
                      Verify Answers
                    </Button>
                  </form>
                )}

                {step === 'pending_delay' && delayInfo && (
                  <div className="space-y-4 py-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                      <Clock className="w-7 h-7" />
                    </div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">Cooling-Off Window Active</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      All 3 security answers were verified. By client security policy, a mandatory <strong>{delayInfo.coolingOffHours}-hour delay</strong> is active to protect against account takeover.
                    </p>
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                      Eligible for reset at:<br />
                      <strong className="text-slate-900 dark:text-white font-mono text-sm">
                        {new Date(delayInfo.eligibleAt).toLocaleString()}
                      </strong>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Need immediate access? Visit your Secretary in person. They can verify your identity and approve the reset ticket instantly on their admin dashboard.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => (window.location.href = '/login')}>
                      Back to Sign In
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Remembered your credentials?{' '}
              <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
