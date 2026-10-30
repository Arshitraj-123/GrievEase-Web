'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart3, CheckCircle2, Clock, Star, ArrowRight, ShieldCheck } from 'lucide-react';
import { getDemoDashboard, DemoDashboard } from '@/lib/api';

export function TransparencyDashboardPreview() {
  const [data, setData] = useState<DemoDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    getDemoDashboard('palm-grove')
      .then((res) => {
        if (res) {
          setData(res);
        } else {
          // Public dashboard disabled or RESIDENTS_ONLY. Check if user is logged in
          fetch('/api/v1/app/analytics', { credentials: 'include' })
            .then((authRes) => {
              if (authRes.ok) setIsLoggedIn(true);
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return null;
  }

  // If dashboard is disabled or RESIDENTS_ONLY and user is not logged in, hide completely
  if (!data && !isLoggedIn) {
    return null;
  }

  // Teaser for logged-in users when public view is RESIDENTS_ONLY
  if (!data && isLoggedIn) {
    return (
      <section id="transparency-preview" className="py-16 px-6 lg:px-12 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-[1300px] mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 rounded-full text-xs font-bold text-teal-800 mb-2.5">
              RESIDENT TRANSPARENCY
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E]">
              Society Transparency Dashboard
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              Real-time audit telemetry, SLA compliance tracking, category breakdowns, and governance turnaround times are active for your society.
            </p>
          </div>
          <Link
            href="/society/palm-grove/transparency"
            className="px-6 py-3 rounded-full bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all flex items-center gap-2 shrink-0 shadow-md"
          >
            <span>See live transparency dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    );
  }

  const { metrics, categoryBreakdown, escalationLevelTimes, society } = data!;
  const maxCategoryCount = Math.max(...categoryBreakdown.map((c) => c.total), 1);

  return (
    <section
      id="transparency-preview"
      aria-labelledby="transparency-heading"
      className="section-fluid px-6 lg:px-12 bg-white border-b border-[#E2E8F0]/80"
    >
      <div className="container-fluid">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#00B894]/10 rounded-full text-xs font-bold text-[#00846A] mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse" />
              LIVE TRANSPARENCY DEMO
            </div>
            <h2
              id="transparency-heading"
              className="text-[32px] sm:text-[40px] font-extrabold text-[#1A1A2E] leading-tight"
            >
              See how your society is really doing
            </h2>
            <p className="text-[15px] text-[#4A5568] mt-2">
              Real-time audit telemetry for{' '}
              <strong className="text-[#1A1A2E]">{society.name}</strong> ({society.units} flats, {society.location})
            </p>
          </div>

          <Link
            href="/society/palm-grove/transparency"
            className="self-start md:self-auto px-6 py-3 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,184,148,0.45)] transition-all flex items-center gap-2 shrink-0"
          >
            <span>See live transparency dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dashboard Preview Container */}
        <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-8 border border-[#E2E8F0] shadow-sm">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
              <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-1">
                Total Filed vs Resolved
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#00846A]">
                  {metrics.resolvedComplaints}
                </span>
                <span className="text-sm font-semibold text-[#718096]">
                  / {metrics.totalComplaints}
                </span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-[#00B894] h-full rounded-full"
                  style={{
                    width: `${(metrics.resolvedComplaints / metrics.totalComplaints) * 100}%`,
                  }}
                />
              </div>
              <div className="text-[10px] text-[#718096] mt-1.5 flex justify-between">
                <span>Resolution Rate</span>
                <span className="font-bold text-[#00846A]">
                  {((metrics.resolvedComplaints / metrics.totalComplaints) * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
              <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-1">
                SLA Compliance
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#3B82F6]">
                  {metrics.slaAdherencePct}%
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                <span>Resolved before breach</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
              <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-1">
                Currently Active
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F59E0B]">
                  {metrics.inProgress}
                </span>
                <span className="text-xs font-semibold text-[#EF4444]">
                  ({metrics.escalated} Escalated)
                </span>
              </div>
              <div className="text-xs text-[#718096] mt-2 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>All within active SLA timers</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-2xs">
              <div className="text-[11px] font-bold text-[#718096] uppercase tracking-wider mb-1">
                Resident Satisfaction
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E]">
                  {metrics.satisfactionScore}
                </span>
                <span className="text-xs font-bold text-amber-500">★ ★ ★ ★ ★</span>
              </div>
              <div className="text-xs text-[#00846A] mt-2 font-semibold">
                {metrics.satisfactionPct}% positive resident feedback
              </div>
            </div>
          </div>

          {/* Lower Grid: Resolution By Category (Bar Chart) + Avg Time Per Level */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Resolution by Category Chart (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A2E]">Resolution by Category</h3>
                  <p className="text-xs text-[#718096]">Complaint volume and resolution volume</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-[#718096]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#00B894]" /> Resolved
                  </span>
                  <span className="flex items-center gap-1 text-[#718096]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-slate-200" /> Total
                  </span>
                </div>
              </div>

              {/* Horizontal Bar Chart */}
              <div className="space-y-3.5">
                {categoryBreakdown.map((cat) => {
                  const resolvedWidth = (cat.resolved / maxCategoryCount) * 100;
                  const totalWidth = (cat.total / maxCategoryCount) * 100;

                  return (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-[#1A1A2E]">{cat.category}</span>
                        <span className="text-[11px] text-[#718096]">
                          {cat.resolved} / {cat.total} ({cat.avgHours}h avg)
                        </span>
                      </div>
                      <div className="w-full bg-[#F1F5F9] h-3.5 rounded-full relative overflow-hidden">
                        <div
                          className="bg-[#CBD5E1] h-full rounded-full absolute left-0 top-0"
                          style={{ width: `${totalWidth}%` }}
                        />
                        <div
                          className="bg-[#00B894] h-full rounded-full absolute left-0 top-0 transition-all duration-500"
                          style={{ width: `${resolvedWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Average Time Per Level (5 cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A2E] mb-1">Average Turnaround by Level</h3>
                <p className="text-xs text-[#718096] mb-5">Actual turnaround vs allowed SLA</p>

                <div className="space-y-3">
                  {escalationLevelTimes.map((item) => (
                    <div
                      key={item.level}
                      className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-bold text-[#1A1A2E]">{item.level}</div>
                        <div className="text-[11px] text-[#718096]">SLA Limit: {item.slaHours}h</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-[#00846A]">
                          {item.avgResolveHours}h avg
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          {item.resolvedPct}% closed here
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#F1F5F9] text-center">
                <Link
                  href="/society/palm-grove/transparency"
                  className="text-xs font-bold text-[#00846A] hover:underline"
                >
                  Explore complete ledger history &amp; audit reports →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
