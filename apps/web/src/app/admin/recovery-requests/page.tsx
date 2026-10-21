'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Alert } from '@grievease/ui';
import { StepUpModal } from '@/components/StepUpModal';
import { Clock, CheckCircle2, XCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function RecoveryRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await api.listRecoveryRequests();
      setRequests(data || []);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveClick = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setStepUpOpen(true);
  };

  const handleApproveConfirmed = async (stepUpToken: string) => {
    if (!selectedTicketId) return;
    try {
      await api.approveRecovery(selectedTicketId, stepUpToken);
      fetchRequests();
      setSelectedTicketId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to approve recovery ticket');
    }
  };

  const handleCancelClick = async (ticketId: string) => {
    if (!confirm('Cancel this recovery request? The user ticket will be cancelled.')) return;
    try {
      await api.cancelRecovery(ticketId);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel recovery ticket');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Super Administrator">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Account Recovery Requests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Residents who passed security questions enter a 24-hour cooling-off window. You may cancel fraudulent requests or approve immediately after in-person verification.
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Flat Number</th>
                  <th className="p-3.5">Requested At</th>
                  <th className="p-3.5">Eligible After Cooling-Off</th>
                  <th className="p-3.5">Request IP</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {isLoading ? 'Loading recovery requests...' : 'No pending recovery requests at this time.'}
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">{r.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{r.username} ({r.member_id})</div>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {r.flat_number || 'External'}
                      </td>
                      <td className="p-3.5 text-slate-500">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(r.eligible_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400">
                        {r.ip || '127.0.0.1'}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelClick(r.id)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Fraud
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveClick(r.id)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          Verify In-Person & Approve
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <StepUpModal
          isOpen={stepUpOpen}
          onClose={() => setStepUpOpen(false)}
          title="Approve Recovery Ticket"
          description="Confirm administrative step-up to bypass remaining cooling-off delay after in-person verification."
          onSuccess={handleApproveConfirmed}
        />
      </div>
    </ShellLayout>
  );
}
