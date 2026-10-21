'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled GrievEase UI Error:', error);
  }, [error]);

  return (
    <div className="py-24 px-6 lg:px-12 bg-white flex items-center justify-center min-h-[calc(100vh-200px)] text-center">
      <div className="max-w-md w-full">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-3">Something Went Wrong</h1>
        <p className="text-sm text-[#4A5568] mb-8 leading-relaxed">
          An unexpected glitch occurred while rendering this view. Our error telemetry has been
          notified.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#1A1A2E] text-xs font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
