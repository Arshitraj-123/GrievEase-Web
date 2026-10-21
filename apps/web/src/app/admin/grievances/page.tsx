'use client';

import React from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from '@grievease/ui';
import { MessageSquare, Clock, ShieldAlert, GitCommit, Users } from 'lucide-react';

export default function AdminGrievancesPlaceholderPage() {
  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs mb-3">
            Administrative Governance • Phase 3 Core Module
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Society Grievance Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Triage, assign, resolve, and monitor society grievances with automated escalation tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <CardTitle className="text-base">SLA Clock Integration</CardTitle>
              <CardDescription className="text-xs">
                Secretary resolution window is strictly 48 hours before automated Level 2 escalation to the Committee.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-base">Anonymous Complaints</CardTitle>
              <CardDescription className="text-xs">
                Supports anonymous resident submissions with cryptographic verification preventing forged reports.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="space-y-2">
              <GitCommit className="w-5 h-5 text-purple-600" />
              <CardTitle className="text-base">Hash-Chained Audit Trail</CardTitle>
              <CardDescription className="text-xs">
                Every grievance status transition generates a SHA-256 chained entry verifiable by auditors.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </ShellLayout>
  );
}
