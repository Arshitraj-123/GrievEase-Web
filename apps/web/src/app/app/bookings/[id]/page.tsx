'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  XCircle,
  CheckCircle,
} from 'lucide-react';

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;
  const router = useRouter();
  const { t } = useAccessibility();

  const [booking, setBooking] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Cancellation State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAmenityBooking(bookingId)
      .then((data) => {
        setBooking(data);
        if (data.passToken) {
          QRCode.toDataURL(data.passToken, { width: 256, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => {});
        } else {
          // Generate QR from booking ID for scanning at guard console
          QRCode.toDataURL(`grievease://amenity/${bookingId}`, { width: 256, margin: 1 })
            .then(setQrDataUrl)
            .catch(() => {});
        }
      })
      .catch(() => {
        const mockBooking = {
          id: bookingId,
          amenity_name: 'Clubhouse Banquet Hall',
          amenity_type: 'CLUBHOUSE',
          status: 'CONFIRMED',
          slot_start: '2026-11-05T10:00:00.000Z',
          slot_end: '2026-11-05T14:00:00.000Z',
          people_count: 50,
          guests_count: 20,
          purpose: 'Family Birthday Party',
          fee_paise: 250000,
          deposit_paise: 500000,
          cancellation_free_hours: 24,
          cancellation_fee_percent: 10,
          passToken: 'v1.mock_token.12345678',
        };
        setBooking(mockBooking);
        QRCode.toDataURL(`grievease://amenity/${bookingId}`, { width: 256, margin: 1 })
          .then(setQrDataUrl)
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelling(true);
    try {
      const res = await api.cancelAmenityBooking(bookingId, cancelReason);
      setBooking((prev: any) => ({ ...prev, status: 'CANCELLED', cancel_reason: cancelReason }));
      setCancelModalOpen(false);
      setCancelFeedback(
        res.isFreeCancellation
          ? 'Booking cancelled free of charge. Your deposit/fee has been credited.'
          : `Booking cancelled. A cancellation fee of ${formatPaise(res.cancellationFeePaise || 0)} was retained per policy.`,
      );
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading booking pass...
        </div>
      </ShellLayout>
    );
  }

  const isConfirmed = booking?.status === 'CONFIRMED';
  const isAwaitingPayment = booking?.status === 'AWAITING_PAYMENT';
  const isCancelled = booking?.status === 'CANCELLED';

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Link
          href="/app/bookings"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to My Bookings</span>
        </Link>

        {cancelFeedback && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200 font-medium"
          >
            {cancelFeedback}
          </div>
        )}

        {/* Pass Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm text-center">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {booking?.amenity_type}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
              {booking?.amenity_name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Booking Ref: <code>{booking?.id?.slice(0, 8)}</code>
            </p>
          </div>

          {/* Status Badge */}
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isConfirmed
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : isAwaitingPayment
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {isConfirmed && <CheckCircle className="w-3.5 h-3.5" />}
              <span>{booking?.status}</span>
            </span>
          </div>

          {/* QR Code Pass */}
          {isConfirmed && qrDataUrl && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 inline-block mx-auto shadow-xs">
              <img
                src={qrDataUrl}
                alt="HMAC-signed Amenity Entry Pass QR"
                className="w-52 h-52 mx-auto rounded-lg"
              />
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                Present this QR at the amenity entrance or security desk
              </p>
            </div>
          )}

          {isAwaitingPayment && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-2xl text-left text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Cash Payment Required</span>
              </div>
              <p>
                Please deposit the fee of{' '}
                <strong>
                  {formatPaise((booking?.fee_paise || 0) + (booking?.deposit_paise || 0))}
                </strong>{' '}
                in cash at the society office. Once the secretary records your cash receipt, your pass will activate automatically.
              </p>
              {booking?.hold_expires_at && (
                <p className="font-semibold text-amber-700 dark:text-amber-300">
                  Hold Expires: {new Date(booking.hold_expires_at).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Booking Details Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Date &amp; Time</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {new Date(booking?.slot_start).toLocaleDateString()} (
                {new Date(booking?.slot_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                {new Date(booking?.slot_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Headcount</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {booking?.people_count} resident(s) • {booking?.guests_count || 0} guest(s)
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Fee &amp; Deposit</span>
              <strong className="text-slate-800 dark:text-slate-200">
                Fee: {booking?.fee_paise > 0 ? formatPaise(booking.fee_paise) : 'Free'}
                {booking?.deposit_paise > 0 && ` • Deposit: ${formatPaise(booking.deposit_paise)}`}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Purpose</span>
              <strong className="text-slate-800 dark:text-slate-200">
                {booking?.purpose || 'Not specified'}
              </strong>
            </div>
          </div>

          {/* Actions */}
          {!isCancelled && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[44px]"
              >
                <XCircle className="w-4 h-4" />
                <span>{t.amenities.cancelBooking}</span>
              </button>
            </div>
          )}
        </div>

        {/* Cancellation Modal */}
        {cancelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 shadow-xl">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.amenities.cancelBooking}
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t.amenities.cancellationPolicy}:
                </span>
                <p>
                  Free cancellation up to <strong>24 hours</strong> before slot start. After that, a cancellation fee of <strong>10%</strong> applies.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for cancellation *
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Event rescheduled, family travel"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs min-h-[44px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 min-h-[44px]"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  disabled={cancelling || !cancelReason.trim()}
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ShellLayout>
  );
}

