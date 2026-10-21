import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Key, Server, Database, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Data Architecture — GrievEase',
  description:
    'Learn how GrievEase secures society records: TLS 1.3 encryption, immutable SHA-256 state hashing, strict Role-Based Access Control, and Indian data residency.',
  alternates: {
    canonical: '/security',
  },
};

export default function SecurityPage() {
  const securityPillars = [
    {
      icon: Lock,
      title: 'End-to-End Transport & At-Rest Encryption',
      desc: 'All data transferred between your browser, mobile app, and GrievEase servers is encrypted using modern TLS 1.3 with strict HSTS. Databases and S3-compatible attachment stores are encrypted using AES-256 keys managed in secure Hardware Security Modules (HSM).',
    },
    {
      icon: Database,
      title: 'Immutable SHA-256 Ledger State Hashing',
      desc: 'Every milestone in a ticket—from submission, Secretary review, vendor dispatch, to resident signoff—is stamped with a cryptographic SHA-256 checksum and stored in an append-only ledger that cannot be modified or purged by any administrator.',
    },
    {
      icon: Key,
      title: 'Role-Based Access Control (RBAC)',
      desc: 'Permissions are strictly segregated across Residents, Secretaries (L1), Committee Members (L2), Chairmen (L3), Governing Body Members (L4), Security Guards, and Vendors. Users only see data pertinent to their role and unit.',
    },
    {
      icon: Server,
      title: 'Data Residency in India (DPDP Act Ready)',
      desc: 'All customer databases, backups, and media attachments are hosted exclusively in Tier-IV data centers located within India (Mumbai and Hyderabad regions), complying fully with Indian regulatory and privacy standards.',
    },
  ];

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1000px] mx-auto">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            TRUST &amp; ARCHITECTURE
          </span>
          <h1 className="text-[34px] sm:text-[44px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Security That Protects Every Resident
          </h1>
          <p className="text-[15.5px] text-[#4A5568]">
            We treat society records, gate logs, and resident grievances with enterprise-grade defense.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {securityPillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <div
                key={i}
                className="bg-[#F8FAFC] rounded-3xl p-8 border border-[#E2E8F0] shadow-2xs hover:border-[#00B894]/40 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center mb-5">
                  <Icon className="w-6 h-6" />
                </div>
                <h2 className="text-lg font-bold text-[#1A1A2E] mb-2">{p.title}</h2>
                <p className="text-xs sm:text-sm text-[#4A5568] leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-[#1A1A2E] text-white rounded-3xl p-8 sm:p-12 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2">Have a Responsible Disclosure or Audit Request?</h3>
            <p className="text-xs sm:text-sm text-white/70 max-w-xl">
              We welcome security researchers and society auditors. Review our bug bounty guidelines
              or request an architecture compliance whitepaper.
            </p>
          </div>
          <Link
            href="/contact"
            className="px-6 py-3 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Contact Security Team
          </Link>
        </div>
      </div>
    </div>
  );
}
