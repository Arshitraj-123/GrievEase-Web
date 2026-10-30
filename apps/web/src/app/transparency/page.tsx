import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Public Society Transparency Index — GrievEase',
  description:
    'Search and inspect public governance dashboards, SLA adherence rates, and resolution turnaround for verified GrievEase residential communities.',
  alternates: {
    canonical: '/transparency',
  },
};

export default function TransparencyIndexPage() {
  const societies = [
    {
      slug: 'palm-grove',
      name: 'Palm Grove Heights',
      location: 'Mumbai, Maharashtra',
      slaAdherence: 94.2,
      resolvedThisMonth: 142,
      satisfaction: 4.6,
      publicDashboard: true,
    },
  ];

  return (
    <div className="section-fluid bg-white dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      <div className="container-fluid">
        <div className="text-center max-w-[840px] mx-auto mb-14">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-teal-600 dark:text-teal-400 mb-2.5 block">
            PUBLIC GOVERNANCE TELEMETRY
          </span>
          <h1 className="fluid-h1 font-extrabold text-slate-900 dark:text-slate-100 leading-tight mb-4">
            Society Transparency Dashboards
          </h1>
          <p className="fluid-lead text-slate-600 dark:text-slate-400 leading-relaxed">
            GrievEase believes community governance should never happen behind closed doors. Inspect real-time resolution turnaround, SLA compliance, and resident satisfaction ratings verified against our immutable audit ledger.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {societies.map((soc) => (
            <Link
              key={soc.slug}
              href={`/society/${soc.slug}/transparency`}
              className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 hover:bg-teal-50/30 dark:hover:bg-slate-800/60 hover:border-teal-400 dark:hover:border-teal-600 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Verified Society
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Live
                  </span>
                </div>
                <h3 className="fluid-card-title font-bold text-slate-900 dark:text-slate-100">{soc.name}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{soc.location}</p>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-sm">
                <span className="font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
                  View Telemetry Dashboard
                  <ArrowRight className="w-4 h-4" />
                </span>
                <span className="text-slate-400 text-xs">Audit Chain Verified</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
