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
        className="relative bg-white pt-8 md:pt-12 pb-16 md:pb-24 px-6 lg:px-12 overflow-hidden flex items-center min-h-[calc(100vh-72px)]"
      >
        {/* Soft Radial Ambient Lighting */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(0,184,148,0.12)_0%,transparent_70%)] pointer-events-none -z-10" />

        <div className="max-w-[1300px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT COLUMN: Headline, Description, CTAs */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col items-start z-10">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#00B894]/10 border border-[#00B894]/30 rounded-full mb-6">
              <span className="text-[#00B894] text-[14px]">🏠</span>
              <span className="text-[13px] font-semibold text-[#00846A]">
                {heroContent.badge}
              </span>
            </div>

            {/* Headline */}
            <h1
              id="hero-headline"
              className="text-[46px] sm:text-[56px] lg:text-[62px] font-extrabold tracking-tight leading-[1.08] text-[#1A1A2E] mb-5"
            >
              <span>{heroContent.headline.line1}</span>
              <br />
              <span className="text-[#00B894] inline-block">{heroContent.headline.accent}</span>
            </h1>

            {/* Description */}
            <p className="text-[15.5px] md:text-[16.5px] text-[#4A5568] leading-[1.7] max-w-[500px] mb-8 font-normal">
              {heroContent.description}
            </p>

            {/* CTA Buttons Row */}
            <div className="flex flex-wrap items-center gap-4 mb-5">
              <Link
                href={heroContent.ctaPrimary.href}
                className="group px-8 py-3.5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-[15px] font-semibold shadow-[0_8px_25px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,184,148,0.45)] transition-all duration-200 flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
              >
                <span>{heroContent.ctaPrimary.label}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>

              <button
                onClick={() => setDemoModalOpen(true)}
                className="px-6 py-3.5 rounded-full bg-white border border-[#E2E8F0] text-[#1A1A2E] text-[15px] font-semibold hover:border-[#00B894] hover:bg-[#F0FAF7]/60 shadow-xs transition-all duration-200 flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
                aria-haspopup="dialog"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white shadow-xs">
                  <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                </div>
                <span>{heroContent.ctaSecondary.label}</span>
              </button>
            </div>

            {/* Third Text Link: Track a complaint */}
            <div className="mb-8">
              <Link
                href={heroContent.ctaTrack.href}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#00846A] hover:text-[#00B894] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] rounded"
              >
                <Search className="w-4 h-4 text-[#00B894]" />
                <span>{heroContent.ctaTrack.label}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Resident Mobile App Mockup + Single Handwritten Annotation */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex justify-center items-center mt-6 lg:mt-0">
            {/* SINGLE Handwritten Annotation (Hidden below 1024px, positioned clearly to top-left of phone without overlapping) */}
            <div
              className="hidden lg:flex absolute -top-12 -left-4 xl:left-2 z-20 flex-col items-start pointer-events-none select-none"
              aria-hidden="true"
            >
              <div className="font-caveat text-[22px] xl:text-[24px] text-[#00846A] font-semibold leading-tight -rotate-6">
                {heroContent.annotation.line1} <br />
                {heroContent.annotation.line2}
              </div>
              <svg
                className="w-10 h-9 text-[#00B894] mt-1 ml-6 rotate-12"
                viewBox="0 0 50 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M10 5 C20 18, 30 20, 38 32 M38 32 L30 30 M38 32 L34 24" />
              </svg>
            </div>

            {/* RESIDENT PHONE MOCKUP */}
            <div className="relative w-[295px] sm:w-[320px] bg-[#1A1A2E] rounded-[44px] p-[10px] shadow-[0_25px_70px_rgba(0,0,0,0.22),0_10px_25px_rgba(0,0,0,0.12)] border-[3px] border-[#2E3440] z-10 animate-float">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#0F172A] rounded-full z-30 flex items-center justify-between px-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A1A2E]/80" />
              </div>

              {/* Inner Screen */}
              <div className="w-full bg-[#F0FAF7] rounded-[36px] overflow-hidden flex flex-col text-left select-none relative pb-1">
                {/* Status Bar */}
                <div className="bg-white pt-2.5 px-4 pb-2 flex justify-between items-center text-[10px] text-[#718096] border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-md bg-gradient-to-br from-[#00B894] to-[#00D4AA] flex items-center justify-center text-white">
                      <Building2 className="w-2.5 h-2.5" />
                    </div>
                    <span className="font-bold text-[11px] text-[#1A1A2E]">GrievEase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
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
                      {/* Sample Resident Mockup Data: Resident Home Screen (not Admin) */}
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

                {/* Grievance Count Chips (Sample Resident Data: Open 2, In Progress 1, Escalated 0, Resolved 5) */}
                {/* Sample Resident Mockup Data: Clean 4-chip counts */}
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

                {/* Recent Complaints (Clean Sample Resident Data: Leaky faucet, Parking gate, Lift) */}
                {/* Sample Resident Mockup Data: Clean recent complaints list */}
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
