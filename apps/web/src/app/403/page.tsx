import React from 'react';
import Link from 'next/link';
import { Card, Button } from '@grievease/ui';
import { ShieldX, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldX className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">403 - Access Forbidden</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          You do not have administrative permission to view this section or cross-society tenant isolation has blocked access.
        </p>
        <Link href="/">
          <Button variant="primary" className="w-full mt-2" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
