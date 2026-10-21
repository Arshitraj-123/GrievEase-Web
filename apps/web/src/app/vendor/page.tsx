'use client';

import React from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@grievease/ui';
import { Wrench, CheckCircle2, Clock, Camera } from 'lucide-react';

export default function VendorDashboardPage() {
  const vendorModules = [
    {
      title: 'Assigned Work Orders',
      description: 'View delegated society tasks (electrical, plumbing, carpentry, lift maintenance).',
      icon: <Wrench className="w-6 h-6 text-purple-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Upload Completion Proof',
      description: 'Upload before/after photos and submit technician completion sign-offs.',
      icon: <Camera className="w-6 h-6 text-teal-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Payment & Cash Vouchers',
      description: 'Record cash payment vouchers received from the society treasurer.',
      icon: <Clock className="w-6 h-6 text-green-600" />,
      status: 'Phase 3 Module',
    },
  ];

  return (
    <ShellLayout role="VENDOR" userRoleTitle="Vendor / Technician">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Vendor & Contractor Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Task execution, completion proofs, and service order sign-offs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {vendorModules.map((m, idx) => (
            <Card key={idx} className="opacity-90 hover:opacity-100 transition-opacity">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">{m.icon}</div>
                  <Badge variant="warning" className="text-[10px]">{m.status}</Badge>
                </div>
                <CardTitle className="text-base">{m.title}</CardTitle>
                <CardDescription className="text-xs leading-relaxed">{m.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
