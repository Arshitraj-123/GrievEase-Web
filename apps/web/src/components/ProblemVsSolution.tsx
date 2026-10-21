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
      className="py-20 px-6 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {problemSolutionContent.tag}
          </span>
          <h2
            id="problem-solution-heading"
            className="text-[32px] sm:text-[40px] font-extrabold text-[#1A1A2E] leading-tight mb-4"
          >
            {problemSolutionContent.title}
          </h2>
          <p className="text-[15.5px] text-[#4A5568] leading-relaxed">
            {problemSolutionContent.subtitle}
          </p>
        </div>

        {/* 2-Column Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* LEFT: Without GrievEase */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-red-200 shadow-sm relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#EF4444] flex items-center justify-center font-bold">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1A1A2E]">
                    {problemSolutionContent.without.heading}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-red-100 text-[#DC2626] text-xs font-semibold">
                  {problemSolutionContent.without.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {problemSolutionContent.without.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-red-50 text-[#EF4444] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold leading-none">✕</span>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-[#1A1A2E] leading-snug">
                        {pt.title}
                      </h4>
                      <p className="text-[13px] text-[#718096] leading-relaxed mt-0.5">
                        {pt.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 bg-red-50/50 rounded-2xl p-4 text-[13px] text-[#DC2626] font-medium flex items-center gap-2">
              <span>⚠️ Result:</span>
              <span>Resident frustration, delayed fixes, and noisy arguments.</span>
            </div>
          </div>

          {/* RIGHT: With GrievEase */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 border-2 border-[#00B894] shadow-[0_10px_35px_rgba(0,184,148,0.12)] relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#00B894]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#00B894]/15 text-[#00846A] flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-6 h-6 text-[#00846A]" />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1A1A2E]">
                    {problemSolutionContent.with.heading}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#00B894]/15 text-[#00846A] text-xs font-semibold">
                  {problemSolutionContent.with.badge}
                </span>
              </div>

              <ul className="space-y-4">
                {problemSolutionContent.with.points.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-3.5">
                    <div className="w-5 h-5 rounded-full bg-[#00B894]/15 text-[#00846A] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold leading-none">✓</span>
                    </div>
                    <div>
                      <h4 className="text-[15px] font-semibold text-[#1A1A2E] leading-snug">
                        {pt.title}
                      </h4>
                      <p className="text-[13px] text-[#4A5568] leading-relaxed mt-0.5">
                        {pt.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[13px] text-[#00846A] font-semibold">
                Guaranteed resolution within SLA
              </span>
              <Link
                href="/join"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#00B894] hover:bg-[#00A383] px-4 py-2 rounded-full transition-colors"
              >
                <span>Experience GrievEase</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
