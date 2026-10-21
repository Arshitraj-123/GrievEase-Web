import React from 'react';
import { Card } from '@grievease/ui';
import { Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full border border-slate-200 dark:border-slate-800 text-center p-8 space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <Wrench className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Scheduled Maintenance</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          The society server is currently undergoing cryptographic backup and database index optimization. Please check back shortly.
        </p>
      </Card>
    </div>
  );
}
