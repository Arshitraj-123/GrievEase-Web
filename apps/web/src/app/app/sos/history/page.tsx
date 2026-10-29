'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
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
  History,
  Siren,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export default function ResidentSosHistoryPage() {
  const { t } = useAccessibility();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await api.listSosAlerts(undefined, false);
      setAlerts(data || []);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <a
            href="/app/sos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to SOS Desk</span>
          </a>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <History className="w-7 h-7 text-red-600" />
            <span>SOS Alert History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident log of past emergency dispatches for your flat.
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading history...</div>
        ) : alerts.length === 0 ? (
          <Card className="text-center py-12 p-6">
            <CardDescription>No past emergency alerts recorded for your flat.</CardDescription>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((a) => (
              <Card key={a.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Siren className="w-4 h-4 text-red-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {a.type}
                    </span>
                    {a.isDrill && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400">
                        DRILL
                      </Badge>
                    )}
                  </div>
                  <Badge variant={a.status === 'RESOLVED' ? 'success' : 'default'} className="text-[10px]">
                    {a.status}
                  </Badge>
                </div>

                {a.outcomeNote && (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Outcome: {a.outcomeNote}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>Dispatched: {new Date(a.raisedAt).toLocaleString()}</span>
                  {a.resolvedAt && (
                    <span>Resolved in {Math.round((new Date(a.resolvedAt).getTime() - new Date(a.raisedAt).getTime()) / 1000)}s</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
