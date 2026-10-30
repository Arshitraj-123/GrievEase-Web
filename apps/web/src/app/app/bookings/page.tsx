'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Calendar,
  CalendarCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export default function ResidentBookingsPage() {
  const { t } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'AWAITING_PAYMENT'>('UPCOMING');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyAmenityBookings()
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {
        // Fallback demo bookings
        setBookings([
          {
            id: 'bk-01',
            amenity_name: 'Clubhouse Banquet Hall',
            amenity_type: 'CLUBHOUSE',
            status: 'CONFIRMED',
            slot_start: '2026-11-05T10:00:00.000Z',
            slot_end: '2026-11-05T14:00:00.000Z',
            slot_count: 1,
            people_count: 50,
            fee_paise: 250000,
            deposit_paise: 500000,
            created_at: '2026-10-28T09:00:00.000Z',
          },
          {
            id: 'bk-02',
            amenity_name: 'Badminton Court',
            amenity_type: 'COURT',
            status: 'AWAITING_PAYMENT',
            hold_expires_at: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
            slot_start: '2026-11-02T16:00:00.000Z',
            slot_end: '2026-11-02T17:00:00.000Z',
            slot_count: 1,
            people_count: 4,
            fee_paise: 5000,
            deposit_paise: 0,
            created_at: '2026-10-30T08:00:00.000Z',
          },
          {
            id: 'bk-03',
            amenity_name: 'Fitness Center & Gym',
            amenity_type: 'GYM',
            status: 'COMPLETED',
            slot_start: '2026-10-25T07:00:00.000Z',
            slot_end: '2026-10-25T08:00:00.000Z',
            slot_count: 1,
            people_count: 1,
            fee_paise: 0,
            deposit_paise: 0,
            checked_in_at: '2026-10-25T07:05:00.000Z',
            created_at: '2026-10-24T18:00:00.000Z',
          },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'AWAITING_PAYMENT') {
      return b.status === 'AWAITING_PAYMENT';
    }
    if (activeTab === 'UPCOMING') {
      return (
        ['CONFIRMED', 'PENDING_APPROVAL'].includes(b.status) &&
        new Date(b.slot_end || b.slot_start) >= now
      );
    }
    // PAST
    return (
      ['COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW', 'EXPIRED'].includes(b.status) ||
      new Date(b.slot_end || b.slot_start) < now
    );
  });

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-6 h-6 text-teal-600" />
              <span>{t.amenities.myBookings}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Track your reservations, view digital entry QR passes, and check hold timers
            </p>
          </div>
          <Link
            href="/app/amenities"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold text-xs sm:text-sm hover:bg-teal-700 transition-colors min-h-[44px]"
          >
            <Calendar className="w-4 h-4" />
            <span>{t.amenities.bookSlot}</span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
          {(
            [
              { key: 'UPCOMING', label: t.amenities.upcoming },
              { key: 'AWAITING_PAYMENT', label: t.amenities.awaitingPayment },
              { key: 'PAST', label: t.amenities.past },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold min-h-[44px] transition-colors ${
                activeTab === tab.key
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading reservations...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No bookings found in this tab
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You do not have any {activeTab.toLowerCase().replace('_', ' ')} bookings.
            </p>
            <Link
              href="/app/amenities"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold hover:bg-teal-100 min-h-[44px]"
            >
              <span>{t.amenities.bookSlot}</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {b.amenity_type}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : b.status === 'AWAITING_PAYMENT'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {b.amenity_name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {new Date(b.slot_start).toLocaleDateString()} (
                        {new Date(b.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(b.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                    <span>•</span>
                    <span>People: <strong>{b.people_count}</strong></span>
                    {b.fee_paise > 0 && (
                      <>
                        <span>•</span>
                        <span>Fee: <strong>{formatPaise(b.fee_paise)}</strong></span>
                      </>
                    )}
                  </div>

                  {b.status === 'AWAITING_PAYMENT' && b.hold_expires_at && (
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 pt-1">
                      ⚠️ Payment Hold Expires: {new Date(b.hold_expires_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <Link
                    href={`/app/bookings/${b.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 min-h-[44px]"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Pass / Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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

