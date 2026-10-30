import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — GrievEase',
  description:
    'Review the GrievEase Terms of Service covering society onboarding, SLA governance, user responsibilities, and platform rules.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="section-fluid bg-white">
      <div className="container-fluid max-w-[1040px]">
        <h1 className="fluid-h1 font-extrabold text-[#1A1A2E] mb-3">
          Terms of Service
        </h1>
        <p className="text-sm text-[#718096] mb-10">Effective Date: October 30, 2026</p>

        <div className="space-y-8 fluid-body text-[#4A5568] leading-relaxed">
          <section>
            <h2 className="fluid-h2 font-bold text-[#1A1A2E] mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using GrievEase platforms (web or mobile apps), you agree to be bound
              by these Terms of Service. If you are registering on behalf of a Housing Society Managing
              Committee or Residents Welfare Association (RWA), you represent that you possess the
              requisite authority to bind that entity.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">2. SLA Framework &amp; Escalation</h2>
            <p>
              GrievEase provides an automated software system to route, track, and escalate residential
              grievances (L1 Secretary 48h, L2 Committee 72h, L3 Chairman 96h, L4 Governing Body 120h).
              While the platform guarantees automated digital dispatch and immutable record keeping,
              physical execution of repairs remains the operational responsibility of the registered
              society and its designated service vendors.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">3. User Conduct</h2>
            <p>
              Users agree not to submit fraudulent or malicious emergency SOS alerts, defame fellow
              residents, or upload unauthorized content. Frivolous abuse of emergency services may lead
              to suspension of account privileges upon resolution by the Managing Committee.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">4. Free for Residents Guarantee</h2>
            <p>
              Residents and tenants enjoy 100% free access to report issues, track tickets, and use
              visitor gate passes. Society administrative subscriptions are billed annually to the society
              treasury as contracted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">5. Governing Law</h2>
            <p>
              These terms are governed by and construed in accordance with the laws of India, with
              exclusive jurisdiction vested in the courts of Bengaluru, Karnataka.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
