'use client';

import React from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, Badge } from '@grievease/ui';
import { ShieldCheck, UserCheck, Truck, AlertTriangle } from 'lucide-react';

export default function GuardDashboardPage() {
  const guardModules = [
    {
      title: 'Visitor Passcode Check-In',
      description: 'Verify 6-digit resident visitor passcodes and log vehicle plate numbers.',
      icon: <UserCheck className="w-6 h-6 text-teal-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Delivery & Courier Entry',
      description: 'Quick check-in for Amazon, Flipkart, Swiggy, and courier deliveries.',
      icon: <Truck className="w-6 h-6 text-blue-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Gate Security & Intercom',
      description: 'Direct audio/intercom call to resident flats upon unexpected guest arrivals.',
      icon: <ShieldCheck className="w-6 h-6 text-amber-600" />,
      status: 'Phase 3 Module',
    },
  ];

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Main Gate Security Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Gate check-in, visitor validation, and emergency intercom operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {guardModules.map((m, idx) => (
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
