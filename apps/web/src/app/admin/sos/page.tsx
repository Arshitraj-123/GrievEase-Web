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
  Siren,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Settings,
  PhoneCall,
  Flame,
  HeartPulse,
} from 'lucide-react';

export default function AdminSosPage() {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [historyAlerts, setHistoryAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    medianAckSeconds: 18,
    medianResolveSeconds: 240,
    totalDispatches30d: 4,
    falseAlarms30d: 0,
  });
  const [isDrillLoading, setIsDrillLoading] = useState(false);
  const [drillSuccess, setDrillSuccess] = useState(false);

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 6000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      const active = await api.listSosAlerts(undefined, true);
      setActiveAlerts(active || []);

      const past = await api.listSosAlerts(undefined, false);
      setHistoryAlerts(past || []);
    } catch {}
  };

  const handleStartDrill = async () => {
    if (!confirm('Start society-wide security emergency drill? Responders and guard consoles will be alerted.')) return;
    setIsDrillLoading(true);
    setDrillSuccess(false);

    try {
      await api.startSosDrill({
        type: 'FIRE',
        description: 'Scheduled Quarterly Evacuation & Fire Safety Drill',
      });
      setDrillSuccess(true);
      loadAlerts();
      setTimeout(() => setDrillSuccess(false), 4000);
    } catch {}
    finally {
      setIsDrillLoading(false);
    }
  };

  return (
    <ShellLayout role="ADMIN">
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Siren className="w-7 h-7 text-red-600 animate-pulse" />
              <span>SOS Emergency Console &amp; Response Metrics</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live tiered emergency fan-out, responder SLAs, drill testing, and response benchmarks.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartDrill}
              disabled={isDrillLoading}
              className="min-h-[44px] px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-1.5 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isDrillLoading ? 'Starting...' : 'Run Emergency Drill'}</span>
            </button>

            <a
              href="/admin/settings/sos"
              className="min-h-[44px] px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl inline-flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              <span>SOS Settings</span>
            </a>
          </div>
        </div>

        {drillSuccess && (
          <div className="p-4 bg-amber-500 text-slate-950 rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-5 h-5" />
            <span>SECURITY DRILL STARTED. Consoles alerted with &apos;DRILL&apos; badge. Excluded from response statistics.</span>
          </div>
        )}

        {/* Benchmarks Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Median Acknowledge Time</span>
            <div className="text-3xl font-black text-teal-600">{stats.medianAckSeconds}s</div>
            <div className="text-[11px] text-slate-500">Target &lt;60s SLA</div>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Median Resolution</span>
            <div className="text-3xl font-black text-emerald-600">{stats.medianResolveSeconds}s</div>
            <div className="text-[11px] text-slate-500">Incident closure</div>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">30-Day Dispatches</span>
            <div className="text-3xl font-black text-purple-600">{stats.totalDispatches30d}</div>
            <div className="text-[11px] text-slate-500">Total verified alerts</div>
          </Card>

          <Card className="p-4 space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">False Alarm Rate</span>
            <div className="text-3xl font-black text-slate-700 dark:text-slate-300">0%</div>
            <div className="text-[11px] text-slate-500">Flagged flats: 0</div>
          </Card>
        </div>

        {/* Live Active Emergency Takeover Console */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black uppercase text-red-600 tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>Active Emergencies Requiring Attention</span>
            </div>

            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 bg-red-600 text-white rounded-3xl shadow-xl border-4 border-red-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="warning" className="text-xs font-black uppercase bg-amber-300 text-slate-950">
                        {alert.type}
                      </Badge>
                      {alert.isDrill && (
                        <Badge variant="outline" className="text-[10px] bg-white text-slate-900 border-white">
                          DRILL MODE
                        </Badge>
                      )}
                      <span className="text-lg font-black">
                        Flat {alert.flatId || 'Main Security Gate'}
                      </span>
                    </div>
                    {alert.note && (
                      <div className="text-xs text-red-100 italic">
                        &quot;{alert.note}&quot;
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono">
                      Tier {alert.escalationTier || 1} &bull; {new Date(alert.raisedAt).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className="text-xs bg-white text-red-700 border-white font-bold">
                      {alert.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incident History Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Past SOS Dispatches &amp; Drill History</CardTitle>
          </CardHeader>
          <CardContent>
            {historyAlerts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No past SOS dispatches recorded.
              </div>
            ) : (
              <div className="space-y-2">
                {historyAlerts.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{a.type}</span>
                      <span className="text-slate-500 ml-2">&bull; Flat {a.flatId}</span>
                      {a.outcomeNote && <span className="text-slate-400 ml-2">({a.outcomeNote})</span>}
                    </div>
                    <Badge variant={a.status === 'RESOLVED' ? 'success' : 'default'} className="text-[10px]">
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
