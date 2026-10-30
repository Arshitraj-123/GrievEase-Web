'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from '@grievease/ui';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  Wrench,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Camera,
  MapPin,
  ChevronLeft,
  ShieldCheck,
  Check,
  X,
  Phone,
  Image as ImageIcon,
  Play,
  Star,
  QrCode,
} from 'lucide-react';

export default function VendorTaskDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { t } = useAccessibility();

  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Visit Scheduling state
  const [visitFrom, setVisitFrom] = useState('');
  const [visitTo, setVisitTo] = useState('');

  // Completion state
  const [completionNote, setCompletionNote] = useState('');

  // Photo uploads
  const [beforePhoto, setBeforePhoto] = useState<any>(null);
  const [afterPhoto, setAfterPhoto] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const loadTask = async () => {
    setLoading(true);
    try {
      const data = await api.getVendorTask(id);
      setTask(data);
      if (data.expected_visit_from) {
        setVisitFrom(new Date(data.expected_visit_from).toISOString().slice(0, 16));
      }
      if (data.expected_visit_to) {
        setVisitTo(new Date(data.expected_visit_to).toISOString().slice(0, 16));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [id]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      await api.acceptVendorTask(id);
      await loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to accept task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    const reason = prompt('Please state the reason for declining:');
    if (!reason) return;
    setActionLoading(true);
    try {
      await api.declineVendorTask(id, reason);
      router.push('/vendor');
    } catch (err: any) {
      alert(err.message || 'Failed to decline task');
      setActionLoading(false);
    }
  };

  const handleScheduleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitFrom || !visitTo) {
      alert('Please select both start and end time for the visit.');
      return;
    }
    setActionLoading(true);
    try {
      await api.scheduleVendorVisit(id, {
        expectedVisitFrom: new Date(visitFrom).toISOString(),
        expectedVisitTo: new Date(visitTo).toISOString(),
      });
      await loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to schedule visit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      await api.startVendorTask(id);
      await loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to start task');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoCapture = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: 'BEFORE' | 'AFTER'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      const storageKey = `vendor-task-${id}-${kind.toLowerCase()}-${Date.now()}.jpg`;

      await api.uploadVendorTaskPhoto(id, {
        kind,
        storageKey,
        mime: file.type || 'image/jpeg',
        size: file.size,
        sha256,
      });

      if (kind === 'BEFORE') {
        setBeforePhoto({ storageKey, name: file.name });
      } else {
        setAfterPhoto({ storageKey, name: file.name });
      }

      await loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionNote) {
      alert('Please provide a brief completion note.');
      return;
    }

    const hasAfterPhoto =
      afterPhoto || (task?.photos && task.photos.some((p: any) => p.kind === 'AFTER'));

    if (!hasAfterPhoto) {
      alert('Mandatory Requirement: Please capture and upload an AFTER photo before completing the job.');
      return;
    }

    setActionLoading(true);
    try {
      await api.completeVendorTask(id, { completionNote });
      await loadTask();
    } catch (err: any) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
        <div className="py-16 text-center text-xs text-slate-500">Loading work order...</div>
      </ShellLayout>
    );
  }

  if (!task) {
    return (
      <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
        <div className="py-16 text-center text-xs text-slate-500">Task not found.</div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout role="VENDOR" userRoleTitle="Vendor Partner">
      <div className="max-w-3xl mx-auto space-y-6 px-2 sm:px-4">
        {/* Back link */}
        <Link
          href="/vendor"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Tasks</span>
        </Link>

        {/* Task Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-xs uppercase font-bold tracking-wider">
              {task.category || 'SERVICE ORDER'}
            </Badge>
            <Badge
              variant={task.priority === 'EMERGENCY' ? 'danger' : 'default'}
              className="text-xs font-bold"
            >
              {task.priority} Priority
            </Badge>
            <Badge variant="neutral" className="text-xs">
              Status: {task.status}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {task.title}
          </h1>
          <p className="text-xs text-slate-500">
            Assigned on {new Date(task.assigned_at).toLocaleDateString()} at{' '}
            {new Date(task.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Privacy Allowlist Guarantee */}
        <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-900 dark:text-teal-200 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600" />
          <span>
            {t.vendor?.privacyNotice ||
              'Resident identity is protected by default. Only task location and technical notes are disclosed.'}
          </span>
        </div>

        {/* Location & Contact Info */}
        <Card>
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>Service Location</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                {task.flat_number
                  ? `Flat ${task.flat_number}${task.wing ? `, Wing ${task.wing}` : ''}`
                  : task.area_text || 'Society Common Area'}
              </p>
              <p className="text-slate-500">
                Premises: Green Valley Residency
              </p>
            </div>

            {/* Resident contact: only shown if resident opted in */}
            {task.resident_phone ? (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Resident Shared Contact (Opt-In)</span>
                </div>
                <p className="font-mono text-blue-800 dark:text-blue-200 text-sm font-semibold">
                  {task.resident_phone}
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400">
                  Resident consented to direct contact for this maintenance request only.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Resident has not shared direct phone contact. Please coordinate through society gate and scheduled visit.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Task Description */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Problem Description & Scope</CardTitle>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            {task.description}
          </CardContent>
        </Card>

        {/* Gate Pass Info (if scheduled) */}
        {task.visitor_pass_id && (
          <Card className="border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>Automated Security Gate Pass Generated</span>
                </div>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Gate Code:{' '}
                  <span className="font-mono font-bold text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-300">
                    {task.gate_code || 'AUTHO-ENTRY'}
                  </span>
                </p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400">
                  Provide this 6-digit code or your company ID at the security gate for fast check-in.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── STATUS ACTION BLOCKS ────────────────────────────────────────────── */}

        {/* 1. ASSIGNED: Accept or Decline */}
        {task.status === 'ASSIGNED' && (
          <Card className="border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-900 dark:text-amber-200">
                <Clock className="w-4 h-4" />
                <span>Response Required</span>
              </CardTitle>
              <CardDescription className="text-xs text-amber-800 dark:text-amber-300">
                Please accept or decline this work order within your SLA acceptance window.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-xs flex-1"
                onClick={handleAccept}
                disabled={actionLoading}
              >
                <Check className="w-4 h-4 mr-1.5" />
                {t.vendor?.accept || 'Accept Work Order'}
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 text-xs flex-1"
                onClick={handleDecline}
                disabled={actionLoading}
              >
                <X className="w-4 h-4 mr-1.5" />
                {t.vendor?.decline || 'Decline Order'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 2. ACCEPTED: Schedule Visit */}
        {task.status === 'ACCEPTED' && (
          <Card className="border-teal-300 dark:border-teal-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Schedule Technician Visit</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Setting a visit window automatically generates a vendor gate pass for security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleScheduleVisit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Visit Start Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={visitFrom}
                      onChange={(e) => setVisitFrom(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Expected Visit End Time
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={visitTo}
                      onChange={(e) => setVisitTo(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-xs"
                  disabled={actionLoading}
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Confirm Visit Schedule &amp; Generate Gate Pass
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 3. VISIT_SCHEDULED: Start Work */}
        {task.status === 'VISIT_SCHEDULED' && (
          <Card className="border-blue-300 dark:border-blue-800">
            <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Visit Scheduled for{' '}
                  {new Date(task.expected_visit_from).toLocaleDateString()}
                </h4>
                <p className="text-xs text-slate-500">
                  Technician arrived on site? Click start to begin work recording.
                </p>
              </div>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-xs shrink-0"
                onClick={handleStartWork}
                disabled={actionLoading}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                {t.vendor?.startJob || 'Start Work'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* 4. IN_PROGRESS: Photos and Completion */}
        {task.status === 'IN_PROGRESS' && (
          <Card className="border-teal-400 dark:border-teal-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-teal-600" />
                <span>Job In Progress - Photo Proof &amp; Sign-Off</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Capture photos on-site using your mobile camera. AFTER photo is required to mark complete.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Photo Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BEFORE PHOTO */}
                <div className="p-3 border rounded-xl bg-slate-50 dark:bg-slate-900 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Camera className="w-4 h-4 text-slate-500" />
                    <span>{t.vendor?.beforePhoto || 'Before Photo (Optional)'}</span>
                  </div>
                  {beforePhoto ? (
                    <div className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Uploaded</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border shadow-xs hover:bg-slate-50">
                      <span>Capture / Select</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoCapture(e, 'BEFORE')}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </div>

                {/* AFTER PHOTO (MANDATORY) */}
                <div className="p-3 border-2 border-dashed border-teal-500/70 rounded-xl bg-teal-50/30 dark:bg-teal-950/20 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>{t.vendor?.afterPhoto || 'After Photo (Mandatory)'}</span>
                  </div>
                  {afterPhoto ? (
                    <div className="text-xs text-emerald-600 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Uploaded &amp; Verified</span>
                    </div>
                  ) : (
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 text-white shadow-xs hover:bg-teal-700">
                      <span>Capture Camera Proof</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handlePhotoCapture(e, 'AFTER')}
                        disabled={uploadingPhoto}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Completion Notes */}
              <form onSubmit={handleComplete} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t.vendor?.completionNote || 'Work Summary & Completion Notes'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Describe parts replaced, actions taken, or testing performed..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs font-bold"
                  disabled={actionLoading || uploadingPhoto}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  {t.vendor?.completeJob || 'Mark Job Completed'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* 5. COMPLETED: Sign-off & Resident Feedback */}
        {['COMPLETED', 'RESIDENT_CONFIRMED', 'DISPUTED'].includes(task.status) && (
          <Card className="border-emerald-300 dark:border-emerald-800 bg-emerald-50/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Job Completed &amp; Documented</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {task.completion_note && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Technician Note:</p>
                  <p className="text-slate-600 dark:text-slate-400">{task.completion_note}</p>
                </div>
              )}

              {/* Resident Sign-Off Status */}
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border space-y-2">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Resident Confirmation:</span>
                  <Badge
                    variant={
                      task.resident_confirmation === 'CONFIRMED'
                        ? 'success'
                        : task.resident_confirmation === 'NOT_FIXED'
                        ? 'danger'
                        : 'outline'
                    }
                    className="text-[10px]"
                  >
                    {task.resident_confirmation || 'AWAITING RESPONSE'}
                  </Badge>
                </p>

                {task.resident_rating && (
                  <div className="flex items-center gap-1.5 text-amber-500">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Rating:</span>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < task.resident_rating ? 'fill-current' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {task.resident_comment && (
                  <p className="text-slate-600 dark:text-slate-400 italic">
                    &ldquo;{task.resident_comment}&rdquo;
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ShellLayout>
  );
}
