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
  Flag,
  UserCheck,
  Lock,
  Unlock,
  KeyRound,
  FileWarning,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api-client';

export default function AdminGrievanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const grievanceId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [societyUsers, setSocietyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Status transition state
  const [targetStatus, setTargetStatus] = useState<string>('');
  const [closureNote, setClosureNote] = useState<string>('');
  const [statusLoading, setStatusLoading] = useState(false);

  // Internal Note state
  const [internalNote, setInternalNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Request Info state
  const [infoQuestion, setInfoQuestion] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Escalate state
  const [escalateReason, setEscalateReason] = useState('');
  const [showEscalateModal, setShowEscalateModal] = useState(false);

  // Assign state
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignReason, setAssignReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Flag state
  const [flagReason, setFlagReason] = useState('');
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Break-glass Reveal Identity modal state
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealReason, setRevealReason] = useState('');
  const [stepUpPassword, setStepUpPassword] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);
  const [revealedIdentity, setRevealedIdentity] = useState<any | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, profRes, usersRes] = await Promise.all([
        api.getAdminGrievance(grievanceId),
        api.getProfile().catch(() => null),
        api.listUsers({}).catch(() => null),
      ]);
      setData(res);
      setProfile(profRes);
      if (usersRes && Array.isArray(usersRes.items)) {
        setSocietyUsers(usersRes.items);
      }
      setTargetStatus(res.status);
    } catch (err: any) {
      setError(err.message || 'Failed to load grievance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [grievanceId]);

  const handleAcknowledge = async () => {
    try {
      await api.acknowledgeGrievance(grievanceId);
      setActionSuccess('Grievance acknowledged. Timer running at Level 1.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error acknowledging');
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    if (targetStatus === 'RESOLVED' && !closureNote.trim()) {
      alert('Mandatory closure note required when marking grievance as RESOLVED.');
      return;
    }

    setStatusLoading(true);
    try {
      await api.updateGrievanceStatus(grievanceId, {
        status: targetStatus,
        closureNote: closureNote.trim() || undefined,
      });
      setActionSuccess(`Status transitioned to ${targetStatus}`);
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Transition error');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internalNote.trim()) return;

    setNoteLoading(true);
    try {
      await api.addAdminInternalNote(grievanceId, { note: internalNote.trim() });
      setInternalNote('');
      setActionSuccess('Internal note added to audit trail.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error adding note');
    } finally {
      setNoteLoading(false);
    }
  };

  const handleRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoQuestion.trim()) return;

    try {
      await api.requestGrievanceInfo(grievanceId, { question: infoQuestion.trim() });
      setShowInfoModal(false);
      setInfoQuestion('');
      setActionSuccess('Information requested from resident. SLA clock paused.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error requesting info');
    }
  };

  const handleManualEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalateReason.trim()) return;

    try {
      await api.manualEscalateGrievance(grievanceId, { reason: escalateReason.trim() });
      setShowEscalateModal(false);
      setEscalateReason('');
      setActionSuccess('Manual escalation completed.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error escalating');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignee) return;

    try {
      await api.assignGrievance(grievanceId, {
        assignedTo: selectedAssignee,
        reason: assignReason.trim() || undefined,
      });
      setShowAssignModal(false);
      setActionSuccess('Grievance reassigned.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error assigning');
    }
  };

  const handleToggleFlag = async (flagged: boolean) => {
    if (flagged && !flagReason.trim()) {
      alert('Flagging reason is required.');
      return;
    }

    try {
      await api.flagGrievance(grievanceId, {
        flagged,
        reason: flagReason.trim() || 'Unflagged',
      });
      setShowFlagModal(false);
      setFlagReason('');
      setActionSuccess(flagged ? 'Grievance flagged.' : 'Flag removed.');
      fetchDetail();
    } catch (err: any) {
      alert(err.message || 'Error updating flag');
    }
  };

  // Super Admin Break-Glass Reveal
  const handleRevealIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevealError(null);

    if (revealReason.trim().length < 30) {
      setRevealError('Reason must be at least 30 characters for security auditing.');
      return;
    }

    setRevealLoading(true);

    try {
      // Step-up verification first
      const stepUpRes = await api.stepUp({ password: stepUpPassword });
      const stepUpToken = stepUpRes.stepUpToken;

      const res = await api.revealIdentity(
        grievanceId,
        { reason: revealReason.trim() },
        stepUpToken
      );

      setRevealedIdentity(res.identity);
      setActionSuccess('Anonymous identity decrypted. Notice dispatched to Chairman and Governing Body.');
    } catch (err: any) {
      setRevealError(err.message || 'Break-glass reveal failed. Verify step-up password.');
    } finally {
      setRevealLoading(false);
    }
  };

  if (loading) {
    return (
      <ShellLayout role="ADMIN" userRoleTitle="Resolver">
        <div className="space-y-4 max-w-4xl mx-auto py-12">
          <div className="h-40 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      </ShellLayout>
    );
  }

  if (error || !data) {
    return (
      <ShellLayout role="ADMIN" userRoleTitle="Resolver">
        <Card className="max-w-md mx-auto my-12 p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold">Grievance Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'Unable to retrieve record.'}</p>
          <Link
            href="/admin/inbox"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs inline-flex items-center gap-2"
          >
            Back to Inbox
          </Link>
        </Card>
      </ShellLayout>
    );
  }

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  return (
    <ShellLayout role="ADMIN" userRoleTitle="Resolver Action Panel">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Top Back Link & Public Reference */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/inbox"
            className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1.5"
          >
            ← Back to Resolver Inbox
          </Link>
          <span className="font-mono text-xs font-black text-slate-500">
            {data.publicId}
          </span>
        </div>

        {actionSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Header Details Card */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs">
                {data.categoryName}
              </Badge>
              <Badge
                className={`text-xs ${
                  data.priority === 'EMERGENCY'
                    ? 'bg-rose-600 text-white'
                    : data.priority === 'URGENT'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {data.priority}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.status}
              </Badge>
              <Badge className="bg-indigo-900 text-indigo-200 text-xs">
                Level {data.currentLevel}
              </Badge>
              {data.flagged && (
                <Badge className="bg-rose-600 text-white text-xs flex items-center gap-1">
                  <Flag className="w-3 h-3" /> Flagged: {data.flagReason}
                </Badge>
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>SLA Due: {new Date(data.slaDueAt).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              {data.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
              {data.description}
            </p>
          </div>

          {/* Submitter & Area Bar (Zero-PII for anonymous) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-3 flex-wrap">
              {data.isAnonymous ? (
                <div className="flex items-center gap-1.5 text-purple-400 font-bold bg-purple-950/60 px-2.5 py-1 rounded-xl border border-purple-800/60">
                  <EyeOff className="w-4 h-4" />
                  <span>Anonymous Resident (Identity Encrypted)</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <User className="w-4 h-4 text-teal-500" />
                  <span>
                    {data.submitter?.fullName} ({data.submitter?.flatNumber || 'Flat N/A'}) • {data.submitter?.mobile || ''}
                  </span>
                </div>
              )}
              {data.areaText && <span>📍 Location: {data.areaText}</span>}
              <span>Assigned: {data.assignedToName || 'Unassigned'}</span>
            </div>

            {/* Super Admin Break-Glass Trigger */}
            {data.isAnonymous && isSuperAdmin && (
              <button
                type="button"
                onClick={() => setShowRevealModal(true)}
                className="px-3 py-1.5 rounded-xl border border-rose-500/50 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Break-Glass Reveal Identity</span>
              </button>
            )}
          </div>
        </div>

        {/* Decrypted Identity Banner (if Super Admin revealed it) */}
        {revealedIdentity && (
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-md space-y-2">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-black text-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              <span>SUPER ADMIN BREAK-GLASS IDENTITY REVEALED</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1 font-semibold text-slate-800 dark:text-slate-200">
              <div>Name: {revealedIdentity.fullName}</div>
              <div>Flat: {revealedIdentity.flatNumber}</div>
              <div>Mobile: {revealedIdentity.mobile}</div>
              <div>User ID: {revealedIdentity.userId}</div>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium pt-1">
              An unalterable audit row was written and notices were sent to the Governing Body and Chairman.
            </p>
          </div>
        )}

        {/* 2-Column Layout: Left = Action Panel, Right = Full Timeline (with Internal events) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Action Panel */}
          <div className="space-y-6">
            {/* Status Transition Control Card */}
            <Card className="border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Action & Status Management
              </h3>

              {data.status === 'SUBMITTED' && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="w-full min-h-[48px] rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>Acknowledge Grievance</span>
                </button>
              )}

              <form onSubmit={handleUpdateStatus} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Update Workflow Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold focus:outline-none min-h-[44px]"
                  >
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PENDING_INFO">Pending Info (Pause SLA)</option>
                    <option value="RESOLVED">Resolved (Closure Note Required)</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {targetStatus === 'RESOLVED' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-rose-600">
                      Mandatory Closure Note *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Explain the resolution actions taken and outcome..."
                      value={closureNote}
                      onChange={(e) => setClosureNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={statusLoading || targetStatus === data.status}
                  className="w-full min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                >
                  {statusLoading ? 'Updating...' : 'Commit Status Transition'}
                </Button>
              </form>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInfoModal(true)}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <span>Request Info</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Assign</span>
                </button>

                {data.currentLevel < 4 && (
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(true)}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Escalate (L{data.currentLevel + 1})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (data.flagged) handleToggleFlag(false);
                    else setShowFlagModal(true);
                  }}
                  className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 ${
                    data.flagged
                      ? 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      : 'border-rose-400 text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>{data.flagged ? 'Remove Flag' : 'Flag Complaint'}</span>
                </button>
              </div>
            </Card>

            {/* Internal Resolver Notes Form */}
            <Card className="border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Internal Resolver Note (Hidden from Resident)
              </h3>
              <form onSubmit={handleAddInternalNote} className="space-y-2">
                <textarea
                  rows={3}
                  required
                  placeholder="Record internal diagnostic notes, vendor calls, or committee comments..."
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                />
                <Button
                  type="submit"
                  disabled={noteLoading || !internalNote.trim()}
                  className="w-full min-h-[40px] rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs"
                >
                  {noteLoading ? 'Saving...' : 'Add Internal Audit Note'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column: Full Timeline (Resident + Internal Events) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Audit Event Trail ({data.timeline?.length || 0} events)
            </h3>

            <div className="space-y-3 border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-4">
              {data.timeline?.map((evt: any) => {
                const isInternal = evt.visibility === 'INTERNAL';
                return (
                  <div
                    key={evt.id}
                    className={`relative p-3.5 rounded-2xl border ${
                      isInternal
                        ? 'border-purple-200 bg-purple-50/40 dark:bg-purple-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div
                      className={`absolute -left-[23px] top-4 w-3 h-3 rounded-full ring-4 ring-white dark:ring-slate-950 ${
                        isInternal ? 'bg-purple-500' : 'bg-teal-500'
                      }`}
                    />

                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {evt.type.replace(/_/g, ' ')}
                        </span>
                        <Badge
                          variant={isInternal ? 'default' : 'outline'}
                          className={`text-[9px] ${isInternal ? 'bg-purple-600 text-white' : ''}`}
                        >
                          {evt.visibility}
                        </Badge>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mb-1">
                      Actor: {evt.actor_role} ({evt.actor_id || 'System'})
                    </div>

                    {evt.payload && (
                      <div className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed mt-1">
                        {evt.payload.note || evt.payload.question || evt.payload.reason || JSON.stringify(evt.payload)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal: Request Info */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Request Additional Information
              </h3>
              <p className="text-xs text-slate-500">
                This will transition the status to PENDING_INFO and pause the SLA countdown until the resident responds.
              </p>
              <form onSubmit={handleRequestInfo} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="Specify the exact questions or photos needed from the resident..."
                  value={infoQuestion}
                  onChange={(e) => setInfoQuestion(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInfoModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs">
                    Dispatch Request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Manual Escalate */}
        {showEscalateModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-rose-600">
                Manual Escalation to Level {data.currentLevel + 1}
              </h3>
              <p className="text-xs text-slate-500">
                State your rationale for manually elevating this grievance ahead of automated SLA breach.
              </p>
              <form onSubmit={handleManualEscalate} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="Escalation justification (recorded permanently in audit log)..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEscalateModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs">
                    Confirm Escalation
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Reassign */}
        {showAssignModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reassign Grievance
              </h3>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Select Resolver</label>
                  <select
                    required
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold"
                  >
                    <option value="">Choose an active staff / resolver</option>
                    {societyUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Specialized plumber required"
                    value={assignReason}
                    onChange={(e) => setAssignReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button type="submit" className="min-h-[40px] px-4 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs">
                    Reassign
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Flag Complaint */}
        {showFlagModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-rose-600">
                Flag Complaint
              </h3>
              <p className="text-xs text-slate-500">
                Identify this complaint as abusive, frivolous, or fraudulent.
              </p>
              <div className="space-y-4">
                <textarea
                  required
                  rows={3}
                  placeholder="Flagging justification..."
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-rose-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFlagModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button
                    type="button"
                    onClick={() => handleToggleFlag(true)}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                  >
                    Confirm Flag
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Super Admin Break-Glass Identity Reveal */}
        {showRevealModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border-2 border-rose-500 shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <FileWarning className="w-7 h-7 shrink-0" />
                <h3 className="text-base font-black">
                  BREAK-GLASS IDENTITY REVEAL
                </h3>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                This endpoint decrypts an anonymous resident complaint. It requires high-security step-up authentication and written legal justification (min 30 characters). Notices are dispatched immediately to all Governing Body members and the Chairman.
              </p>

              {revealError && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-800 text-xs border border-rose-200">
                  {revealError}
                </div>
              )}

              <form onSubmit={handleRevealIdentity} className="space-y-3.5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-200">
                      Legal Justification (Min 30 chars) *
                    </label>
                    <span className={`text-[10px] ${revealReason.length < 30 ? 'text-rose-500' : 'text-emerald-600'}`}>
                      {revealReason.length}/30
                    </span>
                  </div>
                  <textarea
                    required
                    minLength={30}
                    rows={3}
                    placeholder="Enter formal justification for revealing this resident's identity..."
                    value={revealReason}
                    onChange={(e) => setRevealReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Confirm Super Admin Password (Step-Up) *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your administrative password"
                    value={stepUpPassword}
                    onChange={(e) => setStepUpPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border text-xs focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevealModal(false)}
                    className="min-h-[40px] px-4 py-2 rounded-xl border text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={revealLoading || revealReason.length < 30 || !stepUpPassword}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg"
                  >
                    {revealLoading ? 'Decrypting...' : 'Execute Break-Glass Reveal'}
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
