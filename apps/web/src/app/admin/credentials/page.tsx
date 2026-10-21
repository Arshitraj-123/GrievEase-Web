'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import { KeyRound, Printer, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function CredentialSlipsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [reissuedSlip, setReissuedSlip] = useState<any | null>(null);

  const fetchInvitedUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.listUsers({ status: 'INVITED' });
      setUsers(res.items || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitedUsers();
  }, []);

  const triggerReissue = (user: any) => {
    setSelectedUser(user);
    setStepUpOpen(true);
  };

  const handleStepUpSuccess = async (stepUpToken: string) => {
    if (!selectedUser) return;
    try {
      const res = await api.reissueCode(selectedUser.id, selectedUser.flat_number || 'VERIFY', stepUpToken);
      setReissuedSlip({
        user: selectedUser,
        code: res.activationCode,
        expiresAt: res.expiresAt,
      });
      fetchInvitedUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to reissue code');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Confidential Credential Slips</h1>
            <p className="text-xs text-slate-500 mt-1">
              Active physical slips for invited members awaiting one-time code activation.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
            Print All Slips
          </Button>
        </div>

        {reissuedSlip && (
          <Card className="border-2 border-teal-500 dark:border-teal-600 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Fresh Activation Slip Reissued</span>
              </div>
              <Badge variant="outline">Confidential</Badge>
            </div>
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div>Member: <strong>{reissuedSlip.user.full_name}</strong> ({reissuedSlip.user.member_id})</div>
              <div>Username: <code className="font-bold">{reissuedSlip.user.username}</code></div>
              <div>Flat: <strong>{reissuedSlip.user.flat_number}</strong></div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">One-Time Activation Code:</span>
                <span className="font-mono text-xl font-black text-teal-600 tracking-wider select-all">{reissuedSlip.code}</span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReissuedSlip(null)}>
                Dismiss
              </Button>
              <Button variant="primary" size="sm" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                Print Slip
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-slate-400">
              {isLoading ? 'Loading invited members...' : 'No pending invited members found.'}
            </div>
          ) : (
            users.map((u) => (
              <Card key={u.id} className="p-4 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between border-b pb-2">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{u.full_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{u.member_id}</div>
                  </div>
                  <Badge variant="warning">{u.role}</Badge>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div>Flat: <strong>{u.flat_number || 'External'}</strong> ({u.wing_name})</div>
                  <div>Username: <code>{u.username}</code></div>
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Status:</span>
                    <Badge variant="warning">Awaiting Activation</Badge>
                  </div>
                </div>

                <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Hand over in person</span>
                  <Button variant="outline" size="sm" onClick={() => triggerReissue(u)} leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                    Reissue Code
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Reissue Credential Code"
          description="Administrative step-up is required to generate and reveal a fresh activation code."
          onSuccess={handleStepUpSuccess}
        />
      </div>
    </ShellLayout>
  );
}
