import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Shield, Heart, Users, Target, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About GrievEase — Building Accountable Residential Communities',
  description:
    'GrievEase was built to replace disorganized group chats with automated governance, verifiable deadlines, and complete transparency for residential gated communities across India.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            OUR MISSION
          </span>
          <h1 className="text-[36px] sm:text-[46px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Transforming Housing Societies Into Harmonious Communities
          </h1>
          <p className="text-[16px] text-[#4A5568] leading-relaxed">
            We believe that modern gated communities deserve the same efficiency, transparency, and
            predictability as top-tier technology enterprises.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          <div className="lg:col-span-6 space-y-5 text-[15px] text-[#4A5568] leading-relaxed">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Why We Built GrievEase</h2>
            <p>
              Every resident in India has experienced the frustration of society WhatsApp groups: a
              leaking corridor pipe posted at 8 AM gets buried under hundreds of messages by noon.
              Committee members get blamed unfairly, while volunteer secretaries burn out trying to
              field phone calls after their day jobs.
            </p>
            <p>
              When disputes escalate, there is no verifiable history, no record of who approved what
              budget, and no evidence of when work orders were dispatched. Annual General Meetings turn
              into battlegrounds.
            </p>
            <p>
              We built GrievEase with one unwavering principle: <strong>every complaint must have an
              owner, a strict deadline, and a permanent, immutable record</strong>. By removing
              finger-pointing and introducing transparent SLAs, we restore trust and neighborly peace.
            </p>
          </div>

          <div className="lg:col-span-6 bg-[#F0FAF7] rounded-3xl p-8 sm:p-10 border border-[#B0EBDC]/70">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#00B894] text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1A1A2E]">GrievEase Principles</h3>
                <p className="text-xs text-[#718096]">How we operate and build software</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#1A1A2E]">
              <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0]">
                <strong>1. No Ignored Complaints:</strong> Strict multi-level auto-escalation ensures
                issues always ascend if deadlines are missed.
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0]">
                <strong>2. Radical Transparency:</strong> Public telemetry and resolver hit rates hold
                everyone objectively accountable.
              </div>
              <div className="p-3.5 bg-white rounded-xl border border-[#E2E8F0]">
                <strong>3. Uncompromising Privacy:</strong> Anonymous filing options ensure residents
                never fear social awkwardness.
              </div>
            </div>
          </div>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="p-7 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#00846A] flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A2E] mb-1.5">Uncompromising Integrity</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              Tamper-evident logs ensure records cannot be secretly deleted, modified, or silenced by
              anyone in authority.
            </p>
          </div>

          <div className="p-7 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3B82F6] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A2E] mb-1.5">Empathy for Volunteers</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              We design tools that relieve pressure on society secretaries and committee chairs with
              automated workflows.
            </p>
          </div>

          <div className="p-7 bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0]">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-[#1A1A2E] mb-1.5">Measurable Outcomes</h3>
            <p className="text-xs text-[#718096] leading-relaxed">
              We don&apos;t settle for vanity dashboards. We focus on real hours saved and faster turnaround times.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-gray-100">
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all"
          >
            <span>Onboard Your Society Today</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
