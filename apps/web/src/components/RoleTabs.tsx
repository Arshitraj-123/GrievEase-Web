'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight, Users, Shield, HardHat, Home } from 'lucide-react';
import { roleTabsContent, RoleTabItem } from '@/content/roleTabs';

export function RoleTabs() {
  const [activeTab, setActiveTab] = useState<string>('residents');

  const currentRole: RoleTabItem =
    roleTabsContent.roles.find((r) => r.id === activeTab) || roleTabsContent.roles[0];

  const roleIcons: Record<string, React.ElementType> = {
    residents: Home,
    committee: Users,
    guards: Shield,
    vendors: HardHat,
  };

  return (
    <section
      id="roles"
      aria-labelledby="roles-heading"
      className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[700px] mx-auto mb-12">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {roleTabsContent.tag}
          </span>
          <h2
            id="roles-heading"
            className="text-[32px] sm:text-[40px] font-extrabold text-[#1A1A2E] leading-tight mb-4"
          >
            {roleTabsContent.heading}
          </h2>
          <p className="text-[15.5px] text-[#4A5568] leading-relaxed">
            {roleTabsContent.subtitle}
          </p>
        </div>

        {/* Tab Buttons Container */}
        <div className="flex justify-center mb-10">
          <div
            role="tablist"
            aria-label="Stakeholder Roles"
            className="inline-flex p-1.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xs max-w-full overflow-x-auto"
          >
            {roleTabsContent.roles.map((role) => {
              const Icon = roleIcons[role.id] || Home;
              const isActive = activeTab === role.id;
              return (
                <button
                  key={role.id}
                  role="tab"
                  id={`tab-${role.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${role.id}`}
                  onClick={() => setActiveTab(role.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] ${
                    isActive
                      ? 'bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white shadow-xs'
                      : 'text-[#4A5568] hover:text-[#00B894] hover:bg-[#F0FAF7]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{role.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Role Content Card */}
        <div
          role="tabpanel"
          id={`panel-${currentRole.id}`}
          aria-labelledby={`tab-${currentRole.id}`}
          className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E2E8F0] shadow-sm max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#F1F5F9]">
            <div>
              <span className="inline-block text-[11px] font-bold text-[#00846A] bg-[#00B894]/10 px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                {currentRole.badge}
              </span>
              <h3 className="text-[24px] sm:text-[28px] font-bold text-[#1A1A2E] leading-snug">
                {currentRole.title}
              </h3>
            </div>
          </div>

          <p className="text-[15px] text-[#4A5568] leading-relaxed mb-8">
            {currentRole.description}
          </p>

          {/* 4 Bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
            {currentRole.bullets.map((bullet, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-start gap-3.5 hover:border-[#00B894]/40 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#00B894]/15 text-[#00846A] flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#00846A]" />
                </div>
                <div>
                  <h4 className="text-[14px] font-bold text-[#1A1A2E] leading-snug mb-1">
                    {bullet.title}
                  </h4>
                  <p className="text-[12.5px] text-[#718096] leading-relaxed">
                    {bullet.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[#F1F5F9]">
            <Link
              href={currentRole.ctaJoin.href}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#00B894] to-[#00D4AA] text-white text-sm font-semibold shadow-[0_4px_15px_rgba(0,184,148,0.35)] hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <span>{currentRole.ctaJoin.label}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={currentRole.ctaDemo.href}
              className="px-6 py-3 rounded-full bg-white border border-[#E2E8F0] text-[#1A1A2E] text-sm font-semibold hover:border-[#00B894] hover:bg-[#F0FAF7]/50 transition-all"
            >
              {currentRole.ctaDemo.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
