'use client';

import React from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import {
  MessageSquare,
  Users,
  FileText,
  Home,
  ShieldCheck,
  AlertOctagon,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function ResidentDashboardPage() {
  const residentModules = [
    {
      title: 'Lodge Grievance & SLA Tracking',
      description: 'Lodge complaints with photo proofs, track 48h-120h SLA progress, and see automatic escalation.',
      icon: <MessageSquare className="w-6 h-6 text-teal-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Visitor & Delivery Passes',
      description: 'Generate 6-digit gate entry codes for guests and deliveries, and get notified of gate arrivals.',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Maintenance Bills & Receipts',
      description: 'View monthly society dues, cash payment records signed by the treasurer, and download PDF receipts.',
      icon: <FileText className="w-6 h-6 text-green-600" />,
      status: 'Phase 3 Module',
    },
    {
      title: 'Book Society Amenities',
      description: 'Reserve clubhouse, tennis court, and party hall slots with automated slot conflict prevention.',
      icon: <Home className="w-6 h-6 text-amber-600" />,
      status: 'Phase 3 Module',
    },
  ];

  return (
    <ShellLayout role="RESIDENT" userRoleTitle="Resident">
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30">
              Green Valley Residency • Wing A, Flat 102
            </Badge>
            <h1 className="text-2xl font-black">Welcome Home</h1>
            <p className="text-xs text-slate-300 max-w-lg">
              Phase 2 account activation complete. Your cryptographic identity is registered with the society council.
            </p>
          </div>

          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-bold opacity-70 cursor-not-allowed"
          >
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>SOS Alert (Phase 3)</span>
          </button>
        </div>

        {/* Modules Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Resident Services</h2>
            <span className="text-xs text-slate-400">Arriving in Phase 3</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {residentModules.map((m, idx) => (
              <Card key={idx} className="border border-slate-200 dark:border-slate-800 opacity-90 hover:opacity-100 transition-opacity">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                      {m.icon}
                    </div>
                    <Badge variant="warning" className="text-[10px]">
                      {m.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{m.title}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {m.description}
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
