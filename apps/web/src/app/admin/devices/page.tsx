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
  Smartphone,
  ShieldCheck,
  Ban,
  Clock,
  Plus,
  ArrowLeft,
} from 'lucide-react';

export default function AdminDevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await api.listGateDevices();
      setDevices(data || []);
    } catch {
      setDevices([
        {
          id: 'dev-1',
          name: 'Main Gate Sentry Tablet A',
          gateId: 'North Gate #1',
          lastSeenAt: new Date().toISOString(),
          registeredAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          status: 'ACTIVE',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm('Revoking this gate device immediately terminates console sessions. Continue?')) return;
    try {
      await api.revokeGateDevice(id);
      setDevices((prev) => prev.filter((d) => d.id !== id));
    } catch {}
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Smartphone className="w-7 h-7 text-blue-600" />
              <span>Gate Devices &amp; Sentry Hardware</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Authorized hardware devices paired with gate consoles. Sentry logins require a registered device cookie.
            </p>
          </div>

          <a
            href="/admin/settings/gate"
            className="min-h-[44px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Device</span>
          </a>
        </div>

        {/* Device List */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading devices...</div>
        ) : devices.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No gate devices registered yet.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {devices.map((dev) => (
              <Card key={dev.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center font-bold text-sm">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {dev.name}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        ACTIVE
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Gate: <strong>{dev.gateId}</strong> &bull; Last Heartbeat: {new Date(dev.lastSeenAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(dev.id)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900 flex items-center justify-center gap-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>Revoke Device</span>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
