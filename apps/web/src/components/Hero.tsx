'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Play,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileEdit,
  Bell,
  Users,
  Search,
  ShieldCheck,
  Lock,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { heroContent } from '@/content/hero';
import { DemoVideoModal } from '@/components/DemoVideoModal';

export function Hero() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [phoneToast, setPhoneToast] = useState<string | null>(null);

  const triggerPhoneAction = (msg: string) => {
    setPhoneToast(msg);
    setTimeout(() => {
      setPhoneToast(null);
    }, 2600);
  };

  return (
    <>
      <section
        id="hero"
        aria-labelledby="hero-headline"
        className="relative bg-white pt-6 md:pt-10 pb-12 md:pb-16 px-6 lg:px-12 overflow-hidden flex items-center min-h-[calc(100vh-76px)]"
      >
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(0,184,148,0.14)_0%,transparent_70%)] pointer-events-none -z-10" />

        <div className="container-fluid grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT COLUMN: Headline, Description, CTAs, Highlights */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col items-start z-10">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00B894]/10 border border-[#00B894]/30 rounded-full mb-4">
              <span className="text-[#00B894] text-[14px]">🏠</span>
              <span className="text-[13px] font-semibold text-[#00846A]">
                {heroContent.badge}
              </span>
            </div>

            {/* Headline with fluid typography token */}
            <h1
              id="hero-headline"
              className="text-[clamp(2.75rem,1.2rem+4.6vw,5.5rem)] font-extrabold tracking-tight leading-[1.08] text-[#1A1A2E] mb-4"
            >
              <span>{heroContent.headline.line1}</span>
              <br />
              <span className="text-[#00B894] inline-block">{heroContent.headline.accent}</span>
            </h1>

            {/* Description with fluid lead typography */}
            <p className="text-[clamp(1.2rem,1.1rem+0.4vw,1.35rem)] text-[#4A5568] leading-[1.6] max-w-[620px] mb-6 font-normal">
              {heroContent.description}
            </p>

            {/* CTAs Row: 3 prominent 56px action buttons */}
            <div className="flex flex-wrap items-center gap-3.5 mb-6 w-full">
              {/* Primary CTA */}
              <Link
                href={heroContent.ctaPrimary.href}
                data-testid="hero-primary-cta"
                className="btn-fluid-primary bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white shadow-[0_8px_25px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,184,148,0.45)] group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
              >
                <span>{heroContent.ctaPrimary.label}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>

              {/* Secondary CTA: Demo Modal */}
              <button
                type="button"
                data-testid="hero-demo-btn"
                onClick={() => setDemoModalOpen(true)}
                className="btn-fluid-secondary bg-white border border-[#E2E8F0] text-[#1A1A2E] hover:border-[#00B894] hover:bg-[#F0FAF7]/70 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
                aria-haspopup="dialog"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white shadow-xs">
                  <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                </div>
                <span>{heroContent.ctaSecondary.label}</span>
              </button>

              {/* Visible Third Button: Track a complaint */}
              <Link
                href={heroContent.ctaTrack.href}
                data-testid="hero-track-cta"
                className="btn-fluid-secondary bg-teal-50/80 border border-teal-200 text-[#00846A] hover:bg-teal-100 hover:border-teal-300 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
              >
                <Search className="w-4 h-4 text-[#00B894]" />
                <span>{heroContent.ctaTrack.label}</span>
              </Link>
            </div>

            {/* Compact Highlights Row directly beneath CTAs (4 items) */}
            <div className="w-full pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#4A5568]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00B894] shrink-0" />
                <span className="font-medium text-[12px] sm:text-[13px] leading-tight">100% In-App Alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#00B894] shrink-0" />
                <span className="font-medium text-[12px] sm:text-[13px] leading-tight">4-Level Auto-SLA</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#00B894] shrink-0" />
                <span className="font-medium text-[12px] sm:text-[13px] leading-tight">Immutable Audit Log</span>
              </div>
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#00B894] shrink-0" />
                <span className="font-medium text-[12px] sm:text-[13px] leading-tight">Cash Dues with Receipts</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Resident Mobile App Mockup (~1.15x scale) + 2 Floating Sample UI Cards */}
          <div className="lg:col-span-5 xl:col-span-5 relative flex justify-center items-center mt-4 lg:mt-0">
            {/* SINGLE Handwritten Annotation (Hidden below 1280px, strictly non-overlapping) */}
            <div
              className="hidden xl:flex absolute -top-12 -left-8 z-30 flex-col items-start pointer-events-none select-none"
              aria-hidden="true"
            >
              <div className="font-caveat text-[24px] text-[#00846A] font-semibold leading-tight -rotate-6">
                {heroContent.annotation.line1} <br />
                {heroContent.annotation.line2}
              </div>
              <svg
                className="w-10 h-8 text-[#00B894] mt-0.5 ml-6 rotate-12"
                viewBox="0 0 50 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M10 5 C20 18, 30 20, 38 32 M38 32 L30 30 M38 32 L34 24" />
              </svg>
            </div>

            {/* Sample UI Card 1: Active SLA Timer Running (Sample UI) */}
            <div className="hidden sm:flex absolute -top-5 -right-4 lg:-right-8 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 max-w-[215px] select-none flex-col gap-1">
              {/* Sample UI representation */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                  {heroContent.floatingCards.slaRunning.tag}
                </span>
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              </div>
              <div className="text-[11.5px] font-bold text-slate-900 leading-snug">
                {heroContent.floatingCards.slaRunning.title}
              </div>
              <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                <span className="truncate">{heroContent.floatingCards.slaRunning.timeRemaining}</span>
              </div>
            </div>

            {/* Sample UI Card 2: Auto-Escalated to Committee (Sample UI) */}
            <div className="hidden sm:flex absolute -bottom-5 -left-4 lg:-left-8 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-3 max-w-[215px] select-none flex-col gap-1">
              {/* Sample UI representation */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  {heroContent.floatingCards.escalated.tag}
                </span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              </div>
              <div className="text-[11.5px] font-bold text-slate-900 leading-snug">
                {heroContent.floatingCards.escalated.title}
              </div>
              <div className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="truncate">{heroContent.floatingCards.escalated.timeRemaining}</span>
              </div>
            </div>

            {/* RESIDENT PHONE MOCKUP (Scaled ~1.15x: 340px base width) */}
            <div className="relative w-[340px] sm:w-[365px] bg-[#1A1A2E] rounded-[48px] p-[11px] shadow-[0_28px_80px_rgba(0,0,0,0.24),0_12px_28px_rgba(0,0,0,0.12)] border-[3px] border-[#2E3440] z-20 animate-float">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#0F172A] rounded-full z-40 flex items-center justify-between px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E]/80" />
              </div>

              {/* Inner Screen */}
              <div className="w-full bg-[#F0FAF7] rounded-[40px] overflow-hidden flex flex-col text-left select-none relative pb-1">
                {/* Status Bar */}
                <div className="bg-white pt-3 px-4 pb-2 flex justify-between items-center text-[10px] text-[#718096] border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white">
                      <Building2 className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-bold text-[11px] text-[#1A1A2E]">GrievEase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerPhoneAction('Notifications checked')}
                      className="relative text-[#718096] hover:text-[#00B894]"
                      aria-label="View notifications"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
                    </button>
                    <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white flex items-center justify-center font-bold text-[9px]">
                      AP
                    </div>
                  </div>
                </div>

                {/* Resident Greeting Area */}
                <div className="bg-white px-4 py-3 border-b border-[#F1F5F9]">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Sample Resident Mockup Data: Resident Home Screen */}
                      <div className="text-[13px] font-bold text-[#1A1A2E] leading-tight">
                        {heroContent.residentMockup.residentName} 👋
                      </div>
                      <div className="text-[10px] text-[#718096] mt-0.5">
                        {heroContent.residentMockup.unit} • {heroContent.residentMockup.societyName}
                      </div>
                    </div>
                    <Link
                      href="/track"
                      className="text-[10px] font-semibold text-[#00846A] hover:underline"
                    >
                      My Cases →
                    </Link>
                  </div>
                </div>

                {/* Grievance Count Chips */}
                <div className="bg-white px-3 pb-3 pt-2 grid grid-cols-4 gap-1.5">
                  <div
                    onClick={() => triggerPhoneAction('Filtered to 2 Open complaints')}
                    className="cursor-pointer bg-[#F8FAFC] hover:bg-blue-50 border border-[#E2E8F0] rounded-lg py-1.5 px-1 text-center transition-all"
                  >
                    <div className="text-[15px] font-extrabold text-[#3B82F6] leading-none">
                      {heroContent.residentMockup.counts.open}
                    </div>
                    <div className="text-[8.5px] font-medium text-[#718096] mt-1">Open</div>
                  </div>

                  <div
                    onClick={() => triggerPhoneAction('Filtered to 1 In Progress complaint')}
                    className="cursor-pointer bg-[#F8FAFC] hover:bg-amber-50 border border-[#E2E8F0] rounded-lg py-1.5 px-1 text-center transition-all"
                  >
                    <div className="text-[15px] font-extrabold text-[#F59E0B] leading-none">
                      {heroContent.residentMockup.counts.inProgress}
                    </div>
                    <div className="text-[8.5px] font-medium text-[#718096] mt-1">Progress</div>
                  </div>

                  <div
                    onClick={() => triggerPhoneAction('0 Escalated complaints right now')}
                    className="cursor-pointer bg-[#F8FAFC] hover:bg-gray-100 border border-[#E2E8F0] rounded-lg py-1.5 px-1 text-center transition-all"
                  >
                    <div className="text-[15px] font-extrabold text-[#718096] leading-none">
                      {heroContent.residentMockup.counts.escalated}
                    </div>
                    <div className="text-[8.5px] font-medium text-[#718096] mt-1">Escalated</div>
                  </div>

                  <div
                    onClick={() => triggerPhoneAction('Viewing 5 Resolved complaints')}
                    className="cursor-pointer bg-[#F8FAFC] hover:bg-emerald-50 border border-[#E2E8F0] rounded-lg py-1.5 px-1 text-center transition-all"
                  >
                    <div className="text-[15px] font-extrabold text-[#00846A] leading-none">
                      {heroContent.residentMockup.counts.resolved}
                    </div>
                    <div className="text-[8.5px] font-medium text-[#718096] mt-1">Resolved</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="px-3.5 pt-2.5 pb-1">
                  <div className="text-[9px] font-bold text-[#718096] tracking-wider uppercase mb-2">
                    Quick Actions
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href="/join"
                      className="bg-[#00B894]/10 hover:bg-[#00B894]/20 border border-[#00B894]/25 rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all"
                    >
                      <div className="w-5 h-5 rounded-full bg-[#00B894] text-white flex items-center justify-center text-[11px] font-bold">
                        +
                      </div>
                      <span className="text-[8.5px] font-bold text-[#00846A]">File Issue</span>
                    </Link>

                    <Link
                      href="/track"
                      className="bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/25 rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all"
                    >
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-[8.5px] font-bold text-[#2563EB]">Track SLA</span>
                    </Link>

                    <Link
                      href="/contact#emergency"
                      className="bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/25 rounded-xl py-2 px-1 flex flex-col items-center gap-1 transition-all"
                    >
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      <span className="text-[8.5px] font-bold text-[#DC2626]">Gate SOS</span>
                    </Link>
                  </div>
                </div>

                {/* Recent Complaints */}
                <div className="px-3.5 py-2.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] font-bold text-[#1A1A2E]">Recent Grievances</span>
                    <Link href="/track" className="text-[9px] font-semibold text-[#00846A]">
                      View all →
                    </Link>
                  </div>

                  <div className="space-y-1.5">
                    {heroContent.residentMockup.recentComplaints.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => triggerPhoneAction(`Tracking: ${item.title}`)}
                        className="cursor-pointer bg-white rounded-lg p-2 border border-[#E2E8F0]/80 flex items-center justify-between shadow-2xs hover:border-[#00B894]/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className={`w-2 h-2 rounded-full ${item.dotColor} shrink-0`} />
                          <div className="truncate text-[9.5px] font-semibold text-[#1A1A2E]">
                            {item.title}
                          </div>
                        </div>
                        <span
                          className={`text-[8px] font-semibold px-1.5 py-0.5 rounded border ${item.statusColor}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Feedback Banner */}
                {phoneToast && (
                  <div className="absolute top-12 left-3 right-3 bg-[#1A1A2E] text-white text-[9px] px-2.5 py-1.5 rounded-lg shadow-lg z-30 flex items-center gap-1.5 animate-fade-in">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B894]" />
                    <span>{phoneToast}</span>
                  </div>
                )}

                {/* Bottom App Navigation Bar */}
                <div className="bg-white border-t border-[#E2E8F0] py-2 px-3 flex justify-around items-center">
                  <div className="flex flex-col items-center gap-0.5 text-[8px] text-[#00846A] font-bold">
                    <Building2 className="w-3.5 h-3.5 text-[#00846A]" />
                    <span>Home</span>
                    <span className="w-1 h-1 rounded-full bg-[#00846A]" />
                  </div>
                  <Link
                    href="/join"
                    className="flex flex-col items-center gap-0.5 text-[8px] text-[#718096] hover:text-[#00846A]"
                  >
                    <FileEdit className="w-3.5 h-3.5" />
                    <span>File</span>
                  </Link>
                  <Link
                    href="/track"
                    className="flex flex-col items-center gap-0.5 text-[8px] text-[#718096] hover:text-[#00846A]"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </Link>
                  <Link
                    href="/features#visitors"
                    className="flex flex-col items-center gap-0.5 text-[8px] text-[#718096] hover:text-[#00846A]"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Gate</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Modal */}
      <DemoVideoModal isOpen={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
    </>
  );
}
