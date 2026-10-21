'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge, Alert } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import { Crown, ShieldAlert, ArrowRight, UserCheck, Terminal, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function SuperAdminTransferPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [selectedNomineeId, setSelectedNomineeId] = useState('');
  const [demotedRole, setDemotedRole] = useState('RESIDENT');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active nomination state
  const [pendingTransferId, setPendingTransferId] = useState<string | null>(null);
  const [stepUpOpen, setStepUpOpen] = useState(false);

  useEffect(() => {
    api.listUsers({ status: 'ACTIVE' }).then((res) => {
      // Filter out Super Admin
      setMembers((res.items || []).filter((u: any) => u.role !== 'SUPER_ADMIN'));
    });
  }, []);

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNomineeId) return;
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.nominateSuperAdmin(selectedNomineeId);
      setPendingTransferId(res.transferId);
      alert('Nomination dispatched! The nominee has been notified to configure TOTP and accept.');
    } catch (err: any) {
      setError(err.message || 'Failed to nominate member.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmTransfer = async (stepUpToken: string) => {
    if (!pendingTransferId) return;
    try {
      await api.confirmSuperAdmin(pendingTransferId, demotedRole, stepUpToken);
      alert('Super Admin role has been successfully transferred. You have been demoted to ' + demotedRole + '. Logging out.');
      window.location.href = '/login';
    } catch (err: any) {
      alert(err.message || 'Transfer confirmation failed.');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Super Admin Succession & Handover</h1>
          <p className="text-xs text-slate-500 mt-1">
            Planned governance succession workflow. Swaps roles atomically and invalidates outgoing credentials.
          </p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* 1. NOMINATE ACTIVE MEMBER */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-lg">Step 1: Nominate an Active Member</CardTitle>
            </div>
            <CardDescription>
              Select any active member. The nomination expires after 72 hours and requires mutual confirmation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleNominate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Choose Active Member / Resident
                </label>
                <select
                  value={selectedNomineeId}
                  onChange={(e) => setSelectedNomineeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Select an active member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.username}) - {m.role} [Flat: {m.flat_number || 'External'}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm" disabled={!selectedNomineeId} isLoading={isLoading}>
                  Dispatched Succession Nomination
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* 2. CONFIRM TRANSFER WITH STEP-UP */}
        {pendingTransferId && (
          <Card className="border-2 border-amber-400 dark:border-amber-600">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-lg">Step 2: Confirm Succession Handover</CardTitle>
              </div>
              <CardDescription>
                Confirming will demote your account, revoke all your active sessions, delete your TOTP keys, and promote the nominee in one atomic transaction.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Select Your Demoted Role Post-Handover
                </label>
                <select
                  value={demotedRole}
                  onChange={(e) => setDemotedRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="RESIDENT">RESIDENT (Default)</option>
                  <option value="COMMITTEE">COMMITTEE</option>
                  <option value="SECRETARY">SECRETARY</option>
                </select>
              </div>

              <Button
                variant="danger"
                className="w-full"
                onClick={() => setStepUpOpen(true)}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Confirm Handover with Step-Up (Password + TOTP)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 3. BREAK-GLASS DOCUMENTATION */}
        <Card className="bg-slate-900 text-slate-100 border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Terminal className="w-5 h-5" />
              <CardTitle className="text-base text-white">Emergency Break-Glass Succession (Sudden Absence)</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-xs">
              If the Super Admin is incapacitated, server shell operators can execute emergency succession:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-black/60 rounded-xl font-mono text-xs text-teal-400 select-all border border-slate-800">
              pnpm admin:emergency-transfer --member-id=GV-A101-SEC --witness1=&quot;Secretary Name&quot; --witness2=&quot;Chairman Name&quot;
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Requires two recorded Governing Body witnesses, creates an immutable audit chain entry, and broadcasts a high-priority alert across all admin sessions.
            </p>
          </CardContent>
        </Card>

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Confirm Super Admin Transfer"
          description="Enter your current password and 6-digit TOTP code to finalize the transfer of the Super Admin role."
          onSuccess={handleConfirmTransfer}
          requireTotp={true}
        />
      </div>
    </ShellLayout>
  );
}
