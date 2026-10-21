'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { ShieldCheck, HelpCircle, Printer, Copy, Check, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';

function ActivateRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';

  const [questions, setQuestions] = useState([
    { ordinal: 1, questionText: '', answer: '' },
    { ordinal: 2, questionText: '', answer: '' },
    { ordinal: 3, questionText: '', answer: '' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [issuedCodes, setIssuedCodes] = useState<string[] | null>(null);
  const [hasConfirmedSaved, setHasConfirmedSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleQuestionChange = (index: number, field: 'questionText' | 'answer', value: string) => {
    const updated = [...questions];
    if (updated[index]) {
      updated[index][field] = value;
      setQuestions(updated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate 3 questions
    for (let i = 0; i < 3; i++) {
      const q = questions[i];
      if (!q || !q.questionText || q.questionText.trim().length < 10) {
        setError(`Question #${i + 1} must be at least 10 characters long.`);
        return;
      }
      if (!q.answer || q.answer.trim().replace(/[^a-zA-Z0-9]/g, '').length < 6) {
        setError(`Answer for Question #${i + 1} must be at least 6 letters/numbers.`);
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
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save security questions. Please review requirements.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCodes = () => {
    if (!issuedCodes) return;
    navigator.clipboard.writeText(issuedCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // If recovery codes issued: show confidential print/copy screen
  if (issuedCodes) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-lg space-y-6">
          <Card className="border border-teal-300 dark:border-teal-700 shadow-2xl">
            <CardHeader className="space-y-1 pb-4 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 mb-2">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <CardTitle className="text-xl">Your Single-Use Recovery Codes</CardTitle>
              <CardDescription>
                These 10 codes are shown <strong className="text-slate-900 dark:text-white">ONLY ONCE</strong> and cannot be retrieved later. Each code can immediately reset your password if you lose access.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-center">
                <div className="grid grid-cols-2 gap-2 text-sm font-bold tracking-wider text-slate-800 dark:text-slate-200">
                  {issuedCodes.map((code, idx) => (
                    <div key={idx} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-xs text-slate-400 mr-2">#{idx + 1}</span>
                      <span>{code}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
                  Print Codes
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={handleCopyCodes} leftIcon={copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}>
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </div>

              <label className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasConfirmedSaved}
                  onChange={(e) => setHasConfirmedSaved(e.target.checked)}
                  className="mt-0.5 rounded border-amber-400 text-teal-600 focus:ring-teal-500"
                />
                <span>I confirm that I have safely printed or written down these 10 recovery codes.</span>
              </label>

              <Button
                variant="primary"
                className="w-full"
                disabled={!hasConfirmedSaved}
                onClick={() => router.push('/app')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Complete Activation & Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              Step 3 of 3: Security Questions
            </div>
            <CardTitle className="text-xl">Set up account recovery</CardTitle>
            <CardDescription>
              Write 3 personal security questions. You will need to answer all 3 correctly if you forget your password.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <Alert variant="danger">{error}</Alert>}

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-xs text-blue-900 dark:text-blue-200 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>On-screen guidance for strong security questions:</span>
                </div>
                <p className="opacity-90">
                  • Avoid public or obvious info: family names, birthdays, flat numbers, vehicle numbers, pet names.<br />
                  • Answers must be at least 6 letters/digits.<br />
                  • Spaces, punctuation and letter casing are ignored when you verify.
                </p>
              </div>

              {[0, 1, 2].map((idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                    Question #{idx + 1}
                  </span>
                  <Input
                    label="Your Custom Question"
                    placeholder="e.g. What was the model of your first bicycle?"
                    value={questions[idx]?.questionText || ''}
                    onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                    required
                  />
                  <Input
                    label="Your Secret Answer"
                    placeholder="e.g. RedHeroRacer"
                    value={questions[idx]?.answer || ''}
                    onChange={(e) => handleQuestionChange(idx, 'answer', e.target.value)}
                    helperText="Minimum 6 characters. Kept strictly confidential."
                    required
                  />
                </div>
              ))}

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-3"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Save Questions & Generate Recovery Codes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ActivateRecoveryPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActivateRecoveryContent />
    </React.Suspense>
  );
}
