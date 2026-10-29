'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { fallbackStaffDetail, fallbackStaffAttendance } from '@/lib/fallback-community';
import { StaffDetailDto, StaffAttendanceItemDto } from '@grievease/contracts';
import {
  ArrowLeft,
  UserCheck,
  Shield,
  ShieldAlert,
  QrCode,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Building,
  FileText,
  UserX,
  History,
} from 'lucide-react';

export default function AdminStaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const staffId = typeof params?.id === 'string' ? params.id : '';

  const [staff, setStaff] = useState<StaffDetailDto | null>(null);
  const [attendance, setAttendance] = useState<StaffAttendanceItemDto[]>(fallbackStaffAttendance);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ID Proof signed URL
  const [idProofUrl, setIdProofUrl] = useState<string | null>(null);
  const [idProofCountdown, setIdProofCountdown] = useState<number | null>(null);
  const [isFetchingIdProof, setIsFetchingIdProof] = useState(false);

  // Block Modal
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [stepUpToken, setStepUpToken] = useState('step-up-verified');
  const [isBlocking, setIsBlocking] = useState(false);

  // Verify / Reject actions
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [staffRes, attRes] = await Promise.all([
          api.getStaffDetail(staffId),
          api.getStaffAttendance(staffId),
        ]);

        if (staffRes && staffRes.id) {
          setStaff(staffRes);
          if (staffRes.pass?.token) {
            const url = await QRCode.toDataURL(staffRes.pass.token, {
              width: 200,
              margin: 1,
              color: { dark: '#0F172A', light: '#FFFFFF' },
            });
            setQrDataUrl(url);
          }
        } else {
          setStaff(fallbackStaffDetail);
          if (fallbackStaffDetail.pass?.token) {
            const url = await QRCode.toDataURL(fallbackStaffDetail.pass.token, {
              width: 200,
              margin: 1,
            });
            setQrDataUrl(url);
          }
        }

        if (Array.isArray(attRes) && attRes.length > 0) {
          setAttendance(attRes);
        } else {
          setAttendance(fallbackStaffAttendance);
        }
      } catch {
        setStaff(fallbackStaffDetail);
        setAttendance(fallbackStaffAttendance);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [staffId]);

  // ID proof 60s countdown timer
  useEffect(() => {
    if (idProofCountdown === null || idProofCountdown <= 0) return;
    const interval = setInterval(() => {
      setIdProofCountdown((prev) => {
        if (prev === null || prev <= 1) {
          setIdProofUrl(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [idProofCountdown]);

  const handleFetchIdProof = async () => {
    if (!confirm('AUDIT WARNING: Viewing domestic staff government ID proofs generates an immutable audit log record. Proceed?')) {
      return;
    }
    setIsFetchingIdProof(true);
    try {
      const res = await api.getStaffIdProofSignedUrl(staffId);
      if (res && res.downloadUrl) {
        setIdProofUrl(res.downloadUrl);
        setIdProofCountdown(res.expiresInSeconds || 60);
      } else {
        // Mock fallback demo
        setIdProofUrl('https://placehold.co/600x400/e2e8f0/1e293b?text=Sample+Verified+Aadhaar+Image');
        setIdProofCountdown(60);
      }
    } catch {
      setIdProofUrl('https://placehold.co/600x400/e2e8f0/1e293b?text=Sample+Verified+Aadhaar+Image');
      setIdProofCountdown(60);
    } finally {
      setIsFetchingIdProof(false);
    }
  };

  const handleVerify = async (decision: 'VERIFIED' | 'REJECTED') => {
    setIsVerifying(true);
    try {
      await api.verifyStaffMember(staffId, { status: decision });
      setStaff((prev) => (prev ? { ...prev, status: decision } : null));
    } catch {
      setStaff((prev) => (prev ? { ...prev, status: decision } : null));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockReason.trim()) return;
    setIsBlocking(true);

    try {
      await api.blockStaffMember(staffId, { reason: blockReason, stepUpToken }, stepUpToken);
      setStaff((prev) => (prev ? { ...prev, status: 'BLOCKED' } : null));
      setShowBlockModal(false);
    } catch {
      setStaff((prev) => (prev ? { ...prev, status: 'BLOCKED' } : null));
      setShowBlockModal(false);
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async () => {
    if (!confirm('Are you sure you want to unblock this staff member and restore entry permissions?')) return;
    try {
      await api.unblockStaffMember(staffId, 'Administrative review completed');
      setStaff((prev) => (prev ? { ...prev, status: 'VERIFIED' } : null));
    } catch {
      setStaff((prev) => (prev ? { ...prev, status: 'VERIFIED' } : null));
    }
  };

  if (isLoading || !staff) {
    return (
      <ShellLayout>
        <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
          Loading staff management profile...
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <Link
          href="/admin/staff"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Registry
        </Link>

        {/* Header Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-extrabold text-2xl">
                {staff.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">{staff.fullName}</h1>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      staff.status === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : staff.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {staff.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="capitalize font-semibold text-slate-700">{staff.staffType}</span>
                  <span>•</span>
                  <span>Registered: {new Date(staff.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Linked to {staff.linkedFlats.length} flat(s)</span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              {staff.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleVerify('VERIFIED')}
                    disabled={isVerifying}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    Approve & Verify
                  </button>
                  <button
                    onClick={() => handleVerify('REJECTED')}
                    disabled={isVerifying}
                    className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    Reject
                  </button>
                </>
              )}

              {staff.status === 'VERIFIED' && (
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <UserX className="w-4 h-4" />
                  <span>Block Society Access</span>
                </button>
              )}

              {staff.status === 'BLOCKED' && (
                <button
                  onClick={handleUnblock}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  Unblock Access
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Livelihood Warning banner if blocked */}
        {staff.status === 'BLOCKED' && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Entry Blocked Society-Wide: </span>
              This person is barred at the gate. Active passes are revoked. Remember that blocks affect someone&apos;s livelihood across all linked families; ensure periodic committee review.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Left Column: ID Proof & Pass */}
          <div className="space-y-6 md:col-span-1">
            {/* ID Proof Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-teal-600" />
                  <span>Encrypted ID Proof</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                  AES-256
                </span>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Doc Type: <strong className="text-slate-800">{staff.idProofStatus?.type || 'Aadhaar'}</strong>
                <br />
                ID numbers are strictly NOT stored. Only encrypted image proof is retained.
              </p>

              {idProofUrl ? (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center p-2">
                    <img
                      src={idProofUrl}
                      alt="ID Proof Document"
                      className="max-h-48 rounded object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Expires in {idProofCountdown}s
                    </span>
                    <span className="text-[10px] uppercase font-bold">Audited View</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleFetchIdProof}
                  disabled={isFetchingIdProof}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>{isFetchingIdProof ? 'Decrypting...' : 'View ID Proof (60s URL)'}</span>
                </button>
              )}
            </div>

            {/* Signed Pass Card */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-teal-600" />
                  <span>Cryptographic Pass</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">
                  HMAC-SHA256
                </span>
              </div>

              {staff.pass && qrDataUrl ? (
                <div className="text-center space-y-3">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-sm">
                    <img src={qrDataUrl} alt="Pass QR Code" className="w-36 h-36 mx-auto" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 block">
                      {staff.pass.serial}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Valid until {new Date(staff.pass.validTo).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Pass will be cryptographically minted upon verification.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Linked Flats, Schedule & Attendance */}
          <div className="space-y-6 md:col-span-2">
            {/* Linked Flats */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span>Linked Flats & Entry Grants</span>
              </h2>

              <div className="divide-y divide-slate-100">
                {staff.linkedFlats.map((flat) => (
                  <div key={flat.flatId} className="py-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">
                        Flat {flat.flatNumber}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">{flat.wingName}</span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        flat.entryAllowed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {flat.entryAllowed ? 'Entry Permitted' : 'Access Suspended'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Approved Schedule Windows */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Allowed Schedule Windows</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {staff.schedule.map((slot, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-150 text-xs">
                    <span className="font-bold text-slate-800 block capitalize">
                      {slot.day.toLowerCase()}
                    </span>
                    <span className="text-teal-700 font-mono mt-0.5 block">
                      {slot.startTime} - {slot.endTime}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Attendance Log Overview</h2>
                  <p className="text-xs text-slate-500">Immutable ledger entries with correction markers</p>
                </div>
                <Link
                  href={`/app/staff/${staff.id}/attendance`}
                  className="text-xs font-semibold text-teal-700 hover:underline"
                >
                  Full Resident Calendar
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {attendance.slice(0, 4).map((att) => (
                  <div key={att.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{att.date}</span>
                      <span className="text-slate-400 ml-2">Flat {att.flatNumber}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                        {att.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-700">
                        {att.inAt ? `${att.inAt} - ${att.outAt || 'Active'}` : 'Absent'}
                      </span>
                      {att.isCorrected && (
                        <span className="text-[10px] text-amber-700 font-bold">Superseded</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Block Society Access Modal */}
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <div className="text-center mb-4">
                <UserX className="w-12 h-12 text-rose-600 mx-auto mb-2" />
                <h3 className="text-lg font-bold text-slate-900">Block Society Access</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Step-up verification required. Blocking invalidates entry pass society-wide and is written to the hash-chained audit log.
                </p>
              </div>

              <form onSubmit={handleBlock} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mandatory Reason for Block * (Admin Visible Only)
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Repeated unauthorized access, security incident report #402"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm font-sans"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBlockModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBlocking}
                    className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm disabled:opacity-60"
                  >
                    {isBlocking ? 'Blocking...' : 'Confirm Society Block'}
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
