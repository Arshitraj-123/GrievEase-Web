'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import { Calendar, PlusCircle, ArrowLeft, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function ResolverLeavePage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [fromAt, setFromAt] = useState('');
  const [toAt, setToAt] = useState('');
  const [reason, setReason] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const [leaveRes, userRes] = await Promise.all([
        api.listLeaves(),
        api.listUsers({}),
      ]);
      setLeaves(Array.isArray(leaveRes) ? leaveRes : []);
      if (userRes && Array.isArray(userRes.items)) setUsers(userRes.items);
    } catch (err) {
      console.error('Failed to load leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !fromAt || !toAt || !reason.trim()) return;

    setSaving(true);
    try {
      await api.createLeave({
        userId: selectedUser,
        fromAt: new Date(fromAt).toISOString(),
        toAt: new Date(toAt).toISOString(),
        reason: reason.trim(),
      });
      setShowAddForm(false);
      setSelectedUser('');
      setReason('');
      setMessage('Leave registered. Any active open grievances assigned to this resolver have been automatically escalated.');
      fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Failed to register leave.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelLeave = async (id: string) => {
    if (!confirm('Cancel this recorded leave period?')) return;
    try {
      await api.cancelLeave(id);
      fetchLeaves();
    } catch (err: any) {
      alert(err.message || 'Error cancelling leave.');
    }
  };

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Resolver Leave">
      <div className="space-y-6 max-w-4xl mx-auto pb-16">
        <Link
          href="/admin"
          className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Operations Console</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Resolver Leave Management
            </h1>
            <p className="text-xs text-slate-500">
              Record resolver leaves. Open complaints assigned to resolvers on leave cascade immediately to the next governance tier with reason LEAVE.
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Register Leave'}</span>
          </Button>
        </div>

        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Add Leave Form */}
        {showAddForm && (
          <Card className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-600">
              Register New Leave Period
            </h3>
            <form onSubmit={handleCreateLeave} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Select Staff / Resolver *</label>
                <select
                  required
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold"
                >
                  <option value="">Choose resolver...</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">From Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={fromAt}
                    onChange={(e) => setFromAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">To Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={toAt}
                    onChange={(e) => setToAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Reason / Documentation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual leave, Medical emergency"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="min-h-[40px] px-5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs"
                >
                  {saving ? 'Registering...' : 'Save & Cascade Items'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Leaves List */}
        {leaves.length === 0 ? (
          <Card className="p-8 text-center text-xs text-slate-400">
            No active or scheduled resolver leaves recorded.
          </Card>
        ) : (
          <div className="space-y-2.5">
            {leaves.map((l) => (
              <div
                key={l.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {l.user_name || l.user_id}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {l.reason}
                    </Badge>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    From: {new Date(l.from_at).toLocaleString()} • To: {new Date(l.to_at).toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCancelLeave(l.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Cancel Leave"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
