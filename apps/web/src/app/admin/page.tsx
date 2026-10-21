'use client';

import React, { useEffect, useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@grievease/ui';
import {
  Users,
  Building,
  Home,
  ShieldCheck,
  Clock,
  Layers,
  FileText,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminDashboardPage() {
  const [society, setSociety] = useState<any>(null);

  useEffect(() => {
    api.getCurrentSociety().then(setSociety).catch(() => {});
  }, []);

  const phase3Modules = [
    {
      title: 'Grievance SLA Escalation',
      description: 'L1 Secretary (48h) -> L2 Committee (72h) -> L3 Chairman (96h) -> L4 Governing Body automatic SLA breaching.',
      icon: <Flame className="w-6 h-6 text-orange-500" />,
      status: 'Coming in Phase 3',
    },
    {
      title: 'Visitor & Delivery Passcodes',
      description: 'Gate OTP verification, domestic staff entry logs, delivery notifications and intercom rings.',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      status: 'Coming in Phase 3',
    },
    {
      title: 'Maintenance Billing & Cash Ledger',
      description: 'Manual cash payment recording, PDF receipts generation, arrears tracking and expense statements.',
      icon: <FileText className="w-6 h-6 text-green-500" />,
      status: 'Coming in Phase 3',
    },
    {
      title: 'Vendor Dispatch & Work Orders',
      description: 'Work order delegation to electricians, plumbers, lift engineers with completion sign-offs.',
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      status: 'Coming in Phase 3',
    },
    {
      title: 'Guard Patrols & QR Checkpoints',
      description: 'Security guard GPS/QR checkpoint scanning, shift rosters and incident reports.',
      icon: <ShieldCheck className="w-6 h-6 text-teal-500" />,
      status: 'Coming in Phase 3',
    },
    {
      title: 'Amenity Booking System',
      description: 'Clubhouse, tennis court, and banquet hall reservations with deposit records.',
      icon: <Home className="w-6 h-6 text-amber-500" />,
      status: 'Coming in Phase 3',
    },
  ];

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Society Governance Console</h1>
          <p className="text-xs text-slate-500 mt-1">
            Phase 2: Identity, user provisioning, role-based access, and cryptographic audit security.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/50 text-teal-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {society?.active_members || '7'}
              </div>
              <div className="text-xs text-slate-500">Active Members</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {society?.total_wings || '2'}
              </div>
              <div className="text-xs text-slate-500">Residential Wings (A & B)</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center shrink-0">
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {society?.total_flats || '20'}
              </div>
              <div className="text-xs text-slate-500">Total Registered Flats</div>
            </div>
          </Card>

          <Card className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/50 text-green-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <div className="text-xs text-slate-500">Hash-Chained Audit Trail</div>
            </div>
          </Card>
        </div>

        {/* Phase 3 Module Shells */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Operational Modules</h2>
            <Badge variant="outline" className="text-xs font-semibold">
              Planned for Phase 3
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {phase3Modules.map((mod, idx) => (
              <Card key={idx} className="border border-slate-200 dark:border-slate-800 opacity-90 hover:opacity-100 transition-opacity">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {mod.icon}
                    </div>
                    <Badge variant="warning" className="text-[10px]">
                      {mod.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {mod.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
