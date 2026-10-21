import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Custom500() {
  const router = useRouter();
  const refId = (router.query?.ref as string) || (router.query?.referenceId as string) || 'UNKNOWN-REF';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4 shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">500 - Server Error</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          An unexpected error occurred while processing your request. Please share the incident reference below with your administrator:
        </p>
        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 select-all border border-slate-200 dark:border-slate-700">
          Ref ID: {refId}
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm shadow-sm"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
