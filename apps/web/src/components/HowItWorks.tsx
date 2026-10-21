'use client';

import React from 'react';
import { FileEdit, Search, CheckCircle, ChevronRight } from 'lucide-react';
import { howItWorksContent } from '@/content/howItWorks';

export function HowItWorks() {
  const icons = [FileEdit, Search, CheckCircle];

  return (
    <section id="how-it-works" aria-labelledby="how-it-works-heading" className="py-20 px-6 lg:px-12 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-center">
          {/* Left Header Column */}
          <div className="xl:col-span-4 flex flex-col items-start">
            <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
              {howItWorksContent.tag}
            </span>
            <h2
              id="how-it-works-heading"
              className="text-[28px] sm:text-[34px] font-bold text-[#1A1A2E] leading-tight mb-3"
            >
              {howItWorksContent.heading}
            </h2>
            <p className="text-[14px] text-[#4A5568] leading-relaxed max-w-[340px]">
              {howItWorksContent.description}
            </p>
          </div>

          {/* Right Steps Row with connected chevrons & handwritten note */}
          <div className="xl:col-span-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-4 justify-between relative">
            {howItWorksContent.steps.map((step, idx) => {
              const Icon = icons[idx] || FileEdit;
              return (
                <React.Fragment key={step.step}>
                  <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#00B894] text-white font-bold text-[13px] flex items-center justify-center shrink-0 shadow-sm">
                        {step.step}
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] shadow-2xs flex items-center justify-center text-[#00846A]">
                        <Icon className="w-4 h-4 text-[#00846A]" />
                      </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-[#1A1A2E] mb-1">{step.title}</h3>
                    <p className="text-[12px] text-[#718096] leading-relaxed max-w-[200px]">
                      {step.description}
                    </p>
                  </div>

                  {idx < howItWorksContent.steps.length - 1 && (
                    <div
                      className="hidden md:flex items-center justify-center pt-2 text-[#00B894]/70"
                      aria-hidden="true"
                    >
                      <ChevronRight className="w-6 h-6 stroke-[2.5]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Handwritten note on the far right */}
            <div
              className="shrink-0 flex flex-col items-center select-none pt-1 pl-2"
              aria-hidden="true"
            >
              <div className="font-caveat text-[22px] sm:text-[24px] text-[#00846A] font-semibold -rotate-6 leading-tight text-right">
                {howItWorksContent.annotation.line1} <br />
                {howItWorksContent.annotation.line2} <br />
                {howItWorksContent.annotation.line3}
              </div>
              <div className="text-[#00846A] text-sm -rotate-6 font-bold mt-0.5">
                {howItWorksContent.annotation.symbol}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
