'use client';

import React from 'react';
import { XCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { problemSolutionContent } from '@/content/problemSolution';

export function ProblemVsSolution() {
  return (
    <section
      id="problem-solution"
      aria-labelledby="problem-solution-heading"
      className="section-fluid px-6 lg:px-12 bg-white"
    >
      <div className="container-fluid">
        {/* Header */}
        <div className="text-center max-w-[850px] mx-auto mb-12">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {problemSolutionContent.tag}
          </span>
          <h2
            id="problem-solution-heading"
            className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold text-[#1A1A2E] leading-[1.18] mb-4"
          >
            {problemSolutionContent.title}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-relaxed">
            {problemSolutionContent.subtitle}
          </p>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: Without GrievEase */}
          <div className="bg-[#FFF5F5] rounded-3xl p-8 sm:p-10 border border-red-200/80 shadow-sm relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#EF4444] flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-[clamp(1.25rem,1.15rem+0.35vw,1.375rem)] font-bold text-[#1A1A2E]">
                    {problemSolutionContent.without.heading}
                  </h3>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-red-100 text-[#DC2626] text-xs font-bold uppercase tracking-wider">
                  {problemSolutionContent.without.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {problemSolutionContent.without.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold leading-none">✕</span>
                    </div>
                    <div>
                      <h4 className="text-[16px] sm:text-[17px] font-bold text-[#1A1A2E] leading-snug">
                        {pt.title}
                      </h4>
                      <p className="text-[14px] text-[#718096] leading-relaxed mt-0.5">
                        {pt.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-red-200/60 text-xs font-semibold text-[#DC2626]">
              Result: Escalating conflict, lost dues, and high committee turnover.
            </div>
          </div>

          {/* RIGHT: With GrievEase */}
          <div className="bg-[#F0FAF7] rounded-3xl p-8 sm:p-10 border-2 border-[#00B894]/40 shadow-md relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#00B894]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-[clamp(1.25rem,1.15rem+0.35vw,1.375rem)] font-bold text-[#1A1A2E]">
                    {problemSolutionContent.with.heading}
                  </h3>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#00B894]/15 text-[#00846A] text-xs font-bold uppercase tracking-wider">
                  {problemSolutionContent.with.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {problemSolutionContent.with.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-6 h-6 rounded-full bg-[#00B894]/20 text-[#00846A] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold leading-none">✓</span>
                    </div>
                    <div>
                      <h4 className="text-[16px] sm:text-[17px] font-bold text-[#1A1A2E] leading-snug">
                        {pt.title}
                      </h4>
                      <p className="text-[14px] text-[#4A5568] leading-relaxed mt-0.5">
                        {pt.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-[#00B894]/20 flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00846A]">
                Average SLA compliance across active societies: 94.2%
              </span>
              <Link
                href="/activate"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00846A] hover:underline"
              >
                <span>Activate society</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
