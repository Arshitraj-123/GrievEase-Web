'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
} from '@grievease/ui';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Plus,
  DollarSign,
  Users,
  Check,
  X,
  User,
} from 'lucide-react';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [selectedAmenity, setSelectedAmenity] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'APPROVAL_QUEUE' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'ALL'>('APPROVAL_QUEUE');
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Rejection modal
  const [rejectingBooking, setRejectingBooking] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Booking Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    amenityId: '',
    flatId: '',
    flatNumber: '',
    slotStart: '',
    slotEnd: '',
    peopleCount: 1,
    purpose: 'Society approved request',
  });

  const loadData = async () => {
    setLoading(true);
    setActionError(null);
    try {
      const [amenitiesData, bookingsData] = await Promise.all([
        api.getAmenities(),
        api.getAdminAmenityBookings(selectedAmenity !== 'ALL' ? { amenityId: selectedAmenity } : {}),
      ]);
      if (Array.isArray(amenitiesData)) setAmenities(amenitiesData);
      if (Array.isArray(bookingsData)) setBookings(bookingsData);
    } catch (err: any) {
      console.warn('Failed to load admin bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedAmenity]);

  const handleApprove = async (id: string) => {
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.approveAmenityBooking(id);
      setActionSuccess('Booking approved successfully!');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to approve booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingBooking || !rejectReason.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.rejectAmenityBooking(rejectingBooking.id, rejectReason.trim());
      setActionSuccess('Booking rejected.');
      setRejectingBooking(null);
      setRejectReason('');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reject booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNoShow = async (id: string) => {
    if (!confirm('Mark this resident booking as NO-SHOW?')) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.markAmenityNoShow(id);
      setActionSuccess('Marked as No-Show.');
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to mark No-Show.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setActionError(null);
    try {
      await api.createAmenityBooking({
        amenityId: manualForm.amenityId,
        slotStart: new Date(manualForm.slotStart).toISOString(),
        slotEnd: new Date(manualForm.slotEnd).toISOString(),
        peopleCount: Number(manualForm.peopleCount),
        guestsCount: 0,
        purpose: manualForm.purpose,
      });
      setActionSuccess('Manual booking created successfully!');
      setShowManualModal(false);
      loadData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter bookings by tab
  const displayedBookings = bookings.filter((b) => {
    if (activeTab === 'APPROVAL_QUEUE') return b.status === 'PENDING_APPROVAL';
    if (activeTab === 'AWAITING_PAYMENT') return b.status === 'AWAITING_PAYMENT';
    if (activeTab === 'CONFIRMED') return b.status === 'CONFIRMED';
    return true; // ALL
  });

  const pendingApprovalCount = bookings.filter((b) => b.status === 'PENDING_APPROVAL').length;
  const awaitingPaymentCount = bookings.filter((b) => b.status === 'AWAITING_PAYMENT').length;

  return (
    <ShellLayout activeNav="admin-amenity-bookings">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Amenity Bookings Desk</h1>
                <p className="text-sm text-slate-500">
                  Review booking approvals, cash hold releases, attendant logs, and on-behalf reservations.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Book on Behalf
            </button>
            <button
              onClick={loadData}
              className="p-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action feedback */}
        {actionSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {actionSuccess}
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {actionError}
          </div>
        )}

        {/* Tab & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActiveTab('APPROVAL_QUEUE')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'APPROVAL_QUEUE'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Approval Queue</span>
              {pendingApprovalCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-white text-blue-700 rounded-full font-bold">
                  {pendingApprovalCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('AWAITING_PAYMENT')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'AWAITING_PAYMENT'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Awaiting Cash Payment</span>
              {awaitingPaymentCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-white text-amber-700 rounded-full font-bold">
                  {awaitingPaymentCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('CONFIRMED')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                activeTab === 'CONFIRMED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Confirmed Bookings
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Facility Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAmenity}
              onChange={(e) => setSelectedAmenity(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Facilities</option>
              {amenities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_en || a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bookings Table / Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
            <p className="font-medium">Loading bookings...</p>
          </div>
        ) : displayedBookings.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700 text-base">No bookings found</p>
            <p className="text-xs text-slate-400 mt-1">
              There are no bookings matching the selected filter and status.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Facility</th>
                    <th className="px-5 py-3.5">Resident / Flat</th>
                    <th className="px-5 py-3.5">Reserved Schedule</th>
                    <th className="px-5 py-3.5">Fee / Deposit</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block text-sm">
                          {b.amenity_name}
                        </span>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">
                          {b.amenity_type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800 block">
                          Flat {b.wing_name ? `${b.wing_name}-` : ''}
                          {b.flat_number}
                        </span>
                        <span className="text-slate-400">{b.user_name || 'Resident'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-slate-800 block">
                          {new Date(b.slot_start).toLocaleDateString([], {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="text-slate-400">
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
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-900 block">
                          {b.fee_paise > 0 ? formatPaise(b.fee_paise) : 'Free'}
                        </span>
                        {b.deposit_paise > 0 && (
                          <span className="text-slate-400 text-[10px]">
                            + {formatPaise(b.deposit_paise)} dep
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            b.status === 'CONFIRMED' || b.status === 'COMPLETED'
                              ? 'default'
                              : b.status === 'PENDING_APPROVAL' || b.status === 'AWAITING_PAYMENT'
                              ? 'neutral'
                              : 'danger'
                          }
                          className="text-[11px] font-semibold"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status === 'PENDING_APPROVAL' && (
                            <>
                              <button
                                onClick={() => handleApprove(b.id)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm transition"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectingBooking(b)}
                                disabled={isSubmitting}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold flex items-center gap-1 border border-rose-200 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            </>
                          )}

                          {b.status === 'AWAITING_PAYMENT' && (
                            <Link
                              href="/admin/billing/collect"
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-sm transition"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              Record Cash
                            </Link>
                          )}

                          {b.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleMarkNoShow(b.id)}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg font-medium transition text-[11px]"
                            >
                              No-Show
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal: Reject booking */}
        {rejectingBooking && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg mb-1">Reject Booking Request</h3>
              <p className="text-xs text-slate-500 mb-4">
                Please provide a reason. The resident will receive an immediate in-app notification.
              </p>
              <form onSubmit={handleRejectSubmit} className="space-y-4">
                <textarea
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (e.g. facility reserved for annual general meeting)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingBooking(null)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rejectReason.trim()}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                  >
                    {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Book on Behalf */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Book on Behalf of Resident</h3>
                  <p className="text-xs text-slate-500">
                    Administrator reservation bypasses certain dues restrictions.
                  </p>
                </div>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualBookingSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Facility *
                  </label>
                  <select
                    required
                    value={manualForm.amenityId}
                    onChange={(e) => setManualForm({ ...manualForm, amenityId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="">Select facility...</option>
                    {amenities.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name_en || a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={manualForm.slotStart}
                    onChange={(e) => setManualForm({ ...manualForm, slotStart: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={manualForm.slotEnd}
                    onChange={(e) => setManualForm({ ...manualForm, slotEnd: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    People Count
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={manualForm.peopleCount}
                    onChange={(e) => setManualForm({ ...manualForm, peopleCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purpose / Admin Note *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.purpose}
                    onChange={(e) => setManualForm({ ...manualForm, purpose: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl"
                  >
                    {isSubmitting ? 'Reserving...' : 'Create Reservation'}
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
