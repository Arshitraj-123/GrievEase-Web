'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Alert } from '@grievease/ui';
import { KeyRound, ShieldAlert, CheckCircle2, ArrowRight, Printer, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api-client';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [ticketToken, setTicketToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = searchParams?.get('token') || searchParams?.get('ticket') || searchParams?.get('ticketToken');
    if (token) {
      setTicketToken(token);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!ticketToken.trim()) {
      setError('Reset ticket token is required.');
      return;
    }
    if (newPassword.length < 10) {
      setError('Password must be at least 10 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.resetPasswordWithTicket({
        ticketToken: ticketToken.trim(),
        newPassword,
      });

      if (res.freshRecoveryCodes) {
        setRecoveryCodes(res.freshRecoveryCodes);
      } else {
        router.push('/login?reset=success');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Cooling-off delay may still be active.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    if (!recoveryCodes) return;
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (recoveryCodes) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <CardTitle>Password Successfully Reset</CardTitle>
            <CardDescription>
              Your password has been updated and all active sessions were revoked. Your previous recovery codes have been invalidated. Here is your new set of 10 single-use recovery codes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="warning" title="Save these codes immediately">
              These codes will never be displayed again. Store them securely offline or in a password manager.
            </Alert>

            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl grid grid-cols-2 gap-2 font-mono text-sm">
              {recoveryCodes.map((code, idx) => (
                <div key={idx} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 text-center font-bold">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={copyCodes}>
                {copied ? <Check className="w-4 h-4 mr-2 text-emerald-500" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied' : 'Copy All Codes'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                <Printer className="w-4 h-4 mr-2" />
                Print Slips
              </Button>
            </div>

            <Link href="/login" className="block">
              <Button className="w-full">
                Proceed to Login <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-teal-50 dark:bg-teal-950/50 text-teal-600 rounded-full flex items-center justify-center mb-2">
            <KeyRound className="w-6 h-6" />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your approved recovery ticket token and choose a strong new password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Reset Ticket Token
              </label>
              <Input
                type="text"
                placeholder="e.g. uuid.64hexchars"
                value={ticketToken}
                onChange={(e) => setTicketToken(e.target.value)}
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Issued after completing security questions and cooling-off window.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                New Password
              </label>
              <Input
                type="password"
                placeholder="Min 10 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={10}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-xs text-teal-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
