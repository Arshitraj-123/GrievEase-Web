import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Shield, Building2, ArrowRight, BarChart3, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Public Society Transparency Index — GrievEase',
  description:
    'Search and inspect public governance dashboards, SLA adherence rates, and resolution turnaround for verified GrievEase residential communities.',
  alternates: {
    canonical: '/transparency',
  },
};

export default function TransparencyIndexPage() {
  const featuredSocieties = [
    {
      slug: 'demo',
      name: 'Green Valley Residency',
      location: 'Bengaluru, Karnataka',
      units: 240,
      slaAdherence: 94.2,
      resolvedThisMonth: 156,
      satisfaction: 4.6,
    },
    {
      slug: 'palm-grove',
      name: 'Palm Grove Society',
      location: 'Pune, Maharashtra',
      units: 180,
      slaAdherence: 92.8,
      resolvedThisMonth: 112,
      satisfaction: 4.7,
    },
    {
      slug: 'silver-oak',
      name: 'Silver Oak Enclave',
      location: 'Gurugram, Haryana',
      units: 420,
      slaAdherence: 96.1,
      resolvedThisMonth: 284,
      satisfaction: 4.8,
    },
  ];

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1240px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[720px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            PUBLIC GOVERNANCE TELEMETRY
          </span>
          <h1 className="text-[36px] sm:text-[46px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Society Transparency Dashboards
          </h1>
          <p className="text-[16px] text-[#4A5568] leading-relaxed">
            GrievEase believes community governance should never happen behind closed doors. Inspect
            real-time resolution turnaround, SLA compliance, and satisfaction ratings for participating societies.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-14 relative">
          <input
            type="search"
            placeholder="Search society by name, city, or pincode..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#00B894] shadow-xs"
          />
          <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Featured Societies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {featuredSocieties.map((soc) => (
            <div
              key={soc.slug}
              className="bg-[#F8FAFC] rounded-3xl p-7 border border-[#E2E8F0] shadow-sm hover:border-[#00B894]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#1A1A2E] leading-snug">{soc.name}</h2>
                    <span className="text-xs text-[#718096]">{soc.location}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-5 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-medium">SLA Hit Rate</div>
                    <div className="text-base font-extrabold text-[#00846A] mt-0.5">
                      {soc.slaAdherence}%
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                    <div className="text-[10px] text-gray-500 font-medium">Resolved This Month</div>
                    <div className="text-base font-extrabold text-[#3B82F6] mt-0.5">
                      {soc.resolvedThisMonth}
                    </div>
                  </div>
                </div>
              </div>

              <Link
                href={`/society/${soc.slug}/transparency`}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-[#00B894] text-[#00846A] hover:text-white border border-[#00B894]/30 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Live Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Transparency Commitment Box */}
        <div className="bg-[#F0FAF7] rounded-3xl p-8 border border-[#B0EBDC]/60 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#00B894] text-white flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A2E]">
                Want to make your society governance transparent?
              </h3>
              <p className="text-xs text-[#4A5568]">
                Registered societies get public or resident-only transparency dashboards with a single click.
              </p>
            </div>
          </div>
          <Link
            href="/join"
            className="px-6 py-3 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shrink-0 transition-colors"
          >
            Register Your Society
          </Link>
        </div>
      </div>
    </div>
  );
}
