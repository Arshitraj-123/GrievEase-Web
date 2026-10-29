'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShellLayout } from '@/components/ShellLayout';
import { api } from '@/lib/api-client';
import { useAccessibility } from '@/components/AccessibilityProvider';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from '@grievease/ui';
import {
  UserCheck,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Users,
  Car,
  User,
  Phone,
} from 'lucide-react';

export default function CreateVisitorPassPage() {
  const router = useRouter();
  const { t } = useAccessibility();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    visitorName: '',
    visitorPhone: '',
    purpose: '',
    guestsCount: 1,
    vehicleNo: '',
    type: 'ONE_TIME' as 'ONE_TIME' | 'RECURRING' | 'GROUP' | 'VEHICLE_ONLY',
    validFrom: new Date().toISOString().slice(0, 16),
    validTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    maxEntries: 1,
  });

  const handleNext = () => {
    if (step === 1) {
      if (!formData.visitorName.trim()) {
        setError('Please enter visitor name');
        return;
      }
      if (!formData.purpose.trim()) {
        setError('Please enter purpose of visit');
        return;
      }
    }
    setError(null);
    setStep((prev) => (prev < 3 ? ((prev + 1) as any) : prev));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as any) : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        visitorName: formData.visitorName.trim(),
        visitorPhone: formData.visitorPhone ? formData.visitorPhone.trim() : undefined,
        purpose: formData.purpose.trim(),
        guestsCount: Number(formData.guestsCount) || 1,
        vehicleNo: formData.vehicleNo ? formData.vehicleNo.trim().toUpperCase() : undefined,
        type: formData.type,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
        maxEntries: formData.type === 'ONE_TIME' ? 1 : formData.maxEntries,
      };

      const res = await api.createVisitorPass(payload);
      if (res?.id) {
        router.push(`/app/visitors/${res.id}/pass`);
      } else {
        router.push('/app/visitors');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate visitor pass');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ShellLayout role="RESIDENT">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Link */}
        <a
          href="/app/visitors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Visitors</span>
        </a>

        {/* Stepper Header */}
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {t.visitors?.createPass || 'Create Visitor Pass'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Step {step} of 3 • Digital signed QR and instant 6-digit gate passcode
          </p>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className={`h-2 rounded-full ${
              step >= 1 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-2 rounded-full ${
              step >= 2 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
          <div
            className={`h-2 rounded-full ${
              step >= 3 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'
            }`}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 text-xs rounded-xl border border-red-200 dark:border-red-900 font-medium">
            {error}
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-5">
            {/* STEP 1: WHO */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.visitors?.visitorName || 'Visitor Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.visitorName}
                      onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                      placeholder="e.g. Anand Kumar"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.visitors?.visitorPhone || 'Mobile Number (Encrypted)'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      value={formData.visitorPhone}
                      onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                      placeholder="e.g. +91 98200 12345"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {t.visitors?.purpose || 'Purpose of Visit'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="e.g. Family Visit, Electrician, Social Gathering"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.visitors?.guestsCount || 'Guests Count'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={formData.guestsCount}
                      onChange={(e) => setFormData({ ...formData, guestsCount: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.visitors?.vehicleNo || 'Vehicle Plate (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleNo}
                      onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value.toUpperCase() })}
                      placeholder="e.g. MH 02 AB 1234"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: PASS TYPE */}
            {step === 2 && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Pass Type
                </label>

                {[
                  {
                    type: 'ONE_TIME',
                    label: t.visitors?.passTypeOneTime || 'One-Time Guest Pass',
                    desc: 'Dies automatically after single entry. Ideal for single visits.',
                  },
                  {
                    type: 'RECURRING',
                    label: t.visitors?.passTypeRecurring || 'Frequent / Recurring Pass',
                    desc: 'Valid across multiple days within specified time windows (e.g. tutors, therapists).',
                  },
                  {
                    type: 'GROUP',
                    label: t.visitors?.passTypeGroup || 'Group / Party Pass',
                    desc: 'Shared pass code for multiple guests attending the same gathering.',
                  },
                  {
                    type: 'VEHICLE_ONLY',
                    label: t.visitors?.passTypeVehicle || 'Vehicle Only Pass',
                    desc: 'Pre-registered parking clearance for drop-offs or car services.',
                  },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: item.type as any })}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 min-h-[56px] ${
                      formData.type === item.type
                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${
                        formData.type === item.type
                          ? 'border-teal-600 bg-teal-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {formData.type === item.type && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* STEP 3: SCHEDULE & CONFIRM */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.visitors?.validFrom || 'Valid From'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validFrom}
                      onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.visitors?.validTo || 'Valid Till'}
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.validTo}
                      onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">Pass Preview Summary</div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Visitor:</span>
                    <strong className="text-slate-900 dark:text-white">{formData.visitorName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Type:</span>
                    <strong className="text-teal-600">{formData.type}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Guests:</span>
                    <span>{formData.guestsCount}</span>
                  </div>
                  {formData.vehicleNo && (
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>Vehicle:</span>
                      <span className="font-mono">{formData.vehicleNo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="min-h-[44px] px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[44px] px-5 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Generating...' : 'Issue Gate Pass'}</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ShellLayout>
  );
}
