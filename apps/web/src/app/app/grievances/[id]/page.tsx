'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Input } from '@grievease/ui';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Send,
  Bell,
  RotateCcw,
  Star,
  FileText,
  User,
  Layers,
  Calendar,
  EyeOff,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { io, Socket } from 'socket.io-client';

export default function ResidentGrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const grievanceId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Notes & Modals
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [submittingAppeal, setSubmittingAppeal] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getGrievance(grievanceId);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load grievance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();

    // Join real-time room for live updates
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace('/api/v1', '')
      : 'http://localhost:4000';

    let socket: Socket | null = null;
    try {
      socket = io(`${socketUrl}/notifications`, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      socket.emit('join_grievance', { grievanceId });
      socket.on('grievance.updated', () => {
        fetchDetail();
      });
      socket.on('grievance.escalated', () => {
        fetchDetail();
      });
    } catch {}

    return () => {
      if (socket) socket.disconnect();
    };
  }, [grievanceId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    setActionMessage(null);
    try {
      await api.addGrievanceNote(grievanceId, { note: newNote.trim() });
      setNewNote('');
      setActionMessage({ text: 'Note submitted to timeline.' });
      fetchDetail();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to submit note', isError: true });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleRemind = async () => {
    setActionMessage(null);
    try {
      await api.remindResolver(grievanceId);
      setActionMessage({ text: 'Reminder notification sent to assigned resolver!' });
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Cannot send reminder at this time', isError: true });
    }
  };

  const handleMarkResolved = async () => {
    if (!confirm('Are you satisfied that this grievance has been properly resolved?')) return;
    try {
      await api.markGrievanceResolved(grievanceId);
      router.push(`/app/grievances/${grievanceId}/rate`);
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to confirm resolution', isError: true });
    }
  };

  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;
    setSubmittingAppeal(true);
    try {
      await api.appealGrievance(grievanceId, { reason: appealReason.trim() });
      setShowAppealModal(false);
      setAppealReason('');
      setActionMessage({ text: 'Appeal recorded and escalated to next governance level.' });
      fetchDetail();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to record appeal', isError: true });
    } finally {
      setSubmittingAppeal(false);
    }
  };

  const handleReopen = async () => {
    if (!confirm('Do you wish to reopen this grievance?')) return;
    try {
      await api.reopenGrievance(grievanceId);
      setActionMessage({ text: 'Grievance reopened and returned to active queue.' });
      fetchDetail();
    } catch (err: any) {
      setActionMessage({ text: err.message || 'Failed to reopen grievance', isError: true });
    }
  };

  if (loading) {
    return (
      <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
        <div className="space-y-4 max-w-3xl mx-auto py-12">
          <div className="h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </ShellLayout>
    );
  }

  if (error || !data) {
    return (
      <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
        <Card className="max-w-md mx-auto my-12 p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Grievance Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Unable to retrieve grievance.'}</p>
          <Link
            href="/app/grievances"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs inline-flex items-center gap-2"
          >
            Return to List
          </Link>
        </Card>
      </ShellLayout>
    );
  }

  const isResolved = data.status === 'RESOLVED';
  const isClosed = data.status === 'CLOSED';
  const isEscalated = data.status === 'ESCALATED' || data.currentLevel > 1;

  // 4 Levels in Stepper
  const levels = [
    { num: 1, label: 'L1: Secretary' },
    { num: 2, label: 'L2: Committee' },
    { num: 3, label: 'L3: Chairman' },
    { num: 4, label: 'L4: Governing Body' },
  ];

  return (
    <ShellLayout role="RESIDENT" userRoleTitle={t.nav.residentRole}>
      <div className="space-y-6 max-w-3xl mx-auto pb-16">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/app/grievances"
            className="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            ← Back to All Grievances
          </Link>
          <span className="font-mono text-xs font-bold text-slate-500">
            {data.publicId}
          </span>
        </div>

        {/* Action / Notification Banner */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 ${
              actionMessage.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}
          >
            {actionMessage.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* 1. Header Card with Status & Priority */}
        <div className="p-5 sm:p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs">
                {data.categoryName}
              </Badge>
              <Badge className="bg-slate-800 text-white border-slate-700 text-xs">
                {data.status}
              </Badge>
              {data.isAnonymous && (
                <Badge variant="outline" className="border-purple-500/50 text-purple-300 text-xs flex items-center gap-1">
                  <EyeOff className="w-3 h-3" /> Anonymous
                </Badge>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Target: {new Date(data.slaDueAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              {data.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {data.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
            {data.areaText && <span>📍 {data.areaText}</span>}
            <span>📅 Filed: {new Date(data.createdAt).toLocaleDateString()}</span>
            {data.assignedToName && <span>👤 Resolver: {data.assignedToName}</span>}
          </div>
        </div>

        {/* 2. 4-Level Governance Stepper */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Governance Resolution Chain
            </span>
            <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
              Active: Level {data.currentLevel}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {levels.map((lvl) => {
              const isPast = lvl.num < data.currentLevel;
              const isCurrent = lvl.num === data.currentLevel;

              return (
                <div
                  key={lvl.num}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 font-bold shadow-sm ring-1 ring-teal-500'
                      : isPast
                      ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-800 opacity-50 bg-slate-50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">
                    Step {lvl.num}
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                    {lvl.label.split(':')[1]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Escalation Alert Card (When Escalated) */}
        {isEscalated && (
          <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5 shadow-sm">
            <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                Escalated to Level {data.currentLevel} Governance
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                This grievance has automatically escalated due to SLA timing rules or resident appeal. Higher authority review is now actively in progress.
              </p>
            </div>
          </div>
        )}

        {/* 4. Evidence Gallery */}
        {data.evidence && data.evidence.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Attached Evidence ({data.evidence.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.evidence.map((ev: any) => (
                <a
                  key={ev.id}
                  href={ev.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-500 transition-all flex items-center gap-2.5 group"
                >
                  <FileText className="w-5 h-5 text-teal-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                    Download File
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 5. Resolution & Closure Box */}
        {data.closureNote && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Resolver Closure Note
            </span>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed font-medium">
              "{data.closureNote}"
            </p>
          </div>
        )}

        {/* 6. Timeline of RESIDENT-Visible Events */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Timeline of Events ({data.timeline?.length || 0})
          </h3>

          <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-4">
            {data.timeline?.map((evt: any) => (
              <div key={evt.id} className="relative space-y-1">
                <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-950" />
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {evt.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(evt.created_at).toLocaleString()}
                  </span>
                </div>
                {evt.payload && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {evt.payload.note || evt.payload.question || evt.payload.reason || JSON.stringify(evt.payload)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 7. Action Controls for Residents */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {/* Add Note Input Form */}
          {!isClosed && (
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder={t.grievances.notePlaceholder}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNote.trim()}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          )}

          {/* Resident Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {!isClosed && !isResolved && (
              <>
                <button
                  type="button"
                  onClick={handleRemind}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  <span>{t.grievances.remindResolver}</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkResolved}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.grievances.markResolved}</span>
                </button>
              </>
            )}

            {isResolved && (
              <>
                <Link
                  href={`/app/grievances/${grievanceId}/rate`}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow"
                >
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>{t.grievances.rateExperience}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleReopen}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{t.grievances.reopen}</span>
                </button>
              </>
            )}

            {!isClosed && (
              <button
                type="button"
                onClick={() => setShowAppealModal(true)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold inline-flex items-center gap-1.5 ml-auto"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>{t.grievances.appeal}</span>
              </button>
            )}
          </div>
        </div>

        {/* Appeal Reason Modal */}
        {showAppealModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  File Governance Appeal
                </h3>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Appeals immediately escalate this grievance to the next governance tier with formal record. Please provide your justification.
              </p>

              <form onSubmit={handleAppeal} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why the current resolution or progress is unsatisfactory..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAppealModal(false)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAppeal || !appealReason.trim()}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow transition-all"
                  >
                    {submittingAppeal ? 'Recording...' : 'Submit Appeal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
