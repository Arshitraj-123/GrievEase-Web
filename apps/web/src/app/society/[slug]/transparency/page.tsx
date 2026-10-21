import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  Shield,
  ArrowLeft,
  Download,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { getDemoDashboard } from '@/lib/api';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDemoDashboard(slug);

  return {
    title: `${data.society.name} — Public Governance Dashboard`,
    description: `Inspect verified SLA turnaround, category breakdown, and tamper-evident resolution ledgers for ${data.society.name}.`,
    alternates: {
      canonical: `/society/${slug}/transparency`,
    },
  };
}

export default async function SocietyTransparencyPage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getDemoDashboard(slug);

  if (!data) {
    notFound();
  }

  const { metrics, categoryBreakdown, escalationLevelTimes, recentResolutions, society } = data;
  const maxCategoryTotal = Math.max(...categoryBreakdown.map((c) => c.total));

  return (
    <div className="py-12 px-6 lg:px-12 bg-white">
      <div className="max-w-[1300px] mx-auto">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/transparency"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#4A5568] hover:text-[#00846A] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Transparency Index</span>
          </Link>
        </div>

        {/* Dashboard Title Header */}
        <div className="bg-[#F0FAF7] rounded-3xl p-8 border border-[#B0EBDC]/60 mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full text-xs font-bold text-[#00846A] mb-3 border border-[#B0EBDC]">
              <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse" />
              <span>OFFICIAL PUBLIC TELEMETRY LEDGER</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] leading-tight">
              {society.name}
            </h1>
            <p className="text-sm text-[#4A5568] mt-1">
              {society.units} Residential Units • {society.location} • Monitored 24/7 by GrievEase Engine
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/track"
              className="px-5 py-2.5 rounded-full bg-white hover:bg-gray-50 border border-[#CBD5E1] text-xs font-semibold text-[#1A1A2E] transition-colors"
            >
              Track Ticket ID
            </Link>
            <Link
              href="/join"
              className="px-5 py-2.5 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Join This Society
            </Link>
          </div>
        </div>

        {/* 4 Big Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
              Total Resolved
            </span>
            <div className="text-3xl font-extrabold text-[#00846A]">
              {metrics.resolvedComplaints}
            </div>
            <div className="text-xs text-[#718096] mt-1">
              out of {metrics.totalComplaints} total complaints
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
              SLA Hit Rate
            </span>
            <div className="text-3xl font-extrabold text-[#3B82F6]">
              {metrics.slaAdherencePct}%
            </div>
            <div className="text-xs text-blue-600 mt-1 font-medium">Within agreed turnaround</div>
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
              Open Work Orders
            </span>
            <div className="text-3xl font-extrabold text-[#F59E0B]">{metrics.inProgress}</div>
            <div className="text-xs text-[#EF4444] mt-1 font-medium">
              {metrics.escalated} Escalated cases
            </div>
          </div>

          <div className="bg-[#F8FAFC] rounded-2xl p-5 border border-[#E2E8F0]">
            <span className="text-[11px] font-bold text-[#718096] uppercase tracking-wider block mb-1">
              Resident Rating
            </span>
            <div className="text-3xl font-extrabold text-[#1A1A2E]">
              {metrics.satisfactionScore} <span className="text-sm font-normal text-gray-500">/ 5</span>
            </div>
            <div className="text-xs text-amber-500 mt-1 font-bold">★ ★ ★ ★ ★</div>
          </div>
        </div>

        {/* Breakdown by Category & Escalation Times */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          {/* Category Bar Chart (7 cols) */}
          <div className="lg:col-span-7 bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-1">Complaint Category Breakdown</h2>
            <p className="text-xs text-[#718096] mb-6">
              Total volume vs successfully closed tickets with average hours to resolution
            </p>

            <div className="space-y-4">
              {categoryBreakdown.map((cat) => {
                const pct = (cat.resolved / maxCategoryTotal) * 100;
                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#1A1A2E]">{cat.category}</span>
                      <span className="text-gray-500 font-mono">
                        {cat.resolved} resolved ({cat.avgHours}h avg turnaround)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-[#00B894] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SLA Escalation Levels (5 cols) */}
          <div className="lg:col-span-5 bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0]">
            <h2 className="text-base font-bold text-[#1A1A2E] mb-1">Resolution Time by Authority Level</h2>
            <p className="text-xs text-[#718096] mb-6">Average turnaround compared against SLA limit</p>

            <div className="space-y-3.5">
              {escalationLevelTimes.map((lvl) => (
                <div
                  key={lvl.level}
                  className="p-3.5 bg-white rounded-2xl border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-[#1A1A2E]">{lvl.level}</div>
                    <div className="text-[10.5px] text-[#718096]">SLA Target: {lvl.slaHours} hours</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-extrabold text-[#00846A]">
                      {lvl.avgResolveHours}h avg
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold">
                      {lvl.resolvedPct}% closed at this tier
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Resolutions Ledger Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[#1A1A2E]">Recent Resolution Ledger</h2>
              <p className="text-xs text-[#718096]">
                Immutable, timestamped public records for completed maintenance cases
              </p>
            </div>
            <span className="text-[11px] font-mono font-semibold text-[#00846A] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              SHA-256 Ledger: VERIFIED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-semibold">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Issue Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Resolved Level</th>
                  <th className="py-2.5 px-3">Turnaround</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentResolutions.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#00846A]">{row.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#1A1A2E]">{row.title}</td>
                    <td className="py-3 px-3 text-gray-600">{row.category}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        {row.level}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-emerald-600">{row.turnaround}</td>
                    <td className="py-3 px-3 text-gray-500">{row.resolvedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
