'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackStaffList } from '@/lib/fallback-community';
import { StaffListItemDto } from '@grievease/contracts';
import {
  UserCheck,
  Plus,
  QrCode,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Briefcase,
  Users,
} from 'lucide-react';

export default function ResidentStaffListPage() {
  const { t } = useAccessibility();
  const [staffList, setStaffList] = useState<StaffListItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStaff() {
      setIsLoading(true);
      try {
        const res = await api.getResidentStaff();
        if (Array.isArray(res)) {
          setStaffList(res);
        } else {
          setStaffList(fallbackStaffList);
        }
      } catch {
        setStaffList(fallbackStaffList);
      } finally {
        setIsLoading(false);
      }
    }
    loadStaff();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            Pending Verification
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
            <AlertCircle className="w-3 h-3" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-green-500/10 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Present (Completed)
          </span>
        );
      case 'CHECKED_IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Checked In Now
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            Not Logged Today
          </span>
        );
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                <UserCheck className="w-6 h-6" />
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {t.domesticStaff?.title || 'Domestic Staff Management'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t.domesticStaff?.subtitle ||
                'Registered household staff, verified digital passes, and daily logs'}
            </p>
          </div>

          <Link
            href="/app/staff/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md transition-colors min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.domesticStaff?.addStaffButton || 'Register Domestic Staff'}</span>
          </Link>
        </div>

        {/* Staff Cards List */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading household staff...</div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No staff registered for your flat</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Register your maids, cooks, drivers, or nannies to issue them an official verified society gate pass.
            </p>
            <div className="pt-2">
              <Link
                href="/app/staff/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Register Staff Member
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((staff) => (
              <div
                key={staff.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4 hover:border-teal-500 transition-all duration-200"
              >
                <div className="space-y-3">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 flex items-center justify-center font-extrabold text-base shrink-0 shadow-2xs">
                        {staff.fullName[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {staff.fullName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {staff.staffType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(staff.status)}
                          {staff.passSerial && (
                            <span className="text-[11px] font-mono text-slate-400">
                              {staff.passSerial}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Multi-flat link indicator */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span>Works in {staff.linkedFlatsCount} flat{staff.linkedFlatsCount === 1 ? '' : 's'} in society</span>
                  </div>

                  {/* Today's Attendance status */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Today&apos;s Status:</span>
                    {getAttendanceBadge(staff.todayAttendanceStatus)}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/app/staff/${staff.id}`}
                    className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <QrCode className="w-4 h-4 text-teal-600" />
                    <span>Digital Pass &amp; Profile</span>
                  </Link>

                  <Link
                    href={`/app/staff/${staff.id}/attendance`}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-800 dark:text-teal-300 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors border border-teal-200 dark:border-teal-900/40"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Attendance</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ShellLayout>
  );
}
