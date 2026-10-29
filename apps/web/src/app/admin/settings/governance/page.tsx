'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import { Layers, AlertTriangle, ShieldCheck, CheckCircle2, UserCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function GovernanceChainSettingsPage() {
  const [chain, setChain] = useState<any[]>([]);
  const [vacancies, setVacancies] = useState<number[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [showStepUpModal, setShowStepUpModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchChain = async () => {
    try {
      setLoading(true);
      const [chainRes, usersRes] = await Promise.all([
        api.getGovernanceChain(),
        api.listUsers({}),
      ]);
      setChain(Array.isArray(chainRes.levels) ? chainRes.levels : []);
      setVacancies(Array.isArray(chainRes.vacancies) ? chainRes.vacancies : []);
      setUsers(Array.isArray(usersRes.items) ? usersRes.items : []);
    } catch (err) {
      console.error('Failed to load chain:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChain();
  }, []);

  const handleOpenAssignModal = (level: number, userId: string, isPrimary: boolean) => {
    setPendingAssignment({ level, userId, isPrimary });
    setShowStepUpModal(true);
  };

  const handleConfirmAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAssignment || !stepUpPassword) return;

    try {
      const stepUp = await api.stepUp({ password: stepUpPassword });
      await api.updateGovernanceAssignment(pendingAssignment, stepUp.stepUpToken);
      setShowStepUpModal(false);
      setStepUpPassword('');
      setMessage(`Governance assignment for Level ${pendingAssignment.level} updated successfully.`);
      fetchChain();
    } catch (err: any) {
      alert(err.message || 'Failed to update governance assignment.');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Governance Chain">
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
            4-Level Governance Escalation Chain
          </h1>
          <p className="text-xs text-slate-500">
            Configure designated primary resolvers for automated SLA escalation cascades. Changes require Step-Up authentication.
          </p>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Vacancy Detection Banner */}
        {vacancies.length > 0 && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Vacancy Detected in Governance Chain
              </h3>
              <p className="text-xs">
                Level(s) {vacancies.join(', ')} currently lack an active primary resolver. Any breach cascading into these levels will automatically skip to the next tier with reason VACANT.
              </p>
            </div>
          </div>
        )}

        {/* 4 Tiers List */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((levelNum) => {
            const levelInfo = chain.find((l) => l.level === levelNum);
            const isVacant = vacancies.includes(levelNum);

            return (
              <Card key={levelNum} className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
                      L{levelNum}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {levelInfo?.label || `Level ${levelNum}`}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        {levelNum === 1 && 'Initial 48h response owner'}
                        {levelNum === 2 && 'Automatic SLA breach escalation tier'}
                        {levelNum === 3 && 'Executive society intervention'}
                        {levelNum === 4 && 'Final society authority (no further auto-escalation)'}
                      </span>
                    </div>
                  </div>

                  <Badge
                    variant={isVacant ? 'outline' : 'default'}
                    className={isVacant ? 'border-amber-400 text-amber-600' : 'bg-emerald-600 text-white'}
                  >
                    {isVacant ? 'Vacant' : 'Primary Active'}
                  </Badge>
                </div>

                {/* Current Assignments */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Resolver</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {levelInfo?.primaryUser?.fullName || 'No primary person designated'}
                    </span>
                    {levelInfo?.primaryUser?.username && (
                      <span className="text-slate-500 ml-1">({levelInfo.primaryUser.username})</span>
                    )}
                  </div>

                  {/* Assign Form Inline Trigger */}
                  <div className="flex items-center gap-2">
                    <select
                      id={`select-user-l${levelNum}`}
                      className="px-3 py-1.5 rounded-xl border text-xs font-medium bg-white dark:bg-slate-900"
                      defaultValue={levelInfo?.primaryUser?.id || ''}
                    >
                      <option value="">Select staff / member...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => {
                        const sel = document.getElementById(`select-user-l${levelNum}`) as HTMLSelectElement;
                        if (!sel?.value) {
                          alert('Please choose a user first.');
                          return;
                        }
                        handleOpenAssignModal(levelNum, sel.value, true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow"
                    >
                      Set Primary
                    </button>
                  </div>
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
                  Step-Up Authentication Required
                </h3>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Modifying the society governance escalation chain requires administrative password verification.
              </p>

              <form onSubmit={handleConfirmAssignment} className="space-y-4">
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
