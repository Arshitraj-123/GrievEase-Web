'use client';

import React from 'react';
import { FileEdit, Search, CheckCircle, ChevronRight, Check } from 'lucide-react';
import { howItWorksContent } from '@/content/howItWorks';

export function HowItWorks() {
  const icons = [FileEdit, Search, CheckCircle];

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="section-fluid px-6 lg:px-12 bg-[#F0FAF7]/40 border-b border-[#E2E8F0]/80">
      <div className="container-fluid">
        {/* Header Block */}
        <div className="max-w-[850px] mb-12">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {howItWorksContent.tag}
          </span>
          <h2
            id="how-it-works-heading"
            className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold text-[#1A1A2E] leading-[1.18] mb-4"
          >
            {howItWorksContent.heading}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-[1.65]">
            {howItWorksContent.description}
          </p>
        </div>

        {/* 3 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative items-stretch">
          {howItWorksContent.steps.map((step, idx) => {
            const Icon = icons[idx] || FileEdit;
            return (
              <div
                key={step.step}
                className="bg-white rounded-3xl p-7 border border-[#E2E8F0]/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#00B894] text-white font-extrabold text-[16px] flex items-center justify-center shadow-xs">
                      {step.step}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#00846A]">
                      <Icon className="w-5 h-5 text-[#00846A]" />
                    </div>
                  </div>

                  <h3 className="text-[clamp(1.2rem,1.1rem+0.3vw,1.35rem)] font-bold text-[#1A1A2E] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#718096] leading-relaxed mb-4">
                    {step.description}
                  </p>
                </div>

                {/* 3 Actionable Bullets */}
                {step.bullets && step.bullets.length > 0 && (
                  <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                    {step.bullets.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-[#00B894] shrink-0 mt-0.5" />
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
