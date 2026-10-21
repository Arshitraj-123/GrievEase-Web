'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Button } from '@grievease/ui';
import { Clock, ArrowRight } from 'lucide-react';

function SessionExpiredContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams?.get('next') || '/';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Clock className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Session Expired</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          You were signed out due to 15 minutes of inactivity or session timeout. Please sign in again to continue.
        </p>
        <Button
          variant="primary"
          className="w-full mt-2"
          onClick={() => router.push(`/login?next=${encodeURIComponent(nextUrl)}`)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Sign In Again
        </Button>
      </Card>
    </div>
  );
}

export default function SessionExpiredPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SessionExpiredContent />
    </React.Suspense>
  );
}
