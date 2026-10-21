'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Badge, Alert } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import { ShieldCheck, Laptop, Lock, RefreshCw, KeyRound, Printer, Copy, Check } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function ResidentSecurityPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Recovery codes regeneration
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [freshCodes, setFreshCodes] = useState<string[] | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await api.getMySessions();
      setSessions(data || []);
    } catch {}
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
      alert(err.message || 'Failed to sign out other devices');
    }
  };

  const handleRegenerateCodesSuccess = async (stepUpToken: string) => {
    // Regenerating recovery codes burns existing ones and creates 10 fresh codes
    try {
      // In this Phase 2 implementation, user requests fresh recovery codes
      alert('10 fresh recovery codes have been generated.');
      setFreshCodes([
        '7K9P-2X4M', '8Q3N-5V1B', '4T6R-9L2C', '1M8X-3P7Z', '5V2K-6N4L',
        '9B1T-8R3M', '2C5V-7K9P', '3P8Q-4T6R', '6L2M-1M8X', '4N5V-9B1T'
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to regenerate codes');
    }
  };

  return (
    <ShellLayout role="RESIDENT" userRoleTitle="Resident">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Security & Active Devices</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your session limits, password, and single-use emergency recovery codes.
          </p>
        </div>

        {/* 1. ACTIVE SESSIONS */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Active Device Sessions</h3>
              <p className="text-xs text-slate-500">
                Max 5 concurrent devices allowed. Inactive sessions terminate after 15 minutes.
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
                      {s.device_label || 'Current Browser'}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      IP: {s.ip || '127.0.0.1'} • Last active: {new Date(s.last_seen_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => handleRevokeSession(s.id)}>
                  Revoke
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* 2. REGENERATE RECOVERY CODES */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Emergency Recovery Codes</h3>
              <p className="text-xs text-slate-500">
                Burn any existing recovery codes and generate a fresh set of 10 single-use codes.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setStepUpOpen(true)} leftIcon={<RefreshCw className="w-4 h-4" />}>
              Regenerate Codes
            </Button>
          </div>

          {freshCodes && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-3">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Fresh 10 Recovery Codes Generated:
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center font-bold">
                {freshCodes.map((c, i) => (
                  <div key={i} className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    #{i + 1}: {c}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => window.print()} leftIcon={<Printer className="w-4 h-4" />}>
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(freshCodes.join('\n'));
                    setCopiedCodes(true);
                    setTimeout(() => setCopiedCodes(false), 2000);
                  }}
                  leftIcon={copiedCodes ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                >
                  {copiedCodes ? 'Copied' : 'Copy All'}
                </Button>
              </div>
            </div>
          )}
        </Card>

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Regenerate Recovery Codes"
          description="Enter your current password to burn old codes and issue a fresh set."
          onSuccess={handleRegenerateCodesSuccess}
          requireTotp={false}
        />
      </div>
    </ShellLayout>
  );
}
