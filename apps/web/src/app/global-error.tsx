'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white font-sans">
        <div className="max-w-md w-full bg-slate-800 rounded-3xl border border-slate-700 text-center p-8 space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-900/60 text-red-400 flex items-center justify-center mx-auto text-2xl font-black">
            !
          </div>
          <h1 className="text-2xl font-black">Application Error</h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            An unexpected error occurred. Your session data remains safe.
          </p>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => reset()}
              className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all"
            >
              Try Again
            </button>
            <a
              href="/"
              className="flex-1 py-3 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs transition-all flex items-center justify-center"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
