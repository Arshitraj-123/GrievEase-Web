'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { formatPaise } from '@grievease/contracts';
import {
  Calendar,
  Clock,
  Users,
  ShieldCheck,
  ChevronLeft,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

export default function AmenityBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const amenityId = resolvedParams.id;
  const router = useRouter();
  const { t } = useAccessibility();

  const [amenity, setAmenity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedSlotTime, setSelectedSlotTime] = useState('10:00');
  const [slotCount, setSlotCount] = useState(1);
  const [peopleCount, setPeopleCount] = useState(1);
  const [guestsCount, setGuestsCount] = useState(0);
  const [purpose, setPurpose] = useState('');
  const [acceptedRules, setAcceptedRules] = useState(false);

  // Submission & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  useEffect(() => {
    api
      .getAmenity(amenityId)
      .then((data) => setAmenity(data))
      .catch(() => {
        setAmenity({
          id: amenityId,
          name: 'Clubhouse Banquet Hall',
          type: 'CLUBHOUSE',
          description: 'Spacious air-conditioned banquet hall with seating for up to 100 people.',
          rules: '1. Music strictly off by 10:00 PM.\n2. Catering cleanup is the resident responsibility.\n3. Security deposit refunded after inspection.',
          mode: 'EXCLUSIVE',
          capacity_total: 100,
          slot_minutes: 120,
          min_slots: 1,
          max_slots: 4,
          fee_mode: 'PER_SLOT',
          fee_paise: 150000,
          deposit_paise: 300000,
          fee_collection: 'COLLECT_BEFORE_CONFIRM',
          hold_hours: 24,
          requires_approval: false,
        });
      })
      .finally(() => setLoading(false));
  }, [amenityId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedRules) {
      setErrorMsg('Please read and accept the amenity rules before booking.');
      return;
    }
    if (!purpose.trim()) {
      setErrorMsg('Please enter the purpose of your booking.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const slotStartIso = `${selectedDate}T${selectedSlotTime}:00.000Z`;

    try {
      const res = await api.createAmenityBooking({
        amenityId,
        slotStart: slotStartIso,
        slotCount,
        peopleCount,
        guestsCount,
        purpose,
      });
      setBookingSuccess(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete booking. Please check rules.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="text-center py-12 text-slate-400 text-sm">
          Loading amenity details...
        </div>
      </ShellLayout>
    );
  }

  const calculatedFee =
    amenity?.fee_mode === 'NONE'
      ? 0
      : amenity?.fee_mode === 'PER_SLOT'
      ? amenity.fee_paise * slotCount
      : amenity?.fee_paise || 0;

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Link */}
        <Link
          href="/app/amenities"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white min-h-[44px]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Amenities</span>
        </Link>

        {/* Success Modal / Screen */}
        {bookingSuccess ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-teal-200 dark:border-teal-800 p-6 sm:p-8 text-center space-y-5 shadow-lg">
            <div className="w-16 h-16 bg-teal-100 dark:bg-teal-950/80 text-teal-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {t.amenities.bookingSuccess}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Booking Status:{' '}
                <strong className="text-teal-600 uppercase font-black">
                  {bookingSuccess.status}
                </strong>
              </p>
            </div>

            {bookingSuccess.status === 'AWAITING_PAYMENT' && (
              <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-left text-xs sm:text-sm text-amber-900 dark:text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Cash Payment Required at Office</span>
                </div>
                <p>
                  Your booking slot is held temporarily. Please visit the society office within{' '}
                  <strong>{amenity.hold_hours || 24} hours</strong> to pay{' '}
                  <strong>{formatPaise(calculatedFee + (amenity.deposit_paise || 0))}</strong> in cash.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                href={`/app/bookings/${bookingSuccess.bookingId}`}
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-teal-600 text-white font-bold text-sm min-h-[44px] hover:bg-teal-700"
              >
                {t.amenities.viewPass}
              </Link>
              <Link
                href="/app/bookings"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm min-h-[44px] hover:bg-slate-200"
              >
                {t.amenities.myBookings}
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleBook}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6 shadow-xs"
          >
            {/* Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-600 uppercase tracking-wider mb-1">
                <span>{amenity?.type}</span>
                <span>•</span>
                <span>
                  {amenity?.mode === 'EXCLUSIVE'
                    ? t.amenities.exclusiveMode
                    : t.amenities.capacityMode}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {amenity?.name}
              </h1>
              {amenity?.description && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {amenity.description}
                </p>
              )}
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium"
              >
                {errorMsg}
              </div>
            )}

            {/* Date and Time Slot Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.amenities.selectDate}
                </label>
                <input
                  type="date"
                  required
                  value={selectedDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.amenities.selectSlot}
                </label>
                <select
                  value={selectedSlotTime}
                  onChange={(e) => setSelectedSlotTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
                >
                  <option value="06:00">06:00 AM - Available</option>
                  <option value="08:00">08:00 AM - Available</option>
                  <option value="10:00">10:00 AM - Available</option>
                  <option value="12:00">12:00 PM - Available</option>
                  <option value="14:00">02:00 PM - Available</option>
                  <option value="16:00">04:00 PM - Available</option>
                  <option value="18:00">06:00 PM - Available</option>
                  <option value="20:00">08:00 PM - Available</option>
                </select>
              </div>
            </div>

            {/* Slots and Headcount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Slot Count ({amenity?.slot_minutes}m each)
                </label>
                <input
                  type="number"
                  min={amenity?.min_slots || 1}
                  max={amenity?.max_slots || 4}
                  value={slotCount}
                  onChange={(e) => setSlotCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.amenities.peopleCount}
                </label>
                <input
                  type="number"
                  min={1}
                  max={amenity?.capacity_total || 100}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t.amenities.guestsCount}
                </label>
                <input
                  type="number"
                  min={0}
                  max={amenity?.max_guests || 20}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.amenities.purpose} *
              </label>
              <input
                type="text"
                required
                placeholder={t.amenities.purposePlaceholder}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm min-h-[44px]"
              />
            </div>

            {/* Fee Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Booking Fee ({slotCount} slot(s)):</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {calculatedFee > 0 ? formatPaise(calculatedFee) : 'Free'}
                </span>
              </div>
              {amenity?.deposit_paise > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Refundable Security Deposit:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatPaise(amenity.deposit_paise)}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white">
                <span>Total Payable at Office:</span>
                <span className="text-teal-600">
                  {formatPaise(calculatedFee + (amenity?.deposit_paise || 0))}
                </span>
              </div>
            </div>

            {/* Rules Acknowledgement */}
            {amenity?.rules && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {t.amenities.rules}:
                </span>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-slate-600 dark:text-slate-400 whitespace-pre-line border border-slate-100 dark:border-slate-800">
                  {amenity.rules}
                </div>
              </div>
            )}

            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1 min-h-[44px]">
              <input
                type="checkbox"
                required
                checked={acceptedRules}
                onChange={(e) => setAcceptedRules(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>
                I agree to abide by all society amenity rules and guidelines, and understand fees and cancellation conditions.
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm min-h-[44px] transition-all shadow-md shadow-teal-500/10"
            >
              {submitting ? 'Reserving Slot...' : t.amenities.confirmBooking}
            </button>
          </form>
        )}
      </div>
    </ShellLayout>
  );
}

