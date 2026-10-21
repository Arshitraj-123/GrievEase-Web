import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — GrievEase',
  description:
    'Read the GrievEase Privacy Policy. Learn how we safeguard resident data, handle anonymous grievances, and protect identity.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[850px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] mb-3">
          Privacy Policy
        </h1>
        <p className="text-xs text-[#718096] mb-8">Last Updated: October 21, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-sm text-[#4A5568] leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">1. Introduction</h2>
            <p>
              At GrievEase (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we take the privacy of residents,
              housing societies, committee members, and service providers seriously. This policy describes
              how we collect, use, store, and protect your personal information when using our web
              portal and mobile applications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">2. Information We Collect</h2>
            <p>We collect only the minimum necessary information to facilitate residential governance:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Resident Identifiers:</strong> Name, phone number, email address, building and flat unit number.</li>
              <li><strong>Grievance Records:</strong> Problem category, description, photos, audio attachments, and location markers.</li>
              <li><strong>Gate &amp; Visitor Logs:</strong> Visitor name, vehicle number, host unit, entry/exit timestamps.</li>
              <li><strong>Technical Data:</strong> Device model, operating system, and IP address for security logging.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">3. Anonymous Grievances</h2>
            <p>
              When a resident files an issue marked as &ldquo;Anonymous&rdquo;, GrievEase cryptographically
              separates the resident’s personal profile from the ticket metadata. Resolvers, technicians,
              and committee members see only the issue description, photos, and general floor or wing,
              with zero personally identifiable information. Only an authorized Super Admin can review
              identity records under certified legal or life-safety requirements, and every access is
              permanently logged in our tamper-evident audit ledger.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">4. Data Storage &amp; Encryption</h2>
            <p>
              All customer data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
              Our databases are hosted in ISO 27001-certified data centers located strictly within the
              jurisdiction of India in compliance with the Digital Personal Data Protection Act (DPDP Act).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">5. Your Rights</h2>
            <p>
              You have the right to request access to your stored records, rectify inaccuracies, or
              request account deletion upon moving out of a registered society. Visit our{' '}
              <Link href="/data-deletion" className="text-[#00846A] underline">
                Data Deletion portal
              </Link>{' '}
              to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">6. Contact Our Privacy Officer</h2>
            <p>
              For privacy queries or complaints, reach us at{' '}
              <Link href="/contact" className="text-[#00846A] underline">
                our support portal
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
