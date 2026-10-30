'use client';

import React from 'react';
import { FileEdit, Clock, Users, Zap, ShieldCheck, Check } from 'lucide-react';
import { featuresContent } from '@/content/features';

export function KeyFeatures() {
  const iconMap: Record<string, React.ElementType> = {
    'file-edit': FileEdit,
    clock: Clock,
    zap: Zap,
    users: Users,
    'shield-check': ShieldCheck,
  };

  return (
    <section id="features" aria-labelledby="features-heading" className="section-fluid px-6 lg:px-12 bg-[#F8FAFC] border-y border-[#E2E8F0]/80">
      <div className="container-fluid">
        {/* Header Block */}
        <div className="max-w-[850px] mb-12">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {featuresContent.tag}
          </span>
          <h2
            id="features-heading"
            className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold text-[#1A1A2E] leading-[1.18] mb-4"
          >
            {featuresContent.heading}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-[1.65]">
            {featuresContent.description}
          </p>
        </div>

        {/* 5 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {featuresContent.items.map((item) => {
            const Icon = iconMap[item.icon] || FileEdit;
            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-6 border border-[#E2E8F0]/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_28px_rgba(0,184,148,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-[clamp(1.15rem,1.1rem+0.2vw,1.3rem)] font-bold text-[#1A1A2E] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-[14px] text-[#718096] leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* 3 Actionable Bullets */}
                {item.bullets && item.bullets.length > 0 && (
                  <ul className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-700">
                    {item.bullets.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
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
