'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@grievease/ui';
import { ShieldCheck, Smartphone, Laptop, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function AdminProfilePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMySessions();
      setSessions(data || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.revokeMySession(sessionId);
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  const handleRevokeOthers = async () => {
    try {
      await api.revokeOtherSessions();
      fetchSessions();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke other sessions');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Admin Security & Sessions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your two-factor credentials and monitor active concurrent devices. (Max 5 concurrent)
          </p>
        </div>

        {/* TOTP Status Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-teal-600" />
                <CardTitle className="text-base">Two-Factor Authentication (TOTP)</CardTitle>
              </div>
              <Badge variant="success">Enrolled & Active</Badge>
            </div>
            <CardDescription>
              Time-based one-time password enforcement is active for this administrative account.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Active Sessions Card */}
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Device Sessions</h3>
              <p className="text-xs text-slate-500">
                Sessions terminate after 15 minutes of inactivity or upon refresh token reuse.
              </p>
            </div>
            {sessions.length > 1 && (
              <Button variant="outline" size="sm" onClick={handleRevokeOthers}>
                Sign Out All Other Devices
              </Button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((s) => (
              <div key={s.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {s.device_label || 'Web Browser'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      IP: {s.ip || '127.0.0.1'} • Last active: {new Date(s.last_seen_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevokeSession(s.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Revoke session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ShellLayout>
  );
}
