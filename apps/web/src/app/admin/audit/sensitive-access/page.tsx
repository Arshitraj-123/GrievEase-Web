'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  Eye,
  ShieldCheck,
  Lock,
  Clock,
  User,
  KeyRound,
  FileText,
} from 'lucide-react';

export default function AdminSensitiveAccessAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listSensitiveAccessLogsAdmin(100)
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load access logs', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6 text-teal-600" />
            <span>Sensitive Data Access Audit Log</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of all identity unmasks, encrypted phone lookups, and administrative data exports.
          </p>
        </div>

        {/* Security guarantee */}
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            Every access to resident phone numbers, anonymous grievance reveal attempts, and bulk exports generates an indelible audit log entry with actor ID and IP hash.
          </span>
        </div>

        {/* Access Log Table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No sensitive access events recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Actor / Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target Entity</th>
                    <th className="p-3">Reason / Justification</th>
                    <th className="p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                      <td className="p-3 whitespace-nowrap text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {log.actor_name || log.actor_username || 'Admin'}
                        </div>
                        <span className="text-[10px] text-slate-400">{log.actor_role}</span>
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {log.target_type} ({log.target_id?.slice(0, 8)}...)
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                        {log.reason || 'Standard Administrative Duty'}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                        {log.ip || '127.0.0.1'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </ShellLayout>
  );
}

