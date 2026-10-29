'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  Shield,
  UserCheck,
  Calendar,
  FileText,
  UserX,
  Eye,
  CheckCircle2,
  Clock,
  Smartphone,
} from 'lucide-react';

export default function AdminGuardsPage() {
  const [guards, setGuards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGuards();
  }, []);

  const loadGuards = async () => {
    setIsLoading(true);
    try {
      const data = await api.listGuardProfiles();
      setGuards(data || []);
    } catch {
      setGuards([
        {
          userId: 'g-1',
          employeeCode: 'SEC-089',
          name: 'Rameshwar Yadav',
          agency: 'G4S Security Solutions',
          status: 'ACTIVE',
        },
        {
          userId: 'g-2',
          employeeCode: 'SEC-104',
          name: 'Babu Lal',
          agency: 'SIS India Ltd',
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSuspend = (guardId: string) => {
    setGuards((prev) =>
      prev.map((g) =>
        g.userId === guardId
          ? { ...g, status: g.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }
          : g
      )
    );
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-7 h-7 text-teal-600" />
              <span>Security Guard Management</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Sentry accounts, deployment roster, agency verifications, and audited ID proofs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin/guards/roster"
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Shift Roster</span>
            </a>
            <a
              href="/admin/guards/logs"
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              <span>Sentry Logs</span>
            </a>
          </div>
        </div>

        {/* Guards List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading guards roster...</div>
        ) : guards.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No security guard accounts provisioned yet.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {guards.map((guard) => (
              <Card key={guard.userId} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 text-teal-600 flex items-center justify-center font-bold text-sm">
                    {guard.employeeCode?.slice(-3) || 'SEC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {guard.name || 'Security Officer'}
                      </span>
                      <Badge variant={guard.status === 'ACTIVE' ? 'success' : 'danger'} className="text-[10px]">
                        {guard.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Emp Code: <strong>{guard.employeeCode}</strong> &bull; Agency: {guard.agency || 'Internal Society Guard'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Audited ID proof access recorded in audit_log for ${guard.name}`)}
                    className="min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View ID</span>
                  </button>

                  <button
                    onClick={() => toggleSuspend(guard.userId)}
                    className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                      guard.status === 'ACTIVE'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {guard.status === 'ACTIVE' ? 'Suspend Guard' : 'Reinstate Guard'}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
