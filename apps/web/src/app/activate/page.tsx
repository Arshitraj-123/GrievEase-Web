'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CodeInput,
  Stepper,
  Button,
  Alert,
  RecoveryCodesGrid,
  CopyButton,
} from '@grievease/ui';
import {
  KeyRound,
  ShieldCheck,
  User,
  Home,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Smartphone,
  HelpCircle,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';

const STEPS = [
  { id: 1, label: 'Code' },
  { id: 2, label: 'Verify' },
  { id: 3, label: 'Password' },
  { id: 4, label: 'Recovery' },
  { id: 5, label: 'All Set' },
];

const EXAMPLE_QUESTIONS = [
  'What is the street name where you grew up?',
  'What was the make and model of your first vehicle?',
  'In what city did your parents meet?',
  'What was your childhood best friend’s nickname?',
  'What was the name of your first elementary school?',
];

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlUsername = searchParams?.get('user') || '';
  const urlCode = searchParams?.get('code') || '';
  const fromSlip = Boolean(urlCode || urlUsername);

  const { t, locale, setLocale } = useAccessibility();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Step 1: Code & Member ID
  const [username, setUsername] = useState(urlUsername);
  const [activationCode, setActivationCode] = useState(
    urlCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase()
  );

  // Step 2: Verification Detail
  const [verifyDetail, setVerifyDetail] = useState('');

  // Session token returned after step 2 verification
  const [activationToken, setActivationToken] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Step 3: Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 4: Recovery (Resident) / TOTP (Admin)
  const [securityQuestions, setSecurityQuestions] = useState([
    { ordinal: 1, questionText: '', answer: '' },
    { ordinal: 2, questionText: '', answer: '' },
    { ordinal: 3, questionText: '', answer: '' },
  ]);
  const [issuedRecoveryCodes, setIssuedRecoveryCodes] = useState<string[] | null>(null);
  const [isCodesConfirmed, setIsCodesConfirmed] = useState(false);

  // Admin TOTP state
  const [totpData, setTotpData] = useState<{
    totpToken: string;
    secret: string;
    qrCode: string;
    backupCodes: string[];
  } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [isTotpBackupConfirmed, setIsTotpBackupConfirmed] = useState(false);

  // Status & Error handling
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Focus step heading on step transition for screen readers
  useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  // Sync params if they change
  useEffect(() => {
    if (urlUsername && !username) setUsername(urlUsername);
    if (urlCode && !activationCode) {
      setActivationCode(urlCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase());
    }
  }, [urlUsername, urlCode]);

  // Step 1 -> Step 2 validation
  const handleProceedToVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Please enter your Member ID or username.');
      return;
    }
    if (activationCode.trim().length !== 10) {
      setError('Please enter all 10 characters of your activation code.');
      return;
    }

    setCurrentStep(2);
  };

  // Step 2: Submit Activation Verification to Backend
  const handleVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!verifyDetail.trim()) {
      setError('Please provide your flat number or date of birth as recorded on your slip.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.activate({
        username: username.trim(),
        activationCode: activationCode.trim().toUpperCase(),
        verifyDetail: verifyDetail.trim(),
      });

      if (res.activationToken) {
        setActivationToken(res.activationToken);
        setIsAdmin(Boolean(res.isAdmin));
        setCurrentStep(3);
      }
    } catch (err: any) {
      setAttemptCount((prev) => prev + 1);
      setError(err.message || 'Invalid activation code or verification detail.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set Initial Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const minLen = isAdmin ? 12 : 10;
    if (password.length < minLen) {
      setError(`Password must be at least ${minLen} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.setInitialPassword({
        activationToken,
        newPassword: password,
        confirmPassword,
      });

      // If Admin: enrol TOTP; If Resident: proceed to recovery safety net
      if (isAdmin) {
        try {
          const totpRes = await api.enrolTotp(activationToken);
          setTotpData(totpRes);
        } catch {
          // Handled on step 4
        }
      }
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Your session may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4 (Resident): Submit Security Questions & Receive Recovery Codes
  const handleSaveQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < 3; i++) {
      const q = securityQuestions[i];
      if (!q || !q.questionText || q.questionText.trim().length < 10) {
        setError(`Security question #${i + 1} must be at least 10 characters.`);
        return;
      }
      if (!q.answer || q.answer.trim().replace(/[^a-zA-Z0-9]/g, '').length < 6) {
        setError(`Answer for question #${i + 1} must be at least 6 alphanumeric characters.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await api.setupRecovery({
        activationToken,
        questions: securityQuestions,
      });

      if (res.recoveryCodes) {
        setIssuedRecoveryCodes(res.recoveryCodes);
      } else {
        setCurrentStep(5);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save security questions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 4 (Admin): Verify TOTP code
  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!totpData) return;
    setError(null);

    if (totpVerifyCode.trim().length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    try {
      await api.confirmTotp({
        totpToken: totpData.totpToken,
        code: totpVerifyCode.trim(),
      });
      setCurrentStep(5);
    } catch (err: any) {
      setError(err.message || 'Invalid 6-digit code. Please verify your authenticator time sync.');
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
        {/* Progress Stepper Header */}
        <div className="mb-6">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={(step) => {
              if (step < currentStep && currentStep < 5) {
                setCurrentStep(step);
              }
            }}
          />
        </div>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-3">
            {fromSlip && currentStep === 1 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.auth.usingSlipCode}</span>
              </div>
            )}

            <CardTitle
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight focus:outline-none"
            >
              {currentStep === 1 && t.auth.activationTitle}
              {currentStep === 2 && t.auth.verifyIdentityTitle}
              {currentStep === 3 && t.auth.passwordStepTitle}
              {currentStep === 4 && (isAdmin ? 'Authenticator Setup (TOTP)' : 'Recovery Safety Net')}
              {currentStep === 5 && t.auth.allSetTitle}
            </CardTitle>

            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {currentStep === 1 && t.auth.activationSubtitle}
              {currentStep === 2 && t.auth.verifyIdentityExplanation}
              {currentStep === 3 && t.auth.passwordStepSubtitle}
              {currentStep === 4 &&
                (isAdmin
                  ? 'Administrative roles require an offline authenticator app (TOTP) and backup codes.'
                  : t.auth.recoveryQuestionsSubtitle)}
              {currentStep === 5 && t.auth.allSetSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Banner */}
            {error && (
              <Alert variant="danger" role="alert">
                <div className="space-y-1">
                  <span>{error}</span>
                  {attemptCount >= 3 && (
                    <div className="pt-1">
                      <Link
                        href="/account-help"
                        className="text-xs underline font-bold hover:text-red-900 dark:hover:text-red-100 block"
                      >
                        {t.auth.askSecretaryNewCode} &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            {/* ============================================================ */}
            {/* STEP 1: Enter 10-Character Code & Username                   */}
            {/* ============================================================ */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToVerify} className="space-y-4">
                <TextField
                  id="activate-username"
                  label={t.auth.usernameLabel}
                  placeholder={t.auth.usernamePlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                />

                <div className="space-y-1.5">
                  <CodeInput
                    length={10}
                    label={t.auth.activationCodeLabel}
                    value={activationCode}
                    onChange={(code) => setActivationCode(code)}
                    allowAlpha
                    autoFocus={!urlCode}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    10 letters or digits printed on the credential slip handed over by your secretary.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-bold shadow-md shadow-teal-900/10 mt-2"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Continue to Verification
                </Button>
              </form>
            )}

            {/* ============================================================ */}
            {/* STEP 2: Verify Identity Detail (Flat or DOB)                 */}
            {/* ============================================================ */}
            {currentStep === 2 && (
              <form onSubmit={handleVerifyIdentity} className="space-y-4">
                <div className="p-3 bg-teal-50 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-800 text-xs text-teal-950 dark:text-teal-200">
                  <span className="font-semibold block mb-0.5">Two-Party Physical Handover Verification:</span>
                  Enter the verification detail registered on your credential slip (e.g., your flat number or date of birth).
                </div>

                <TextField
                  id="activate-verify-detail"
                  label={t.auth.verifyDetailLabel}
                  placeholder={t.auth.verifyDetailPlaceholder}
                  value={verifyDetail}
                  onChange={(e) => setVerifyDetail(e.target.value)}
                  leftIcon={<Home className="w-4 h-4" />}
                  helperText="Examples: A-101, B-402, or YYYY-MM-DD"
                  required
                  autoFocus
                />

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(1)}
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
                    {t.auth.verifyAndContinue}
                  </Button>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* STEP 3: Create Secure Password                              */}
            {/* ============================================================ */}
            {currentStep === 3 && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-1">
                  <PasswordField
                    id="new-password"
                    label={t.auth.newPasswordLabel}
                    placeholder="Create a strong passphrase"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    showStrengthMeter
                    minStrengthLength={isAdmin ? 12 : 10}
                    userInfoToAvoid={[username, verifyDetail]}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <PasswordField
                    id="confirm-password"
                    label={t.auth.confirmPasswordLabel}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setCurrentStep(2)}
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
            )}

            {/* ============================================================ */}
            {/* STEP 4: Recovery Safety Net (Resident) OR TOTP (Admin)       */}
            {/* ============================================================ */}
            {currentStep === 4 && (
              <div>
                {!isAdmin ? (
                  // Resident Flow: Recovery Codes OR Security Questions
                  issuedRecoveryCodes ? (
                    // Display Recovery Codes with download/copy/print actions
                    <div className="space-y-4">
                      <RecoveryCodesGrid
                        codes={issuedRecoveryCodes}
                        isConfirmed={isCodesConfirmed}
                        onConfirmChange={setIsCodesConfirmed}
                      />

                      <Button
                        type="button"
                        variant="primary"
                        size="lg"
                        disabled={!isCodesConfirmed}
                        onClick={() => setCurrentStep(5)}
                        className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                        rightIcon={<ArrowRight className="w-5 h-5" />}
                      >
                        Continue to Portal
                      </Button>
                    </div>
                  ) : (
                    // Security Questions Form
                    <form onSubmit={handleSaveQuestions} className="space-y-4">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                        <span className="font-semibold block mb-0.5">Gentle Security Guidance:</span>
                        {t.auth.securityQuestionsNotice}
                      </div>

                      {securityQuestions.map((q, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Security Question #{idx + 1}
                            </span>
                            <span className="text-[10px] text-slate-500">Min 10 chars</span>
                          </div>

                          <TextField
                            placeholder={EXAMPLE_QUESTIONS[idx] || 'Enter your custom question'}
                            value={q.questionText}
                            onChange={(e) => {
                              const updated = [...securityQuestions];
                              if (updated[idx]) {
                                updated[idx].questionText = e.target.value;
                                setSecurityQuestions(updated);
                              }
                            }}
                            required
                          />

                          <TextField
                            placeholder="Your secret answer (min 6 letters/numbers)"
                            value={q.answer}
                            onChange={(e) => {
                              const updated = [...securityQuestions];
                              if (updated[idx]) {
                                updated[idx].answer = e.target.value;
                                setSecurityQuestions(updated);
                              }
                            }}
                            required
                          />
                        </div>
                      ))}

                      <div className="flex items-center gap-3 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          onClick={() => setCurrentStep(3)}
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
                          Save Questions &amp; View Codes
                        </Button>
                      </div>
                    </form>
                  )
                ) : (
                  // Admin Flow: TOTP Authenticator Enrolment
                  <div className="space-y-4">
                    {totpData ? (
                      <form onSubmit={handleVerifyTotp} className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                          <div className="p-2 bg-white rounded-xl shadow-xs shrink-0">
                            <img src={totpData.qrCode} alt="TOTP QR Code" className="w-32 h-32" />
                          </div>
                          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Smartphone className="w-4 h-4 text-teal-600" />
                              <span>Scan with Authenticator App</span>
                            </div>
                            <p>Use Google Authenticator, Microsoft Authenticator, or Bitwarden on your mobile phone.</p>
                            <div>
                              <span className="text-[10px] uppercase text-slate-400 font-bold block mb-1">
                                Or enter secret manually:
                              </span>
                              <div className="flex items-center gap-2 font-mono text-[11px] bg-slate-200 dark:bg-slate-700 p-1.5 rounded-lg select-all text-slate-900 dark:text-slate-100">
                                <span className="truncate">{totpData.secret}</span>
                                <CopyButton textToCopy={totpData.secret} iconOnly />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 6-Digit Code Verification */}
                        <div className="space-y-1.5">
                          <CodeInput
                            length={6}
                            label="Enter 6-Digit Authenticator Code"
                            value={totpVerifyCode}
                            onChange={(c) => setTotpVerifyCode(c)}
                            allowAlpha={false}
                            autoFocus
                          />
                        </div>

                        {/* Backup Codes Display */}
                        {totpData.backupCodes && (
                          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <RecoveryCodesGrid
                              codes={totpData.backupCodes}
                              isConfirmed={isTotpBackupConfirmed}
                              onConfirmChange={setIsTotpBackupConfirmed}
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setCurrentStep(3)}
                            leftIcon={<ArrowLeft className="w-4 h-4" />}
                          >
                            Back
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!isTotpBackupConfirmed}
                            className="flex-1 text-base font-bold shadow-md shadow-teal-900/10"
                            isLoading={isLoading}
                            rightIcon={<ArrowRight className="w-5 h-5" />}
                          >
                            Confirm Authenticator
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="text-center py-6 space-y-3">
                        <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs text-slate-500">Initializing authenticator security vault...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* STEP 5: Success & Completion                                 */}
            {/* ============================================================ */}
            {currentStep === 5 && (
              <div className="text-center py-4 space-y-6 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                    {t.auth.allSetTitle}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Your account credentials, password, and security safety net have been verified. You may now enter your society portal.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Activated Account:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Access Channel:</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {isAdmin ? 'Administrative Council Portal' : 'Resident Portal'}
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="w-full text-base font-bold shadow-lg shadow-teal-900/20"
                  onClick={() => router.push(isAdmin ? '/admin' : '/app')}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t.auth.goToDashboard}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function ActivatePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading activation wizard...
        </div>
      }
    >
      <ActivateContent />
    </React.Suspense>
  );
}
