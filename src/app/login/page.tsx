'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Building2, Phone, Lock, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Resident');
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [otp, setOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!/^[0-9+]{10,13}$/.test(cleanPhone)) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg('');
    setStep('otp');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setErrorMsg('Please enter the 4-digit code (Use 1234 for demo).');
      return;
    }
    setErrorMsg('');
    setStep('success');
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white flex items-center justify-center min-h-[calc(100vh-160px)]">
      <div className="max-w-md w-full bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B894] to-[#00D4AA] text-white flex items-center justify-center mx-auto mb-3 shadow-[0_4px_12px_rgba(0,184,148,0.3)]">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Sign In to GrievEase</h1>
          <p className="text-xs text-[#718096] mt-1">
            Access your society portal, file grievances, or manage gate passes
          </p>
        </div>

        {step === 'success' ? (
          <div className="text-center p-6 bg-white rounded-2xl border border-emerald-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#00846A] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-1">Authenticated!</h2>
            <p className="text-xs text-gray-600 mb-6 leading-relaxed">
              Welcome back to your resident portal. In this preview, your credentials have been verified.
            </p>
            <Link
              href="/track"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-[#00B894] text-white text-xs font-bold"
            >
              <span>Go to My Grievances</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : step === 'phone' ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">I am logging in as</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {['Resident', 'Secretary', 'Committee', 'Security Guard'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl border text-center font-medium transition-colors cursor-pointer ${
                      role === r
                        ? 'border-[#00B894] bg-[#F0FAF7] text-[#00846A] font-bold'
                        : 'border-[#E2E8F0] bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">
                Registered Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
                />
                <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errorMsg && <p className="text-xs text-red-500 mt-1">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-xs font-bold shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              Send Secure OTP
            </button>

            <div className="pt-4 text-center border-t border-gray-200 text-xs text-[#718096]">
              New resident or committee?{' '}
              <Link href="/join" className="text-[#00846A] font-bold hover:underline">
                Register society
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-800 text-center">
              OTP sent to <strong>{phone}</strong> (Demo code: <strong>1234</strong>)
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1A2E] mb-1">Enter 4-Digit OTP</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full text-center tracking-[12px] font-mono text-lg py-2.5 rounded-xl border border-[#CBD5E1] bg-white focus:outline-none focus:ring-1 focus:ring-[#00B894]"
              />
              {errorMsg && <p className="text-xs text-red-500 mt-1 text-center">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-[#00B894] text-white text-xs font-bold shadow-xs hover:bg-[#00A383] transition-colors cursor-pointer"
            >
              Verify &amp; Enter Portal
            </button>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800"
            >
              ← Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
