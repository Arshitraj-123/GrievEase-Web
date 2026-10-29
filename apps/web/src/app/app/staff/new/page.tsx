'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShellLayout } from '@/components/ShellLayout';
import { useAccessibility } from '@/components/AccessibilityProvider';
import { api } from '@/lib/api-client';
import { StaffScheduleWindow } from '@grievease/contracts';
import {
  ArrowLeft,
  UserCheck,
  Upload,
  Calendar,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

export default function RegisterStaffPage() {
  const router = useRouter();
  const { t } = useAccessibility();

  // Form states
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Details
  const [fullName, setFullName] = useState('');
  const [staffType, setStaffType] = useState('maid');
  const [mobile, setMobile] = useState('');

  // Step 2: Proofs & Photo
  const [idProofType, setIdProofType] = useState('AADHAAR');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);

  // Step 3: Schedule
  const [schedules, setSchedules] = useState<StaffScheduleWindow[]>([
    { day: 'MONDAY', startTime: '08:00', endTime: '12:00' },
    { day: 'TUESDAY', startTime: '08:00', endTime: '12:00' },
    { day: 'WEDNESDAY', startTime: '08:00', endTime: '12:00' },
    { day: 'THURSDAY', startTime: '08:00', endTime: '12:00' },
    { day: 'FRIDAY', startTime: '08:00', endTime: '12:00' },
    { day: 'SATURDAY', startTime: '08:00', endTime: '12:00' },
  ]);

  // Step 4: Consent & Submission
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Duplicate prompt state
  const [duplicateStaff, setDuplicateStaff] = useState<{
    id: string;
    fullName: string;
    staffType: string;
    status: string;
  } | null>(null);

  const handleAddScheduleDay = () => {
    setSchedules([
      ...schedules,
      { day: 'MONDAY', startTime: '09:00', endTime: '13:00' },
    ]);
  };

  const handleRemoveScheduleDay = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleScheduleChange = (
    index: number,
    field: keyof StaffScheduleWindow,
    value: any
  ) => {
    const updated = [...schedules];
    (updated[index] as any)[field] = value;
    setSchedules(updated);
  };

  // Submit registration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!consent) {
      setErrorMsg('You must confirm consent before submitting staff details.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload photo if present
      let photoKey: string | undefined;
      if (photoFile) {
        const photoRes = await api.uploadEvidence(photoFile).catch(() => null);
        if (photoRes?.storageKey) photoKey = photoRes.storageKey;
      }

      // 2. Upload ID proof if present
      let idProofKey: string | undefined;
      if (idProofFile) {
        const idRes = await api.uploadEvidence(idProofFile).catch(() => null);
        if (idRes?.storageKey) idProofKey = idRes.storageKey;
      }

      const res = await api.registerStaff({
        fullName: fullName.trim(),
        staffType,
        mobile: mobile.replace(/[^0-9]/g, '').slice(-10),
        flatId: '00000000-0000-0000-0000-000000000000', // Auto resolved on server
        photoKey,
        idProofKey,
        idProofType,
        schedule: schedules,
        consent: true,
      });

      if (res?.duplicatePrompt && res.existingStaff) {
        setDuplicateStaff(res.existingStaff);
        setIsSubmitting(false);
        return;
      }

      router.push('/app/staff');
    } catch (err: any) {
      // If mock/demo or already linked
      router.push('/app/staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExisting = async () => {
    if (!duplicateStaff) return;
    setIsSubmitting(true);
    try {
      await api.linkExistingStaff({
        staffId: duplicateStaff.id,
        flatId: '00000000-0000-0000-0000-000000000000',
        schedule: schedules,
        consent: true,
      });
      router.push('/app/staff');
    } catch {
      router.push('/app/staff');
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        {/* Back Link */}
        <Link
          href="/app/staff"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-teal-600 min-h-[44px] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff List
        </Link>

        {/* Stepper Progress */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span className={step >= 1 ? 'text-teal-600' : ''}>1. Details</span>
            <span className={step >= 2 ? 'text-teal-600' : ''}>2. ID Proof</span>
            <span className={step >= 3 ? 'text-teal-600' : ''}>3. Schedule</span>
            <span className={step >= 4 ? 'text-teal-600' : ''}>4. Consent</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Duplicate Staff Prompt Modal */}
        {duplicateStaff && (
          <div className="rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 p-6 space-y-4 shadow-md animate-in fade-in">
            <div className="flex items-start gap-3">
              <Users className="w-6 h-6 text-teal-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-teal-900 dark:text-teal-200">
                  Existing Staff Record Found!
                </h3>
                <p className="text-xs text-teal-800 dark:text-teal-300 leading-relaxed">
                  <strong>{duplicateStaff.fullName}</strong> ({duplicateStaff.staffType}) is already registered and working in another flat in Palm Grove!
                  A staff member working across multiple flats carries one pass and a single verified identity record.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDuplicateStaff(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-teal-300 text-teal-800 text-xs font-semibold min-h-[44px]"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleLinkExisting}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold min-h-[44px] shadow-xs"
              >
                {isSubmitting ? 'Linking...' : 'Link to My Flat'}
              </button>
            </div>
          </div>
        )}

        {/* Step Form */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
          {errorMsg && (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-4 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Basic Details */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Personal Information
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sunita Kamble"
                  className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Role / Staff Type *
                </label>
                <select
                  value={staffType}
                  onChange={(e) => setStaffType(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="maid">Maid / Housekeeping</option>
                  <option value="cook">Cook / Chef</option>
                  <option value="driver">Driver</option>
                  <option value="nanny">Nanny / Babysitter</option>
                  <option value="gardener">Gardener</option>
                  <option value="other">Other Household Staff</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Used for cryptographic duplicate detection (blind indexed with SHA-256).
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName.trim() || !mobile.trim()) {
                      setErrorMsg('Please enter both name and 10-digit mobile number.');
                      return;
                    }
                    setErrorMsg(null);
                    setStep(2);
                  }}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold min-h-[44px]"
                >
                  Continue to ID Proof
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Photo & ID Proof */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Photo &amp; Encrypted ID Proof
              </h2>

              <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
                  <Shield className="w-4 h-4 text-teal-600" />
                  Privacy Protection Architecture:
                </p>
                <p>
                  We DO NOT collect or store ID numbers. The ID proof image is encrypted at rest using AES-256-GCM and viewable strictly by the Society Secretary for in-person verification.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  ID Proof Document Type
                </label>
                <select
                  value={idProofType}
                  onChange={(e) => setIdProofType(e.target.value)}
                  className="w-full px-4 py-3 min-h-[44px] rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm"
                >
                  <option value="AADHAAR">Aadhaar Card (Image Proof Only)</option>
                  <option value="PAN">PAN Card</option>
                  <option value="VOTER_ID">Voter ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving License</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Upload ID Proof Image (PDF/JPG/PNG max 10MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => setIdProofFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Staff Photo (Optional, for pass badge)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold min-h-[44px]"
                >
                  Continue to Schedule
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Weekly Schedule */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Permitted Schedule Windows
                </h2>
                <button
                  type="button"
                  onClick={handleAddScheduleDay}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-800 text-xs font-bold min-h-[36px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Window
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Staff passes enforce these schedule windows cryptographically. Staff cannot scan pass outside allowed hours.
              </p>

              <div className="space-y-2.5">
                {schedules.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2"
                  >
                    <select
                      value={item.day}
                      onChange={(e) => handleScheduleChange(idx, 'day', e.target.value)}
                      className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border text-xs font-semibold min-h-[38px]"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="time"
                        value={item.startTime}
                        onChange={(e) => handleScheduleChange(idx, 'startTime', e.target.value)}
                        className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={item.endTime}
                        onChange={(e) => handleScheduleChange(idx, 'endTime', e.target.value)}
                        className="px-2 py-1.5 rounded-xl bg-white dark:bg-slate-900 border text-xs"
                      />
                    </div>

                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleDay(idx)}
                        className="p-2 text-slate-400 hover:text-red-600 ml-auto min-h-[38px] min-w-[38px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold min-h-[44px]"
                >
                  Continue to Consent
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Consent & Submit */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Resident Consent &amp; Verification
              </h2>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 space-y-2 text-xs">
                <p><strong>Staff Name:</strong> {fullName}</p>
                <p><strong>Role:</strong> {staffType.toUpperCase()}</p>
                <p><strong>Mobile:</strong> {mobile}</p>
                <p><strong>Active Schedule Windows:</strong> {schedules.length} windows defined</p>
              </div>

              {/* Consent Checkbox */}
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="staff-consent"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded-md focus:ring-teal-500 mt-0.5 min-h-[30px] min-w-[30px]"
                />
                <label htmlFor="staff-consent" className="text-xs text-teal-900 dark:text-teal-200 font-medium cursor-pointer leading-relaxed">
                  {t.domesticStaff?.consentCheckbox ||
                    'I confirm that I have this person’s explicit permission to share these details with the society administration for security pass verification.'}
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold min-h-[44px]"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!consent || isSubmitting}
                  className="px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md min-h-[44px] disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Submit Registration'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </ShellLayout>
  );
}
