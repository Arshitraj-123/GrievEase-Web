'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { KeyRound, User, Home, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';

function ActivateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUsername = searchParams?.get('user') || '';

  const [username, setUsername] = useState(initialUsername);
  const [activationCode, setActivationCode] = useState('');
  const [verifyDetail, setVerifyDetail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
              G
            </span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </Link>
          <p className="text-xs text-slate-500">Autonomous Society Governance & Grievance Resolution</p>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              Step 1 of 3: Verification
            </div>
            <CardTitle className="text-xl">Activate your account</CardTitle>
            <CardDescription>
              Enter the 10-character code from your physical credential slip handed over by your secretary.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Input
                id="activate-username"
                label="Username / Member ID"
                placeholder="e.g. resident.rohan or GV-A101-R1"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                required
              />

              <Input
                id="activate-code"
                label="10-Character Activation Code"
                placeholder="e.g. 7K9P2X4M8Q"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                maxLength={10}
                className="font-mono tracking-widest uppercase text-base"
                leftIcon={<KeyRound className="w-4 h-4" />}
                helperText="Look for the 10-character code on your credential slip."
                required
              />

              <Input
                id="activate-verify"
                label="Verification Detail"
                placeholder="e.g. A-101 or 1990-05-12"
                value={verifyDetail}
                onChange={(e) => setVerifyDetail(e.target.value)}
                leftIcon={<Home className="w-4 h-4" />}
                helperText="Flat Number (e.g. A-101) or Date of Birth (YYYY-MM-DD) present in society register."
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Verify & Continue
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already activated?{' '}
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

export default function ActivatePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActivateContent />
    </React.Suspense>
  );
}
