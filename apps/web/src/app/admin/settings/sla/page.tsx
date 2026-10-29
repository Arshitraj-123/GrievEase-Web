'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import { Clock, AlertTriangle, ArrowLeft, KeyRound, CheckCircle2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function SlaSettingsPage() {
  const [slaMatrix, setSlaMatrix] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSla = async () => {
    try {
      setLoading(true);
      const [slaRes, catsRes] = await Promise.all([
        api.getSlaMatrix(),
        api.getCategories(),
      ]);
      setSlaMatrix(Array.isArray(slaRes) ? slaRes : []);
      setCategories(Array.isArray(catsRes) ? catsRes : []);
    } catch (err) {
      console.error('Failed to load SLA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSla();
  }, []);

  const handleSaveHours = (categoryId: string | null, priority: string, level: number, hours: number) => {
    setPendingUpdate({ categoryId, priority, level, hours });
    setShowStepUpModal(true);
  };

  const handleConfirmSla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUpdate || !stepUpPassword) return;

    try {
      const stepUp = await api.stepUp({ password: stepUpPassword });
      await api.updateSlaConfig(pendingUpdate, stepUp.stepUpToken);
      setShowStepUpModal(false);
      setStepUpPassword('');
      setSuccessMessage('SLA configuration updated and audited.');
      fetchSla();
    } catch (err: any) {
      alert(err.message || 'Failed to update SLA configuration.');
    }
  };

  const getHoursFor = (priority: string, level: number) => {
    const row = slaMatrix.find((s) => s.priority === priority && s.level === level);
    return row ? row.hours : 0;
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="SLA Configuration">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <Link
          href="/admin"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            SLA Escalation Matrix
          </h1>
          <p className="text-xs text-slate-500">
            Define guaranteed resolution hours for each priority tier across the 4 governance levels.
          </p>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Client Confirmation Notice Alert */}
        <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Pending Client Confirmation
            </h3>
            <p className="text-xs leading-relaxed">
              URGENT (24/36/48/60h) and EMERGENCY (4/8/12/24h) targets are proposed placeholder values pending formal society general body ratification.
            </p>
          </div>
        </div>

        {/* SLA Table */}
        <div className="space-y-4">
          {(['NORMAL', 'URGENT', 'EMERGENCY'] as const).map((p) => {
            const isPlaceholder = p !== 'NORMAL';

            return (
              <Card key={p} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {p} Priority Matrix
                    </span>
                    {isPlaceholder && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                        Pending Client Confirmation
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {p === 'NORMAL' ? '48h base' : p === 'URGENT' ? '24h base' : '4h base'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  {[1, 2, 3, 4].map((lvl) => {
                    const hours = getHoursFor(p, lvl);
                    const defaultHours =
                      p === 'NORMAL'
                        ? [48, 72, 96, 120][lvl - 1]
                        : p === 'URGENT'
                        ? [24, 36, 48, 60][lvl - 1]
                        : [4, 8, 12, 24][lvl - 1];

                    return (
                      <div
                        key={lvl}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                          <span>Level {lvl}</span>
                          <span>{lvl === 1 ? 'Secretary' : lvl === 2 ? 'Committee' : lvl === 3 ? 'Chairman' : 'Gov Body'}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={720}
                            id={`sla-${p}-l${lvl}`}
                            defaultValue={hours || defaultHours}
                            className="w-16 px-2 py-1 rounded-lg border text-xs font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900"
                          />
                          <span className="text-[11px] font-bold text-slate-500">hours</span>

                          <button
                            type="button"
                            onClick={() => {
                              const inputEl = document.getElementById(`sla-${p}-l${lvl}`) as HTMLInputElement;
                              const val = Number(inputEl?.value || defaultHours);
                              handleSaveHours(null, p, lvl, val);
                            }}
                            className="ml-auto px-2 py-1 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-[10px] shadow"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Step-Up Modal */}
        {showStepUpModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-teal-600">
                <KeyRound className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Confirm SLA Modification
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your administrative password to record this SLA rule change into the immutable audit log.
              </p>

              <form onSubmit={handleConfirmSla} className="space-y-4">
                <input
                  type="password"
                  required
                  placeholder="Enter administrator password"
                  value={stepUpPassword}
                  onChange={(e) => setStepUpPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStepUpModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs">
                    Confirm & Save
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
