import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { FileEdit, Search, CheckCircle, ArrowRight, Clock, Shield, Bell } from 'lucide-react';
import { escalationContent } from '@/content/escalation';

export const metadata: Metadata = {
  title: 'How It Works — Automated Escalation & SLA Governance',
  description:
    'Learn how GrievEase resolves society complaints in 3 simple steps with automatic 4-level escalation: L1 Secretary 48h, L2 Committee 72h, L3 Chairman 96h, L4 Governing Body 120h.',
  alternates: {
    canonical: '/how-it-works',
  },
};

export default function HowItWorksPage() {
  return (
    <div className="section-fluid bg-white">
      <div className="container-fluid">
        {/* Header */}
        <div className="text-center max-w-[840px] mx-auto mb-16">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            THE PROCESS
          </span>
          <h1 className="fluid-h1 font-extrabold text-[#1A1A2E] leading-tight mb-4">
            How GrievEase Delivers Guaranteed Resolution
          </h1>
          <p className="fluid-lead text-[#4A5568] leading-relaxed">
            Every grievance has an owner, an immutable countdown deadline, and a hash-chained audit trail. Here is how
            complaints move seamlessly from filing to completion.
          </p>
        </div>

        {/* 3 Step Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-2xs hover:shadow-sm transition-shadow relative">
            <div className="w-13 h-13 rounded-2xl bg-[#00B894] text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-xs">
              1
            </div>
            <h3 className="fluid-card-title font-bold text-[#1A1A2E] mb-3">File in 30 Seconds</h3>
            <p className="fluid-body text-[#4A5568] leading-relaxed mb-6">
              Open the resident app, snap a photo or record a voice note, select the category, and
              optionally toggle anonymous filing. Your SLA countdown timer begins immediately upon submission.
            </p>
            <div className="text-sm font-semibold text-[#00846A] flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5" />
              <span>Instant in-app notification &amp; ticket ID dispatch</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-2xs hover:shadow-sm transition-shadow relative">
            <div className="w-13 h-13 rounded-2xl bg-[#3B82F6] text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-xs">
              2
            </div>
            <h3 className="fluid-card-title font-bold text-[#1A1A2E] mb-3">Automated Assignment &amp; Tracking</h3>
            <p className="fluid-body text-[#4A5568] leading-relaxed mb-6">
              The Secretary (L1) receives the ticket with pre-filled category guidelines and dispatches
              the verified technician or contractor. You can watch live milestones right on your phone.
            </p>
            <div className="text-sm font-semibold text-[#2563EB] flex items-center gap-2">
              <Clock className="w-4.5 h-4.5" />
              <span>Active countdown against 48h SLA</span>
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-3xl p-8 sm:p-10 border border-[#E2E8F0] shadow-2xs hover:shadow-sm transition-shadow relative">
            <div className="w-13 h-13 rounded-2xl bg-[#10B981] text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-xs">
              3
            </div>
            <h3 className="fluid-card-title font-bold text-[#1A1A2E] mb-3">Resolution &amp; Resident Signoff</h3>
            <p className="fluid-body text-[#4A5568] leading-relaxed mb-6">
              Once the repair is completed, the technician uploads proof-of-work photos. The resident
              provides a 1-5 star rating and signs off digitally before the case can be permanently closed.
            </p>
            <div className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5" />
              <span>Permanent audit ledger entry</span>
            </div>
          </div>
        </div>

        {/* Detailed 4-Level Escalation Section */}
        <div className="bg-[#1A1A2E] text-white rounded-3xl p-8 sm:p-14 mb-20 relative overflow-hidden shadow-xl">
          <div className="max-w-[800px] mb-12">
            <span className="text-xs sm:text-sm font-bold tracking-[2px] uppercase text-[#00B894] mb-2 block">
              THE SAFETY NET
            </span>
            <h2 className="fluid-h2 font-extrabold mb-4">
              What Happens If a Deadline Is Missed?
            </h2>
            <p className="fluid-lead text-white/80 leading-relaxed">
              If any resolver misses their SLA threshold, GrievEase escalates the ticket automatically.
              Residents never have to chase, beg, or argue in society messaging groups.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {escalationContent.levels.map((lvl) => (
              <div
                key={lvl.level}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg mb-3"
                  style={{
                    backgroundColor: `${lvl.accentColor}25`,
                    color: lvl.accentColor,
                  }}
                >
                  {lvl.level}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{lvl.title}</h3>
                <div className="text-xs font-bold text-[#00B894] mb-3">{lvl.sla}</div>
                <p className="text-xs sm:text-sm text-white/70 leading-relaxed">{lvl.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center py-6">
          <h3 className="fluid-h2 font-bold text-[#1A1A2E] mb-6">
            Bring Accountability to Your Gated Community
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/join"
              className="h-[56px] px-8 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-base font-bold shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center"
            >
              Get Started for Free
            </Link>
            <Link
              href="/contact?type=demo"
              className="h-[56px] px-8 rounded-full bg-white border-2 border-[#E2E8F0] text-[#1A1A2E] text-base font-bold hover:border-[#00B894] transition-colors flex items-center justify-center"
            >
              Schedule a Live Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
