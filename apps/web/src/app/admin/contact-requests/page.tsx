'use client';

import React, { useState, useEffect } from 'react';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  ShieldCheck,
  Search,
} from 'lucide-react';

export default function AdminContactRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await api.listContactRequestsAdmin(
        statusFilter !== 'ALL' ? statusFilter : undefined
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load contact requests', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const handleUpdateStatus = async (status: string) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await api.updateContactStatusAdmin(selectedRequest.id, status, statusNotes);
      setSelectedRequest(null);
      setStatusNotes('');
      await loadRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update contact status');
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
              <MessageSquare className="w-6 h-6 text-teal-600" />
              <span>Public Contact &amp; Inquiry Inbox</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Protected by self-hosted Proof-of-Work (PoW) and honeypots. Zero external CAPTCHA dependencies.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border bg-white dark:bg-slate-900"
            >
              <option value="ALL">All Requests</option>
              <option value="NEW">NEW</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="SPAM">SPAM</option>
            </select>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading inquiries...</div>
        ) : requests.length === 0 ? (
          <Card className="py-12 text-center">
            <CardContent>
              <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Inbox is clear
              </p>
              <p className="text-xs text-slate-500 mt-1">
                No inquiries matching the selected filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map((req) => (
              <Card
                key={req.id}
                className="hover:border-teal-400 transition-colors shadow-xs cursor-pointer"
                onClick={() => {
                  setSelectedRequest(req);
                  setStatusNotes(req.notes || '');
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-bold truncate">
                        {req.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 mt-0.5">
                        {req.email || req.phone || 'Anonymous contact'}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        req.status === 'NEW'
                          ? 'warning'
                          : req.status === 'RESOLVED'
                          ? 'success'
                          : req.status === 'SPAM'
                          ? 'danger'
                          : 'default'
                      }
                      className="text-[10px]"
                    >
                      {req.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                      {req.category || 'INQUIRY'}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {req.message}
                  </p>

                  <div className="pt-2 border-t flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>IP Hash: {req.ip_hash?.slice(0, 12)}...</span>
                    <span>PoW Verified</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail & Response Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white dark:bg-slate-900 border rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedRequest.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Category: {selectedRequest.category} &bull; Received{' '}
                    {new Date(selectedRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-1">
                  <span className="font-semibold text-slate-500">Inquiry Message:</span>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedRequest.message}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                  <div>Email: {selectedRequest.email || 'None'}</div>
                  <div>Phone: {selectedRequest.phone || 'None'}</div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Resolution Notes &amp; Action Taken
                  </label>
                  <textarea
                    rows={2}
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Enter internal resolution notes..."
                    className="w-full text-xs p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700"
                    onClick={() => handleUpdateStatus('SPAM')}
                    disabled={submitting}
                  >
                    Mark as SPAM
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleUpdateStatus('IN_PROGRESS')}
                      disabled={submitting}
                    >
                      In Progress
                    </Button>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                      onClick={() => handleUpdateStatus('RESOLVED')}
                      disabled={submitting}
                    >
                      Mark Resolved
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
