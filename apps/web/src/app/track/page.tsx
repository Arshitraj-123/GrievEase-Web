import React from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@grievease/ui';
import { Search, ArrowLeft, Clock } from 'lucide-react';

export default function TrackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 flex items-center justify-center mx-auto">
          <Search className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <Badge variant="warning" className="mb-1">
            Phase 3 Module
          </Badge>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Track Grievance</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          Public complaint tracking, SLA countdowns, and resolution proof inspection will arrive in Phase 3.
        </p>
        <div className="pt-2">
          <Link href="/">
            <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Home
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
