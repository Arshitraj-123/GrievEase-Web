'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertTriangle, Clock, Shield } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  society: z.string().min(2, 'Society name is required'),
  role: z.enum([
    'Resident',
    'Secretary',
    'Committee Member',
    'Chairman',
    'Security Guard',
    'Vendor',
    'Other',
  ]),
  phone: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email address'),
  message: z.string().min(5, 'Message must be at least 5 characters'),
  honeypot: z.string().max(0, 'Spam detected'),
});

type FormData = z.infer<typeof formSchema>;

// Self-contained typed Zod resolver for React Hook Form
const customZodResolver: Resolver<FormData> = async (values) => {
  const result = formSchema.safeParse(values);
  if (result.success) {
    return { values: result.data, errors: {} };
  }
  const errors: any = {};
  for (const issue of result.error.issues) {
    const path = (issue.path[0] as string) || 'root';
    if (!errors[path]) {
      errors[path] = { type: issue.code, message: issue.message };
    }
  }
  return { values: {} as FormData, errors };
};

function ContactFormInner() {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('type') === 'demo';

  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: customZodResolver,
    defaultValues: {
      name: '',
      society: '',
      role: 'Resident',
      phone: '',
      email: '',
      message: '',
      honeypot: '',
    },
  });

  useEffect(() => {
    if (isDemo) {
      setValue(
        'message',
        'Hi, I would like to schedule a 15-minute live platform demo for our society managing committee.'
      );
    }
  }, [isDemo, setValue]);

  const onSubmit = async (data: FormData) => {
    setSubmitStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setSubmitStatus('error');
        setErrorMessage(json.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubmitStatus('success');
      reset();
    } catch {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please check your connection and retry.');
    }
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[650px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            GET IN TOUCH
          </span>
          <h1 className="text-[36px] sm:text-[44px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            {isDemo ? 'Request a Society Demo' : 'Contact Us & Society Support'}
          </h1>
          <p className="text-[15.5px] text-[#4A5568]">
            Have a question about onboarding your society, auto-escalation SLAs, or platform
            customization? Fill out the form below or reach our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left: Contact Form */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-sm">
            {submitStatus === 'success' ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-emerald-200">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#00846A] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">Message Dispatched!</h3>
                <p className="text-sm text-[#4A5568] leading-relaxed mb-6">
                  Thank you for reaching out. Your request has been securely logged and forwarded to our
                  society operations desk. We will respond within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="px-6 py-2.5 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Honeypot hidden input */}
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  style={{ display: 'none' }}
                  {...register('honeypot')}
                />

                {submitStatus === 'error' && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-[#DC2626] font-medium flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      {...register('name')}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                        errors.name ? 'border-red-400' : 'border-[#CBD5E1]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                      Society / Apartment Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Green Valley Residency"
                      {...register('society')}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                        errors.society ? 'border-red-400' : 'border-[#CBD5E1]'
                      }`}
                    />
                    {errors.society && (
                      <p className="text-xs text-red-500 mt-1">{errors.society.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                      Your Role in the Society *
                    </label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894]"
                    >
                      <option value="Resident">Resident / Flat Owner</option>
                      <option value="Secretary">Society Secretary (L1)</option>
                      <option value="Committee Member">Managing Committee (L2)</option>
                      <option value="Chairman">Chairman (L3)</option>
                      <option value="Security Guard">Security / Guard Head</option>
                      <option value="Vendor">Maintenance Vendor</option>
                      <option value="Other">Other Community Role</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      {...register('phone')}
                      className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                        errors.phone ? 'border-red-400' : 'border-[#CBD5E1]'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    {...register('email')}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                      errors.email ? 'border-red-400' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1A2E] mb-1.5">
                    Message / Demo Requirements *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your society (number of flats, current grievance issues, or preferred demo timings)..."
                    {...register('message')}
                    className={`w-full px-4 py-2.5 rounded-xl border bg-white text-sm focus:outline-none focus:ring-1 focus:ring-[#00B894] ${
                      errors.message ? 'border-red-400' : 'border-[#CBD5E1]'
                    }`}
                  />
                  {errors.message && (
                    <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitStatus === 'loading'}
                  className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitStatus === 'loading' ? 'Transmitting...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>

          {/* Right: Info & Emergency Contacts (#emergency) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-[#F0FAF7] rounded-3xl p-7 border border-[#B0EBDC]/60">
              <h3 className="text-lg font-bold text-[#1A1A2E] mb-4">Operations &amp; Support</h3>
              <div className="space-y-4 text-sm text-[#4A5568]">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#00846A] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1A1A2E]">Working Hours</div>
                    <div className="text-xs text-[#718096]">Monday – Saturday: 9:00 AM – 7:00 PM IST</div>
                    <div className="text-xs text-[#718096]">Emergency SOS Server: 24/7/365</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#00846A] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1A1A2E]">Response Commitment</div>
                    <div className="text-xs text-[#718096]">General Inquiries: &lt; 24 hours</div>
                    <div className="text-xs text-[#718096]">Society Onboarding: Same-day configuration</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#00846A] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-[#1A1A2E]">Headquarters</div>
                    <div className="text-xs text-[#718096]">Bengaluru, Karnataka, India</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contacts Anchor Section (#emergency) */}
            <div id="emergency" className="scroll-mt-24 bg-red-50 rounded-3xl p-7 border border-red-200">
              <div className="flex items-center gap-2 text-red-600 font-bold mb-3">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base">Emergency Contacts &amp; Helplines</h3>
              </div>
              <p className="text-xs text-[#4A5568] leading-relaxed mb-4">
                For immediate life safety or fire emergencies in India, always dial emergency services
                directly before triggering GrievEase in-app alerts:
              </p>
              <ul className="space-y-2 text-xs font-semibold text-[#1A1A2E]">
                <li className="flex justify-between p-2 bg-white rounded-lg border border-red-100">
                  <span>National Emergency Helpline</span>
                  <span className="text-[#DC2626]">112</span>
                </li>
                <li className="flex justify-between p-2 bg-white rounded-lg border border-red-100">
                  <span>Police</span>
                  <span className="text-[#DC2626]">100</span>
                </li>
                <li className="flex justify-between p-2 bg-white rounded-lg border border-red-100">
                  <span>Fire Brigade</span>
                  <span className="text-[#DC2626]">101</span>
                </li>
                <li className="flex justify-between p-2 bg-white rounded-lg border border-red-100">
                  <span>Ambulance / Medical</span>
                  <span className="text-[#DC2626]">102 / 108</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center">Loading contact portal...</div>}>
      <ContactFormInner />
    </Suspense>
  );
}
