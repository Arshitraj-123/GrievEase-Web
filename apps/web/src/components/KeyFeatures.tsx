'use client';

import React from 'react';
import { FileEdit, Clock, Users, Zap, ShieldCheck } from 'lucide-react';
import { featuresContent } from '@/content/features';

export function KeyFeatures() {
  const iconMap: Record<string, React.ElementType> = {
    'file-edit': FileEdit,
    clock: Clock,
    users: Users,
    zap: Zap,
    'shield-check': ShieldCheck,
  };

  return (
    <section id="features" aria-labelledby="features-heading" className="py-20 px-6 lg:px-12 bg-white">
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Left Header Column */}
          <div className="xl:col-span-3 flex flex-col items-start">
            <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5">
              {featuresContent.tag}
            </span>
            <h2
              id="features-heading"
              className="text-[30px] sm:text-[34px] font-bold text-[#1A1A2E] leading-[1.2] mb-3.5"
            >
              {featuresContent.heading}
            </h2>
            <p className="text-[14px] text-[#4A5568] leading-[1.65] max-w-[340px]">
              {featuresContent.description}
            </p>
          </div>

          {/* Right Cards Row: 5 horizontal cards with unique icons */}
          <div className="xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {featuresContent.items.map((item) => {
              const Icon = iconMap[item.icon] || FileEdit;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-[#E2E8F0]/80 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_24px_rgba(0,184,148,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col"
                >
                  <div
                    className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center mb-3.5`}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-[15px] font-semibold text-[#1A1A2E] mb-1.5 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[12.5px] text-[#718096] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
