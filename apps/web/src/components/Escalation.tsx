'use client';

import React from 'react';
import Link from 'next/link';
import { escalationContent } from '@/content/escalation';
import { siteConfig } from '@/config/site';

export function Escalation() {
  const headline = siteConfig.featureFlags.allowAbsoluteHeadline
    ? escalationContent.headlineAbsolute
    : escalationContent.headlineSoft;

  return (
    <section
      id="escalation"
      aria-labelledby="escalation-heading"
      className="py-20 px-6 lg:px-12 bg-[#1A1A2E] text-white relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00B894]/12 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-[1300px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center max-w-[720px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[2px] uppercase text-[#00B894] mb-3 block">
            {escalationContent.tag}
          </span>
          <h2 id="escalation-heading" className="text-[34px] sm:text-[44px] font-extrabold leading-[1.15] mb-4">
            {headline}
          </h2>
          <p className="text-[15px] sm:text-[16px] text-white/70 leading-relaxed">
            {escalationContent.subtitle}
          </p>
        </div>

        {/* 4-Level Visual Horizontal Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative mb-14">
          {escalationContent.levels.map((lvl) => (
            <div
              key={lvl.level}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 relative flex flex-col items-center text-center backdrop-blur-md hover:border-[#00B894]/60 transition-all duration-300 group"
            >
              {/* Badge Circle */}
              <div className="relative mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-extrabold text-xl shadow-lg transition-transform duration-300 group-hover:scale-105"
                  style={{
                    backgroundColor: `${lvl.accentColor}25`,
                    borderColor: lvl.accentColor,
                    borderWidth: '2px',
                    color: lvl.accentColor,
                  }}
                >
                  {lvl.level}
                </div>
                {lvl.level === 'L1' && (
                  <span
                    className="absolute -inset-1 rounded-full border border-[#00B894] animate-ping opacity-40 pointer-events-none"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Title & SLA Badge */}
              <div className="text-[19px] font-bold text-white mb-1.5">{lvl.title}</div>
              <div
                className={`text-[12px] font-bold px-3 py-0.5 rounded-full mb-3 border ${lvl.badgeColor}`}
              >
                {lvl.sla}
              </div>

              {/* Description */}
              <p className="text-[13px] text-white/70 leading-relaxed mb-4 flex-1">
                {lvl.description}
              </p>

              {/* Tag footer */}
              <div className="pt-3 border-t border-white/10 w-full text-[11px] font-semibold tracking-wide text-white/50 group-hover:text-white/80 transition-colors">
                {lvl.tag}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Dark Glass Feature Pills linking directly to Section 8 */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {escalationContent.pills.map((pill, idx) => (
            <a
              key={idx}
              href={pill.href}
              className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-[#00B894]/60 rounded-full px-5 py-2.5 text-[13px] text-white/90 flex items-center gap-2 backdrop-blur-sm transition-all duration-200 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
            >
              <span>{pill.icon}</span>
              <span>{pill.label}</span>
              <span className="text-xs text-[#00B894] ml-1">↓</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
