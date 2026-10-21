'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, ArrowRight, ShieldCheck, Users } from 'lucide-react';

export default function JoinPage() {
  const [formData, setFormData] = useState({
    societyName: '',
    city: '',
    units: '',
    contactName: '',
    phone: '',
    email: '',
    role: 'Secretary',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.societyName.trim()) errs.societyName = 'Society name is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.units.trim() || Number(formData.units) < 1)
      errs.units = 'Please enter a valid number of flats';
    if (!formData.contactName.trim()) errs.contactName = 'Your name is required';
    if (!/^[0-9+ -]{10,14}$/.test(formData.phone.trim()))
      errs.phone = 'Valid 10-digit phone is required';
    if (!formData.email.includes('@')) errs.email = 'Valid email is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white flex items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="max-w-2xl w-full">
        <div className="text-center max-w-[600px] mx-auto mb-10">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
            GET STARTED FREE
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] leading-tight mb-3">
            Onboard Your Society to GrievEase
          </h1>
          <p className="text-sm text-[#4A5568]">
            Set up your residential portal in under 5 minutes. Invite residents, configure L1–L4
            escalation chains, and eliminate chaotic WhatsApp complaints.
          </p>
        </div>

        {submitted ? (
          <div className="bg-[#F0FAF7] rounded-3xl p-8 sm:p-12 border border-[#B0EBDC]/80 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#00846A] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E] mb-2">
              Registration Received for {formData.societyName}!
            </h2>
            <p className="text-sm text-[#4A5568] max-w-md mx-auto leading-relaxed mb-6">
              Our onboarding team is configuring your portal for {formData.units} flats in{' '}
              {formData.city}. We have dispatched an invitation kit to <strong>{formData.email}</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/transparency"
                className="px-6 py-2.5 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-bold transition-colors"
              >
                Inspect Live Transparency
              </Link>
              <Link
                href="/"
                className="px-6 py-2.5 rounded-full bg-white border border-[#CBD5E1] text-xs font-semibold text-[#1A1A2E]"
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-sm space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                  Housing Society Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Green Valley Residency"
                  value={formData.societyName}
                  onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.societyName ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.societyName && (
                  <p className="text-xs text-red-500 mt-1">{errors.societyName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">City &amp; State *</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.city ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                  Total Residential Units / Flats *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 240"
                  value={formData.units}
                  onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.units ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.units && <p className="text-xs text-red-500 mt-1">{errors.units}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Your Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
                >
                  <option value="Secretary">Secretary (L1)</option>
                  <option value="Chairman">Chairman / President (L3)</option>
                  <option value="Committee">Managing Committee Member (L2)</option>
                  <option value="Resident">Resident / Flat Owner</option>
                  <option value="Builder">Builder / Facility Manager</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Your Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sanjay Kumar"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.contactName ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.contactName && (
                  <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.phone ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="admin@society.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                    errors.email ? 'border-red-400' : 'border-[#CBD5E1]'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Activate Society Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-xs text-[#718096]">
              Already registered?{' '}
              <Link href="/login" className="text-[#00846A] font-bold hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
