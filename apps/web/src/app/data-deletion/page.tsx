'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function DataDeletionPage() {
  const [email, setEmail] = useState('');
  const [society, setSociety] = useState('');
  const [unit, setUnit] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !society) return;
    setSubmitting(true);
    try {
      await api.submitPublicPrivacyRequest({
        type: 'DELETION',
        requesterName: `${email} (${society})`,
        requesterEmail: email,
        details: `Public erasure request for society: ${society}, unit: ${unit || 'N/A'}. In-person verification required.`,
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[800px] mx-auto">
        <div className="text-center mb-12">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#DC2626] flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] leading-tight mb-3">
            Data Deletion &amp; Right to Be Forgotten
          </h1>
          <p className="text-sm text-[#4A5568]">
            In compliance with the Digital Personal Data Protection Act (DPDP Act) and global privacy
            standards, you have complete control over your personal data on GrievEase.
          </p>
        </div>

        <div className="bg-[#F8FAFC] rounded-3xl p-8 border border-[#E2E8F0] shadow-sm mb-12">
          <h2 className="text-lg font-bold text-[#1A1A2E] mb-3">How Data Deletion Operates</h2>
          <div className="space-y-4 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
            <p>
              When a resident moves out of a society or requests account closure, personal contact
              details (name, phone number, personal email, biometric tokens, guest passes) are permanently
              purged from active databases within 30 days of verification.
            </p>
            <p>
              Historical grievance summaries and compliance records are cryptographically anonymized to
              preserve financial and building structural safety records required by law for housing societies,
              with all linkable personal resident identifiers stripped permanently.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-200 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00846A] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Request Stamped</h3>
            <p className="text-xs text-[#4A5568] leading-relaxed mb-4">
              A verification link has been transmitted to <strong>{email}</strong>. Once you confirm
              ownership, your society admin and GrievEase privacy desk will process data deletion within
              3 business days.
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="text-xs text-[#00846A] font-bold underline"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-[#E2E8F0] shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#1A1A2E] mb-2">Submit Deletion Request</h3>
            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Registered Email Address *</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Housing Society Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Valley Residency"
                  value={society}
                  onChange={(e) => setSociety(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Apartment / Unit (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Flat A-101"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Request Complete Data Purge
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
