'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackStaffDetail, fallbackStaffAttendance } from '@/lib/fallback-community';
import { StaffDetailDto, StaffAttendanceItemDto } from '@grievease/contracts';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  PlusCircle,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function StaffAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const staffId = typeof params?.id === 'string' ? params.id : '';

  const [staff, setStaff] = useState<StaffDetailDto | null>(null);
  const [attendance, setAttendance] = useState<StaffAttendanceItemDto[]>(fallbackStaffAttendance);
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [isLoading, setIsLoading] = useState(true);

  // Quick mark modal
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markDate, setMarkDate] = useState('2026-10-29');
  const [markInTime, setMarkInTime] = useState('08:30');
  const [markOutTime, setMarkOutTime] = useState('11:00');
  const [markNote, setMarkNote] = useState('');
  const [isSubmittingMark, setIsSubmittingMark] = useState(false);
  const [markSuccess, setMarkSuccess] = useState(false);
  const [markError, setMarkError] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const staffRes = await api.getStaffDetail(staffId);
        if (staffRes && staffRes.id) {
          setStaff(staffRes);
        } else {
          setStaff(fallbackStaffDetail);
        }

        const attRes = await api.getStaffAttendance(staffId, undefined, selectedMonth);
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
  }, [staffId, selectedMonth]);

  // Statistics calculation
  const presentDays = attendance.filter((a) => a.inAt !== null).length;
  const totalDays = 31; // October
  const absentDays = Math.max(0, 26 - presentDays); // assuming 26 working days

  const calculateHours = (inAt?: string | null, outAt?: string | null): number => {
    if (!inAt || !outAt) return 0;
    const [inH, inM] = inAt.split(':').map(Number);
    const [outH, outM] = outAt.split(':').map(Number);
    if (isNaN(inH!) || isNaN(inM!) || isNaN(outH!) || isNaN(outM!)) return 0;
    const diffM = outH * 60 + outM - (inH * 60 + inM);
    return Math.max(0, +(diffM / 60).toFixed(1));
  };

  const totalHours = attendance.reduce(
    (acc, item) => acc + calculateHours(item.inAt, item.outAt),
    0
  );

  const handleMarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarkError('');
    setIsSubmittingMark(true);

    try {
      const flatId = staff?.linkedFlats?.[0]?.flatId || 'flat-101';
      await api.markStaffAttendance(staffId, {
        staffId,
        flatId,
        date: markDate,
        inAt: markInTime || undefined,
        outAt: markOutTime || undefined,
        note: markNote || undefined,
      });

      // Update local attendance state
      const newItem: StaffAttendanceItemDto = {
        id: `att-${Date.now()}`,
        staffId,
        staffName: staff?.fullName || 'Staff Member',
        flatNumber: staff?.linkedFlats?.[0]?.flatNumber || 'A-101',
        date: markDate,
        inAt: markInTime || null,
        outAt: markOutTime || null,
        source: 'MANUAL',
        markedByName: 'You (Resident)',
        note: markNote || null,
        isCorrected: false,
      };

      setAttendance((prev) => [newItem, ...prev.filter((p) => p.date !== markDate)]);
      setMarkSuccess(true);
      setTimeout(() => {
        setMarkSuccess(false);
        setShowMarkModal(false);
      }, 1200);
    } catch {
      setMarkError('Failed to record attendance. Please try again.');
    } finally {
      setIsSubmittingMark(false);
    }
  };

  // Formula-safe export function
  const handleExport = () => {
    // Escape potentially unsafe formula characters (=, +, -, @)
    const sanitizeFormula = (val: string | null | undefined): string => {
      if (!val) return '';
      const str = String(val);
      if (/^[=+\-@\t\r]/.test(str)) {
        return `'${str}`;
      }
      return str;
    };

    const headers = ['Date', 'Staff Name', 'Flat', 'In Time', 'Out Time', 'Hours', 'Source', 'Marked By', 'Note'];
    const rows = attendance.map((item) => [
      sanitizeFormula(item.date),
      `"${sanitizeFormula(item.staffName)}"`,
      sanitizeFormula(item.flatNumber),
      sanitizeFormula(item.inAt || '-'),
      sanitizeFormula(item.outAt || '-'),
      calculateHours(item.inAt, item.outAt).toString(),
      sanitizeFormula(item.source),
      `"${sanitizeFormula(item.markedByName)}"`,
      `"${sanitizeFormula(item.note || '')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Staff_Attendance_${staff?.fullName || 'Staff'}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ShellLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back navigation */}
        <Link
          href={`/app/staff/${staffId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff Profile
        </Link>

        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full bg-teal-100 text-teal-800">
                {staff?.staffType || 'Staff'} Attendance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {staff?.fullName || 'Staff Member'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Monthly attendance log & verification for linked flat {staff?.linkedFlats?.[0]?.flatNumber || 'A-101'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              title="Download formula-safe CSV export"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowMarkModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Mark Today</span>
            </button>
          </div>
        </div>

        {/* Month Selector & Quick Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Days Present</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-teal-700">{presentDays}</span>
              <span className="text-xs text-slate-400">/ 26 workdays</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Days Absent / Off</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-600">{absentDays}</span>
              <span className="text-xs text-slate-400">days</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Total Hours</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">{totalHours.toFixed(1)}</span>
              <span className="text-xs text-slate-400">hrs logged</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">Avg Daily Shift</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-indigo-600">
                {presentDays > 0 ? (totalHours / presentDays).toFixed(1) : '0'}
              </span>
              <span className="text-xs text-slate-400">hrs/day</span>
            </div>
          </div>
        </div>

        {/* Month Navigation Banner */}
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <button
            onClick={() => setSelectedMonth('2026-09')}
            className={`p-1.5 rounded-lg border transition-colors ${
              selectedMonth === '2026-09' ? 'bg-slate-100 text-slate-400' : 'hover:bg-slate-50 text-slate-700'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span className="font-semibold text-slate-900">
              {selectedMonth === '2026-10' ? 'October 2026' : 'September 2026'}
            </span>
          </div>
          <button
            onClick={() => setSelectedMonth('2026-10')}
            className={`p-1.5 rounded-lg border transition-colors ${
              selectedMonth === '2026-10' ? 'bg-slate-100 text-slate-400' : 'hover:bg-slate-50 text-slate-700'
            }`}
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Append-Only Notice Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 flex items-start gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800">Immutable, Append-Only Register: </span>
            Attendance logs cannot be silently deleted or altered. Corrections create a new verified record that
            supersedes earlier entries. In Phase 6, future guard scanner timestamps will automatically link here.
          </div>
        </div>

        {/* Attendance Entries List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Daily Attendance Log</h2>
            <span className="text-xs text-slate-400">{attendance.length} records in this month</span>
          </div>

          <div className="divide-y divide-slate-100">
            {attendance.map((record) => {
              const isPresent = record.inAt !== null;
              const hours = calculateHours(record.inAt, record.outAt);

              return (
                <div
                  key={record.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isPresent ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isPresent ? 'PRESENT' : 'OFF / ABSENT'}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {record.source}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {isPresent ? (
                          <>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {record.inAt} - {record.outAt || 'Active'}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">{hours} hrs</span>
                          </>
                        ) : (
                          <span>No shift logged</span>
                        )}
                        <span>•</span>
                        <span>Marked by {record.markedByName}</span>
                      </div>

                      {record.note && (
                        <p className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 px-2.5 py-1 rounded-md border border-slate-150 inline-block">
                          Note: {record.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {record.isCorrected && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded self-start sm:self-auto">
                      Superseded Entry
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Mark Modal */}
        {showMarkModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-slideUp">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
                <button
                  onClick={() => setShowMarkModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              {markSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-900">Attendance Logged</h4>
                  <p className="text-xs text-slate-500 mt-1">Entry securely saved to society ledger.</p>
                </div>
              ) : (
                <form onSubmit={handleMarkSubmit} className="mt-4 space-y-4">
                  {markError && (
                    <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {markError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Date (YYYY-MM-DD)
                    </label>
                    <input
                      type="date"
                      value={markDate}
                      onChange={(e) => setMarkDate(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        In Time
                      </label>
                      <input
                        type="time"
                        value={markInTime}
                        onChange={(e) => setMarkInTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Out Time
                      </label>
                      <input
                        type="time"
                        value={markOutTime}
                        onChange={(e) => setMarkOutTime(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Note / Tasks Completed (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Balcony wash, laundry"
                      value={markNote}
                      onChange={(e) => setMarkNote(e.target.value)}
                      maxLength={150}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowMarkModal(false)}
                      className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingMark}
                      className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
                    >
                      {isSubmittingMark ? 'Saving...' : 'Record Entry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
