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
  TextField,
  Stepper,
  Button,
  Alert,
  RecoveryCodesGrid,
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

const EXAMPLE_QUESTIONS = [
  'What is the street name where you grew up?',
  'What was the make and model of your first vehicle?',
  'In what city did your parents meet?',
];

function ActivateRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const { t, locale, setLocale } = useAccessibility();

  const [questions, setQuestions] = useState([
    { ordinal: 1, questionText: '', answer: '' },
    { ordinal: 2, questionText: '', answer: '' },
    { ordinal: 3, questionText: '', answer: '' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [issuedCodes, setIssuedCodes] = useState<string[] | null>(null);
  const [hasConfirmedSaved, setHasConfirmedSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    for (let i = 0; i < 3; i++) {
      const q = questions[i];
      if (!q || !q.questionText || q.questionText.trim().length < 10) {
        setError(`Security question #${i + 1} must be at least 10 characters long.`);
        return;
      }
      if (!q.answer || q.answer.trim().replace(/[^a-zA-Z0-9]/g, '').length < 6) {
        setError(`Answer for question #${i + 1} must be at least 6 letters/numbers.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await api.setupRecovery({
        activationToken: token,
        questions,
      });

      if (res.recoveryCodes) {
        setIssuedCodes(res.recoveryCodes);
      } else {
        router.push('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save security questions. Please review requirements.');
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
          <Stepper steps={STEPS} currentStep={4} />
        </div>

        <Card className="border border-slate-200/90 dark:border-slate-800 shadow-xl dark:shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {issuedCodes ? 'Save Emergency Recovery Codes' : t.auth.recoveryQuestionsTitle}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {issuedCodes
                ? 'These 10 codes are shown ONLY ONCE and allow you to reset your password if locked out.'
                : t.auth.recoveryQuestionsSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {issuedCodes ? (
              <div className="space-y-4">
                <RecoveryCodesGrid
                  codes={issuedCodes}
                  isConfirmed={hasConfirmedSaved}
                  onConfirmChange={setHasConfirmedSaved}
                />

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  disabled={!hasConfirmedSaved}
                  onClick={() => router.push('/app')}
                  className="w-full text-base font-bold shadow-md shadow-teal-900/10"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Complete &amp; Enter Portal
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">Gentle Guidance:</span>
                  {t.auth.securityQuestionsNotice}
                </div>

                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Question #{idx + 1}
                      </span>
                      <span className="text-[10px] text-slate-400">Min 10 characters</span>
                    </div>

                    <TextField
                      placeholder={EXAMPLE_QUESTIONS[idx]}
                      value={q.questionText}
                      onChange={(e) => {
                        const updated = [...questions];
                        if (updated[idx]) {
                          updated[idx].questionText = e.target.value;
                          setQuestions(updated);
                        }
                      }}
                      required
                    />

                    <TextField
                      placeholder="Secret Answer (min 6 alphanumeric characters)"
                      value={q.answer}
                      onChange={(e) => {
                        const updated = [...questions];
                        if (updated[idx]) {
                          updated[idx].answer = e.target.value;
                          setQuestions(updated);
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
                    {t.auth.saveQuestionsButton}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

export default function ActivateRecoveryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600">
          Loading...
        </div>
      }
    >
      <ActivateRecoveryContent />
    </React.Suspense>
  );
}
