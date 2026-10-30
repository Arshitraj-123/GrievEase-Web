'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Filter,
  Eye,
  Lock,
} from 'lucide-react';

export default function AdminPrivacyRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<any | null>(null);
  const [outcomeNote, setOutcomeNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.listPrivacyRequestsAdmin(
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load privacy requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleVerify = async (status: 'VERIFIED' | 'REJECTED') => {
    if (!selectedReq) return;
    if (status === 'VERIFIED' && !outcomeNote.trim()) {
      alert('Statutory Compliance Rule: Please enter the in-person committee verification notes.');
      return;
    }
    setSubmitting(true);
    try {
      await api.verifyPrivacyRequestAdmin(selectedReq.id, {
        status,
        outcomeNote: outcomeNote.trim() || undefined,
      });
      setSelectedReq(null);
      setOutcomeNote('');
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to verify privacy request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Administrator">
      <div className="space-y-6 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              <span>DPDP Act 2023 Statutory Privacy Requests</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Data principal rights management: data access exports, rectification, and in-person verified account erasure.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border bg-white dark:bg-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="VERIFIED">VERIFIED / PROCESSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        </div>

        {/* DPDP Legal Callout */}
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            Separation of Duties &amp; Fraud Prevention: Account erasure requires physical in-person verification with the society secretary or committee to prevent fraudulent erasing of unpaid maintenance dues or pending grievances.
          </span>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading statutory requests...</div>
        ) : requests.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No privacy requests pending
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Data deletion and access requests submitted by residents will be listed here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <Card key={req.id} className="hover:border-teal-400 transition-colors shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase font-bold">
                          {req.type}
                        </Badge>
                        <Badge
                          variant={
                            req.status === 'VERIFIED'
                              ? 'success'
                              : req.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                          className="text-[10px]"
                        >
                          {req.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-bold mt-1">
                        {req.requester_name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {req.registered_username ? `User: ${req.registered_username}` : 'Public Request'} &bull;{' '}
                        {new Date(req.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {req.details}
                  </p>

                  {req.outcome_note && (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Outcome Note:</span>{' '}
                      {req.outcome_note}
                    </div>
                  )}

                  <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono">Phone: {req.phone || 'Protected'}</span>
                    {req.status === 'SUBMITTED' && (
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-xs h-7 px-3"
                        onClick={() => setSelectedReq(req)}
                      >
                        In-Person Verify
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Verification Dialog */}
        {selectedReq && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-teal-600" />
                  <span>Verify Statutory Privacy Request</span>
                </h3>
                <button
                  onClick={() => setSelectedReq(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Requester: {selectedReq.requester_name}
                  </p>
                  <p className="text-slate-500">Request Type: {selectedReq.type}</p>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Details: {selectedReq.details}
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    In-Person Committee Verification Note *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={outcomeNote}
                    onChange={(e) => setOutcomeNote(e.target.value)}
                    placeholder="Record meeting date, physical ID checked (e.g. Aadhaar / Voter ID / Flat ownership papers), and committee sign-off..."
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleVerify('REJECTED')}
                    disabled={submitting}
                  >
                    Reject Request
                  </Button>

                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={submitting || !outcomeNote.trim()}
                  >
                    {selectedReq.type === 'DELETION' ? 'Verify & Anonymize Account' : 'Verify & Complete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
