'use client';

import React, { useState } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export default function GuardRosterPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const shifts = [
    { name: 'Morning (08:00 - 16:00)', guard: 'Rameshwar Yadav (SEC-089)' },
    { name: 'Evening (16:00 - 00:00)', guard: 'Babu Lal (SEC-104)' },
    { name: 'Night (00:00 - 08:00)', guard: 'Anil Kumar (SEC-112)' },
  ];

  return (
    <ShellLayout role="ADMIN">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <a
              href="/admin/guards"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Guard Management</span>
            </a>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-7 h-7 text-teal-600" />
              <span>Weekly Sentry Shift Roster &amp; Conflict Checks</span>
            </h1>
          </div>

          <Badge variant="success" className="text-xs">
            0 Shift Conflicts Detected
          </Badge>
        </div>

        {/* Weekly Roster Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-bold text-slate-700 dark:text-slate-300">Shift Window</th>
                {days.map((d) => (
                  <th key={d} className="p-3.5 font-bold text-slate-700 dark:text-slate-300 text-center">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shifts.map((s, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {s.name}
                  </td>
                  {days.map((d) => (
                    <td key={d} className="p-2 text-center">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-medium text-[11px] truncate max-w-[120px]">
                        {s.guard.split(' ')[0]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Missed Shift Report */}
        <Card className="border-amber-200 dark:border-amber-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Weekly Attendance &amp; Shift Compliance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            100% scheduled shifts manned. 0 unexcused absences recorded in the last 7 days.
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
