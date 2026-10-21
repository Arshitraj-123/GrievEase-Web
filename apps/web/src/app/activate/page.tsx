'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { KeyRound, User, Home, ArrowRight, Clipboard, Check } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import LanguageSelector from '@/components/LanguageSelector';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = searchParams?.get('user') || '';
  const initialCode = searchParams?.get('code') || '';

  const { t, locale, setLocale } = useAccessibility();

  const [username, setUsername] = useState(initialUsername);
  const [activationCode, setActivationCode] = useState(initialCode.toUpperCase());
  const [verifyDetail, setVerifyDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pastedNotice, setPastedNotice] = useState(false);

  useEffect(() => {
    if (initialUsername && !username) setUsername(initialUsername);
    if (initialCode && !activationCode) setActivationCode(initialCode.toUpperCase());
  }, [initialUsername, initialCode]);

  const handlePasteCode = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          const clean = text.replace(/[^A-Za-z0-9]/g, '').slice(0, 10).toUpperCase();
          setActivationCode(clean);
          setPastedNotice(true);
          setTimeout(() => setPastedNotice(false), 2500);
        }
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.activate({
        username: username.trim(),
        activationCode: activationCode.trim().toUpperCase(),
        verifyDetail: verifyDetail.trim(),
      });

      if (res.activationToken) {
        router.push(
          `/activate/password?token=${encodeURIComponent(res.activationToken)}&isAdmin=${res.isAdmin ? 'true' : 'false'}`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Invalid activation code or verification detail.');
    } finally {
      setIsLoading(false);
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

        {/* Language selector for residents arriving via QR code */}
        <div className="flex justify-center">
          <LanguageSelector currentLocale={locale} onLocaleChange={setLocale} />
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              Step 1 of 3: Verification
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold">{t.auth.activationTitle}</CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed">
              {t.auth.activationSubtitle}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}

              {/* Username Input: Min 48px height for mobile */}
              <div className="space-y-1.5">
                <Input
                  id="activate-username"
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
              </div>

              {/* Activation Code Input with 1-Tap Paste Button */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="activate-code" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {t.auth.activationCodeLabel}
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    className="min-h-[44px] px-2.5 py-1 text-xs text-teal-600 dark:text-teal-400 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    {pastedNotice ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600 font-bold">{t.auth.codePasted}</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="w-3.5 h-3.5" />
                        <span>{t.auth.pasteFromClipboard}</span>
                      </>
                    )}
                  </button>
                </div>

                <Input
                  id="activate-code"
                  placeholder={t.auth.activationCodePlaceholder}
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="font-mono tracking-widest uppercase text-base sm:text-lg min-h-[48px]"
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </div>

              {/* Verification Detail Input */}
              <div className="space-y-1.5">
                <Input
                  id="activate-verify"
                  label={t.auth.verifyDetailLabel}
                  placeholder={t.auth.verifyDetailPlaceholder}
                  value={verifyDetail}
                  onChange={(e) => setVerifyDetail(e.target.value)}
                  leftIcon={<Home className="w-4 h-4" />}
                  className="min-h-[48px] text-base"
                  helperText="Flat Number (e.g. A-101) or Date of Birth (YYYY-MM-DD)"
                  required
                />
              </div>

              {/* Submit Button (Min 48px height, 44px+ tap target) */}
              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2 min-h-[48px] text-base font-semibold"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {t.auth.verifyAndContinue}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already activated?{' '}
              <Link href="/login" className="font-semibold text-teal-600 dark:text-teal-400 hover:underline min-h-[44px] inline-flex items-center">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActivateContent />
    </React.Suspense>
  );
}
