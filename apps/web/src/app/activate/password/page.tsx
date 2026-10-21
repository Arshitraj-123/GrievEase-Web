'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api-client';

function SetInitialPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') || '';
  const isAdmin = searchParams?.get('isAdmin') === 'true';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const minLength = isAdmin ? 12 : 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < minLength) {
      setError(`Password must be at least ${minLength} characters long.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.setInitialPassword({
        activationToken: token,
        newPassword: password,
        confirmPassword,
      });

      if (isAdmin) {
        router.push(`/activate/totp?token=${encodeURIComponent(token)}`);
      } else {
        router.push(`/activate/recovery?token=${encodeURIComponent(token)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Your activation session may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-2xl font-black text-slate-900 dark:text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">G</span>
            <span>Griev<span className="text-teal-600">Ease</span></span>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 w-fit mb-1">
              Step 2 of 3: Create Password
            </div>
            <CardTitle className="text-xl">Set your password</CardTitle>
            <CardDescription>
              Choose a strong, memorable passphrase. {isAdmin ? 'Admin accounts require at least 12 characters.' : 'Must be at least 10 characters.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="danger">{error}</Alert>}

              <Input
                id="initial-password"
                label="New Password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                helperText={`Minimum ${minLength} characters. Avoid dictionary words, birthdays or flat numbers.`}
                required
              />

              <Input
                id="initial-password-confirm"
                label="Confirm Password"
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Save & Proceed to Recovery Setup
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SetInitialPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SetInitialPasswordContent />
    </React.Suspense>
  );
}
