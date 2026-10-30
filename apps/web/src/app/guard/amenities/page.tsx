'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  RefreshCw,
  AlertCircle,
  MapPin,
  Users,
  ArrowLeft,
  Calendar,
} from 'lucide-react';

export default function GuardAmenitiesConsolePage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTodaysBookings = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const data = await api.getGuardTodaysBookings();
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.warn('Failed to load guard bookings', err);
      // Fallback empty
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodaysBookings();
    const interval = setInterval(loadTodaysBookings, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleCheckIn = async (bookingId: string, passToken?: string) => {
    setVerifying(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.guardCheckInAmenity(bookingId, passToken || undefined);
      setActionSuccess(res.message || 'Check-in recorded successfully!');
      setTokenInput('');
      loadTodaysBookings();
    } catch (err: any) {
      setActionError(err.message || 'Check-in failed. Please verify pass token.');
    } finally {
      setVerifying(false);
    }
  };

  const handleNoShow = async (bookingId: string) => {
    if (!confirm('Are you sure you want to mark this booking as NO-SHOW?')) return;
    setVerifying(true);
    setActionSuccess(null);
    setActionError(null);
    try {
      const res = await api.guardMarkNoShow(bookingId);
      setActionSuccess(res.message || 'Booking marked as No-Show.');
      loadTodaysBookings();
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark No-Show.');
    } finally {
      setVerifying(false);
    }
  };

  const handleTokenSearchCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;

    // Check if token matches a loaded booking's ID or pass token
    const matched = bookings.find(
      (b) =>
        b.id === tokenInput.trim() ||
        (b.pass_token_hash && b.pass_token_hash.startsWith(tokenInput.trim())),
    );

    if (matched) {
      await handleCheckIn(matched.id, tokenInput.trim());
    } else {
      // Send directly to check-in with token
      await handleCheckIn(tokenInput.trim(), tokenInput.trim());
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.amenity_name && b.amenity_name.toLowerCase().includes(q)) ||
      (b.flat_number && b.flat_number.toLowerCase().includes(q)) ||
      (b.wing_name && b.wing_name.toLowerCase().includes(q)) ||
      (b.user_name && b.user_name.toLowerCase().includes(q))
    );
  });

  return (
    <ShellLayout activeNav="amenities-checkin">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-600 rounded-xl">
                <MapPin className="w-6 h-6 text-white" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Amenity Attendant Desk</h1>
                <p className="text-sm text-slate-300">
                  Verify entry passes, check-in residents & guests, and monitor today's facility usage.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTodaysBookings}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl font-medium text-sm transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Link
              href="/guard"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Main Gate
            </Link>
          </div>
        </div>

        {/* Feedback alerts */}
        {actionSuccess && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="font-semibold text-sm">{actionSuccess}</p>
          </div>
        )}
        {actionError && (
          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="font-semibold text-sm">{actionError}</p>
          </div>
        )}

        {/* Quick QR / Pass Token Verification Box */}
        <Card className="border-2 border-blue-500/30 shadow-sm bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
              <QrCode className="w-5 h-5 text-blue-600" />
              Scan QR or Enter Pass Code
            </CardTitle>
            <CardDescription>
              Enter the pass code or paste the HMAC digital pass token presented by the resident.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenSearchCheckIn} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste pass token, booking ID, or scan barcode..."
                className="flex-1 px-4 py-3.5 rounded-xl border border-slate-300 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-h-[48px]"
              />
              <button
                type="submit"
                disabled={verifying || !tokenInput.trim()}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2 min-h-[48px]"
              >
                <UserCheck className="w-4 h-4" />
                {verifying ? 'Checking...' : 'Check-In Pass'}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* Today's Bookings List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Today's Facility Schedule</h2>
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-0.5">
                {filteredBookings.length} Bookings
              </Badge>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search flat, name, facility..."
                className="pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
              <p className="font-medium">Loading facility bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700 text-base">No bookings found for today</p>
              <p className="text-xs text-slate-400 mt-1">
                Confirmed bookings for today will appear here for attendant check-in.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBookings.map((b) => {
                const isConfirmed = b.status === 'CONFIRMED';
                const isCompleted = b.status === 'COMPLETED';
                const isNoShow = b.status === 'NO_SHOW';

                return (
                  <Card
                    key={b.id}
                    className={`border transition shadow-sm ${
                      isCompleted
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : isNoShow
                        ? 'border-rose-200 bg-rose-50/20'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {b.amenity_type || 'AMENITY'}
                          </span>
                          <h3 className="font-bold text-slate-800 text-lg mt-1">{b.amenity_name}</h3>
                          <p className="text-xs text-slate-500">
                            Flat {b.wing_name ? `${b.wing_name}-` : ''}
                            {b.flat_number} • {b.user_name || 'Resident'}
                          </p>
                        </div>
                        <Badge
                          variant={
                            isCompleted ? 'default' : isNoShow ? 'danger' : 'neutral'
                          }
                          className="text-xs font-semibold"
                        >
                          {b.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {new Date(b.slot_start).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            -{' '}
                            {new Date(b.slot_end).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {b.people_count || 1} Person(s)
                            {b.guests_count ? ` (+${b.guests_count} Guests)` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons (Large 56px touch target friendly) */}
                      {isConfirmed && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleCheckIn(b.id)}
                            disabled={verifying}
                            className="w-full min-h-[52px] px-3 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Check In
                          </button>
                          <button
                            type="button"
                            onClick={() => handleNoShow(b.id)}
                            disabled={verifying}
                            className="w-full min-h-[52px] px-3 py-3 bg-rose-50 hover:bg-rose-100 active:scale-95 border border-rose-200 text-rose-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-5 h-5 text-rose-600" />
                            No-Show
                          </button>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 bg-emerald-100/60 p-2 rounded-lg">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Checked in at{' '}
                          {b.checked_in_at
                            ? new Date(b.checked_in_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'Today'}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ShellLayout>
  );
}
