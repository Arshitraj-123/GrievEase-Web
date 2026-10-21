'use client';

import React from 'react';
import Link from 'next/link';
import { Card, Button } from '@grievease/ui';
import { WifiOff, RotateCcw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <WifiOff className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">You Are Offline</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          GrievEase requires an active local or intranet connection to communicate with the society database.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors text-sm shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      </Card>
    </div>
  );
}
