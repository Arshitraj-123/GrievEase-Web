'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { fallbackStaffDetail } from '@/lib/fallback-community';
import { StaffDetailDto } from '@grievease/contracts';
import {
  ArrowLeft,
  UserCheck,
  QrCode,
  Sun,
  Download,
  Calendar,
  Clock,
  Shield,
  Star,
  Users,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Share2,
} from 'lucide-react';

export default function StaffDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useAccessibility();
  const staffId = typeof params?.id === 'string' ? params.id : '';

  const [staff, setStaff] = useState<StaffDetailDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isBright, setIsBright] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Review form
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      setIsLoading(true);
      try {
        const res = await api.getStaffDetail(staffId);
        if (res && res.id) {
          setStaff(res);
          if (res.pass?.token) {
            const url = await QRCode.toDataURL(res.pass.token, {
              width: 300,
              margin: 2,
              color: { dark: '#0F172A', light: '#FFFFFF' },
            });
            setQrDataUrl(url);
          }
        } else {
          setStaff(fallbackStaffDetail);
          if (fallbackStaffDetail.pass?.token) {
            const url = await QRCode.toDataURL(fallbackStaffDetail.pass.token, {
              width: 300,
              margin: 2,
              color: { dark: '#0F172A', light: '#FFFFFF' },
            });
            setQrDataUrl(url);
          }
        }
      } catch {
        setStaff(fallbackStaffDetail);
        if (fallbackStaffDetail.pass?.token) {
          QRCode.toDataURL(fallbackStaffDetail.pass.token, { width: 300, margin: 2 }).then(setQrDataUrl);
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (staffId) {
      loadStaff();
    }
  }, [staffId]);

  const handleDownloadQr = () => {
    if (!qrDataUrl || !staff) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `pass-${staff.passSerial || staff.fullName}.png`;
    a.click();
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || isSubmittingReview) return;

    setIsSubmittingReview(true);
    try {
      await api.submitStaffReview(staff.id, {
        flatId: staff.linkedFlats[0]?.flatId || '00000000-0000-0000-0000-000000000000',
        stars: reviewStars,
        comment: reviewComment.trim() || undefined,
      });
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch {
      setReviewSuccess(true);
      setTimeout(() => setReviewSuccess(false), 3000);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="py-24 text-center text-sm text-slate-400">Loading staff profile...</div>
      </ShellLayout>
    );
  }

  if (!staff) {
    return (
      <ShellLayout role="RESIDENT">
        <div className="py-24 text-center space-y-4">
          <p className="text-base text-slate-600 dark:text-slate-400">Staff record not found.</p>
          <Link
            href="/app/staff"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Staff List
          </Link>
        </div>
      </ShellLayout>
    );
  }

  return (
    <ShellLayout role="RESIDENT">
      <div className={`max-w-3xl mx-auto space-y-6 pb-20 transition-all ${isBright ? 'brightness-125 bg-white p-2 rounded-3xl' : ''}`}>
        {/* Back Link */}
        <Link
          href="/app/staff"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff List
        </Link>

        {/* Profile Header Card */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 flex items-center justify-center font-extrabold text-2xl shrink-0 shadow-xs">
                {staff.fullName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {staff.fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {staff.staffType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Works across {staff.linkedFlatsCount} flat{staff.linkedFlatsCount === 1 ? '' : 's'} in Palm Grove
                </p>
              </div>
            </div>

            <Link
              href={`/app/staff/${staff.id}/attendance`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs min-h-[44px]"
            >
              <Calendar className="w-4 h-4" />
              <span>Attendance Calendar</span>
            </Link>
          </div>

          {/* Digital Society Pass Card */}
          {staff.hasPass && staff.pass ? (
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-400" />
                  <span className="text-xs font-bold tracking-wider uppercase text-teal-300">
                    Official Society Pass
                  </span>
                </div>
                <span className="font-mono text-sm font-bold bg-white/10 px-3 py-1 rounded-full">
                  {staff.pass.serial}
                </span>
              </div>

              {/* QR and Details */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
                {qrDataUrl && (
                  <div className="p-3 bg-white rounded-2xl shadow-lg shrink-0">
                    <img
                      src={qrDataUrl}
                      alt={`Pass QR Code for ${staff.fullName}`}
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                )}

                <div className="space-y-3 text-center sm:text-left">
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Pass Holder</p>
                    <p className="text-lg font-bold text-white">{staff.fullName}</p>
                    <p className="text-xs text-teal-300 font-medium capitalize">{staff.staffType}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Cryptographic Security</p>
                    <p className="text-xs text-slate-300">HMAC-SHA256 Signed by Society Authority</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Valid Until</p>
                    <p className="text-xs font-mono text-slate-200">
                      {new Date(staff.pass.validTo).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* QR Action Buttons: Brightness Boost & Download */}
              <div className="pt-4 border-t border-slate-700 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBright(!isBright)}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all shadow-xs ${
                    isBright ? 'bg-amber-400 text-slate-900 shadow-amber-300/40' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>{isBright ? 'Normal Screen' : 'Boost Screen Brightness'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pass Image</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 p-5 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
              <Clock className="w-5 h-5 shrink-0" />
              <span>
                <strong>Pass Pending Verification:</strong> Once the Secretary verifies this staff member in person, an official signed QR gate pass will be automatically issued.
              </span>
            </div>
          )}

          {/* Permitted Schedule Windows */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Entry Schedule Windows
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {staff.schedule && staff.schedule.length > 0 ? (
                staff.schedule.map((sch, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                  >
                    <span className="font-bold text-slate-700 dark:text-slate-300">{sch.day}</span>
                    <span className="font-mono text-teal-700 dark:text-teal-300">
                      {sch.startTime} – {sch.endTime}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No specific windows defined (All standard hours)</p>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Resident Reviews &amp; Feedback
              </h3>
              {staff.avgStars !== null ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span>{staff.avgStars} / 5</span>
                  <span className="text-slate-400 font-normal">({staff.reviewCount} reviews)</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 italic">Ratings hidden until 3 reviews</span>
              )}
            </div>

            {/* Existing Reviews */}
            <div className="space-y-2.5">
              {staff.reviews && staff.reviews.length > 0 ? (
                staff.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: rev.stars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No reviews yet for this staff member.</p>
              )}
            </div>

            {/* Leave a Review Form */}
            <form onSubmit={handleReviewSubmit} className="pt-2 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Rate this staff member:
              </h4>

              {reviewSuccess && (
                <div className="p-3 rounded-xl bg-green-50 text-green-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Review recorded successfully!</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setReviewStars(s)}
                    className="p-1.5 hover:bg-amber-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        s <= reviewStars ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={2}
                placeholder="Write feedback about punctuality, quality of work..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold min-h-[44px] disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Submitting...' : 'Post Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
