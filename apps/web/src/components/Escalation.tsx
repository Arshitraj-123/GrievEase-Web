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
      className="section-fluid px-6 lg:px-12 bg-[#1A1A2E] text-white relative overflow-hidden"
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#00B894]/12 rounded-full blur-[100px] pointer-events-none" />

      <div className="container-fluid relative z-10">
        {/* Header */}
        <div className="text-center max-w-[850px] mx-auto mb-12">
          <span className="text-[13px] font-bold tracking-[2px] uppercase text-[#00B894] mb-3 block">
            {escalationContent.tag}
          </span>
          <h2 id="escalation-heading" className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold leading-[1.15] mb-4">
            {headline}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-white/70 leading-relaxed mb-6">
            {escalationContent.subtitle}
          </p>

          {/* How Escalation Works Explanatory Narrative */}
          <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-5 text-left text-sm text-white/80 leading-relaxed max-w-[800px] mx-auto backdrop-blur-md">
            <div className="text-xs font-bold uppercase tracking-wider text-[#00B894] mb-1.5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00B894]" />
              <span>How automated SLA escalation works</span>
            </div>
            <p className="text-[13.5px] leading-relaxed text-white/85">
              {escalationContent.howItWorksParagraph}
            </p>
          </div>
        </div>

        {/* 4-Level Visual Horizontal Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative mb-12">
          {escalationContent.levels.map((lvl) => (
            <div
              key={lvl.level}
              className="bg-white/5 border border-white/10 rounded-3xl p-7 relative flex flex-col items-center text-center backdrop-blur-md hover:border-[#00B894]/60 transition-all duration-300 group"
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
              <div className="text-[20px] font-bold text-white mb-1.5">{lvl.title}</div>
              <div
                className={`text-[12px] font-bold px-3.5 py-1 rounded-full mb-3 border ${lvl.badgeColor}`}
              >
                {lvl.sla}
              </div>

              {/* Description */}
              <p className="text-[14px] text-white/70 leading-relaxed mb-4 flex-1">
                {lvl.description}
              </p>

              {/* Tag footer */}
              <div className="pt-3 border-t border-white/10 w-full text-[12px] font-semibold tracking-wide text-white/50 group-hover:text-white/80 transition-colors">
                {lvl.tag}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Dark Glass Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {escalationContent.pills.map((pill, idx) => (
            <a
              key={idx}
              href={pill.href}
              className="bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-[#00B894]/60 rounded-full px-6 py-3 text-[14px] text-white/90 flex items-center gap-2 backdrop-blur-sm transition-all duration-200 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
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
