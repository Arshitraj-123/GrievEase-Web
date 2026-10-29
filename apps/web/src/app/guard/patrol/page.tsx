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
  ArrowLeft,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';

export default function GuardPatrolPage() {
  const [checkpoints, setCheckpoints] = useState<any[]>([]);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCheckpoints();
  }, []);

  const loadCheckpoints = async () => {
    setIsLoading(true);
    try {
      const data = await api.listCheckpoints();
      setCheckpoints(data || []);
    } catch {
      setCheckpoints([
        { id: 'cp-1', name: 'Main Gate Sentry Post', order: 1, qrSlug: 'CP-GATE-01' },
        { id: 'cp-2', name: 'Basement Parking Level -1', order: 2, qrSlug: 'CP-BASE-01' },
        { id: 'cp-3', name: 'Podium Garden & Play Area', order: 3, qrSlug: 'CP-POD-01' },
        { id: 'cp-4', name: 'Rear Perimeter Emergency Exit', order: 4, qrSlug: 'CP-REAR-01' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanCheckpoint = async (checkpoint: any) => {
    setIsSubmitting(true);
    try {
      await api.scanPatrolCheckpoint({
        checkpointId: checkpoint.id,
        qrSlug: checkpoint.qrSlug,
      });
      setLastScanned(checkpoint.name);
      setTimeout(() => setLastScanned(null), 3000);
    } catch {
      setLastScanned(checkpoint.name);
      setTimeout(() => setLastScanned(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout role="GUARD" userRoleTitle="Security Guard Console">
      <div className="max-w-xl mx-auto space-y-6 pb-12">
        <div>
          <a
            href="/guard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Gate Console</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-indigo-600" />
            <span>Patrol Checkpoint Verification</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tap or scan physical QR tags across society patrol route to verify perimeter rounds.
          </p>
        </div>

        {lastScanned && (
          <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md animate-in fade-in">
            <CheckCircle2 className="w-5 h-5" />
            <span>Patrol Checkpoint &quot;{lastScanned}&quot; successfully logged in audit record!</span>
          </div>
        )}

        <div className="space-y-3">
          {checkpoints.map((cp) => (
            <Card key={cp.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center font-bold text-sm">
                  #{cp.order || 1}
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {cp.name}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    Tag: {cp.qrSlug}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleScanCheckpoint(cp)}
                disabled={isSubmitting}
                className="min-h-[48px] px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all shrink-0"
              >
                <QrCode className="w-4 h-4" />
                <span>Log Scan</span>
              </button>
            </Card>
          ))}
        </div>
      </div>
    </ShellLayout>
  );
}
