'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, FileText, Bell, BarChart3, ArrowRight, CheckCircle2, Lock, ShieldCheck, EyeOff, Server, Database } from 'lucide-react';
import { differentiatorsContent } from '@/content/differentiators';

export function Differentiators() {
  const renderSnippet = (type: string) => {
    switch (type) {
      case 'shield':
        return (
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-md max-w-md w-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B894]" />
                <span className="text-xs font-bold text-[#1A1A2E]">Ticket #ANON-8842</span>
              </div>
              <span className="text-[11px] font-semibold text-[#00846A] bg-[#00B894]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="w-3 h-3" /> Anonymous
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-dashed border-[#CBD5E1]">
                <div className="text-[#718096] text-[10px] uppercase font-bold tracking-wider">
                  Resident Identity
                </div>
                <div className="text-[#1A1A2E] font-mono font-semibold mt-0.5">
                  [HIDDEN BY PRIVACY PROTOCOL]
                </div>
              </div>
              <div className="text-[#4A5568] p-2 leading-relaxed">
                &ldquo;Persistent corridor noise and unauthorized late-night gathering on 5th floor.&rdquo;
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-[11px] text-[#718096]">
              <span>Resolver Visibility: None</span>
              <span className="text-[#00846A] font-semibold">Audit Key: OK-294</span>
            </div>
          </div>
        );

      case 'timeline':
        return (
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-md max-w-md w-full">
            <div className="text-xs font-bold text-[#1A1A2E] mb-3 flex items-center justify-between">
              <span>Immutable Ledger Records</span>
              <span className="text-[10px] font-mono text-[#00846A]">SHA-256 Verified</span>
            </div>
            <div className="space-y-3 relative pl-4 border-l-2 border-[#00B894]/30 text-xs">
              <div>
                <div className="font-semibold text-[#1A1A2E]">Assigned to Secretary (L1)</div>
                <div className="text-[11px] text-[#718096]">2026-10-20 09:30 AM · System Auto-Router</div>
              </div>
              <div>
                <div className="font-semibold text-[#1A1A2E]">Technician Dispatched</div>
                <div className="text-[11px] text-[#718096]">2026-10-20 11:15 AM · Work Order #W-412</div>
              </div>
              <div>
                <div className="font-semibold text-[#00846A]">Issue Resolved with Photo Verification</div>
                <div className="text-[11px] text-[#718096]">2026-10-20 04:45 PM · Resident Signed Off</div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-md max-w-md w-full space-y-3">
            <div className="flex items-center gap-3 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-9 h-9 rounded-xl bg-[#00B894] text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">Complaint Resolved!</div>
                <div className="text-[11px] text-[#4A5568]">Water pump repair signed off in 4h 12m.</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-blue-50 rounded-2xl border border-blue-100">
              <div className="w-9 h-9 rounded-xl bg-[#3B82F6] text-white flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">Visitor at Main Gate</div>
                <div className="text-[11px] text-[#4A5568]">Delivery partner checked in with Gate Pass #VP-4182.</div>
              </div>
            </div>
          </div>
        );

      case 'scorecard':
        return (
          <div className="bg-white rounded-3xl p-6 border border-[#E2E8F0] shadow-md max-w-md w-full">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
              <div>
                <div className="text-xs font-bold text-[#1A1A2E]">Ramesh Kumar (Electrician)</div>
                <div className="text-[11px] text-[#718096]">Primary Society Resolver</div>
              </div>
              <span className="text-xs font-extrabold text-[#F59E0B] bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                ★ 4.9 / 5.0
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                <div className="text-base font-extrabold text-[#00846A]">98.2%</div>
                <div className="text-[10px] text-[#718096] mt-0.5 font-medium">SLA Hit Rate</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                <div className="text-base font-extrabold text-[#3B82F6]">3.2 hrs</div>
                <div className="text-[10px] text-[#718096] mt-0.5 font-medium">Avg Resolution</div>
              </div>
              <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-[#E2E8F0]">
                <div className="text-base font-extrabold text-[#1A1A2E]">142</div>
                <div className="text-[10px] text-[#718096] mt-0.5 font-medium">Closed Jobs</div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section
      id="differentiators"
      aria-labelledby="differentiators-heading"
      className="section-fluid px-6 lg:px-12 bg-white border-b border-[#E2E8F0]/80"
    >
      <div className="container-fluid">
        {/* Section Header */}
        <div className="text-center max-w-[850px] mx-auto mb-16">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {differentiatorsContent.tag}
          </span>
          <h2
            id="differentiators-heading"
            className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold text-[#1A1A2E] leading-tight mb-4"
          >
            {differentiatorsContent.heading}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-relaxed">
            {differentiatorsContent.subtitle}
          </p>
        </div>

        {/* 4 Alternating Blocks */}
        <div className="space-y-16 mb-20">
          {differentiatorsContent.items.map((item, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div
                key={item.id}
                id={item.id}
                className={`scroll-mt-24 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center ${
                  isEven ? '' : 'lg:flex-row-reverse'
                }`}
              >
                {/* Content Side */}
                <div className={`lg:col-span-6 ${isEven ? 'lg:pr-8' : 'lg:order-2 lg:pl-8'}`}>
                  <span className="inline-block text-[11px] font-bold tracking-wider uppercase text-[#00846A] bg-[#00B894]/10 px-3.5 py-1 rounded-full mb-3">
                    {item.badge}
                  </span>
                  <h3 className="text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-bold text-[#1A1A2E] leading-snug mb-3">
                    {item.title}
                  </h3>
                  <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-[1.65] mb-5">
                    {item.description}
                  </p>
                  <div className="text-xs font-semibold text-[#718096] mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#00B894]" />
                    <span>{item.stats}</span>
                  </div>
                  <Link
                    href={item.learnMoreHref}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#00846A] hover:text-[#00B894] hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] rounded"
                  >
                    <span>Learn more about {item.title.toLowerCase()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* UI Snippet Side */}
                <div
                  className={`lg:col-span-6 flex justify-center ${
                    isEven ? '' : 'lg:order-1'
                  }`}
                >
                  <div className="p-6 sm:p-8 bg-[#F0FAF7]/70 rounded-3xl border border-[#B0EBDC]/60 w-full flex justify-center shadow-xs">
                    {renderSnippet(item.snippetType)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── PRIVACY & TRUST BAND (PART 1 Requirement) ─── */}
        <div className="bg-gradient-to-br from-[#1A1A2E] to-[#0F172A] rounded-3xl p-8 sm:p-12 text-white border border-slate-800 shadow-xl">
          <div className="max-w-[850px] mx-auto text-center mb-10">
            <span className="text-xs font-bold uppercase tracking-[2px] text-[#00B894] mb-2 block">
              PRIVACY & TRUST FIRST
            </span>
            <h3 className="text-[clamp(1.75rem,1.2rem+1.5vw,2.5rem)] font-extrabold text-white mb-3">
              Zero Third-Party Trackers. 100% In-App Transparency.
            </h3>
            <p className="text-sm sm:text-base text-white/70 leading-relaxed">
              Unlike cloud services that sell community telemetry or rely on telecom SMS gateways, GrievEase operates completely within self-hosted society infrastructure under DPDP Act 2023 principles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-[#00B894] flex items-center justify-center mb-4">
                <EyeOff className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">No Runtime 3rd Parties</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Zero external analytics, advertising SDKs, CDN font dependencies, or commercial tracking cookies. Your resident data never leaves your verified society deployment.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">In-App Alert Feeds</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Emergency gate approvals and SLA updates dispatch directly through persistent local WebSockets in your portal without leaking numbers to telecom SMS spam.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Immutable Cryptographic Audit</h4>
              <p className="text-xs text-white/70 leading-relaxed">
                Every grievance escalation, vendor pass, and cash maintenance receipt is hash-chained with SHA-256 state hashes. Financial records cannot be altered or retroactively deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
