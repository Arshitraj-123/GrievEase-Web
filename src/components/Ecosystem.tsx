'use client';

import React from 'react';
import Link from 'next/link';
import {
  UserCheck,
  Bell,
  Briefcase,
  Calendar,
  CreditCard,
  AlertTriangle,
  Shield,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { ecosystemContent } from '@/content/ecosystem';

export function Ecosystem() {
  const iconMap: Record<string, React.ElementType> = {
    'user-check': UserCheck,
    bell: Bell,
    briefcase: Briefcase,
    calendar: Calendar,
    'credit-card': CreditCard,
    'alert-triangle': AlertTriangle,
    shield: Shield,
    'book-open': BookOpen,
  };

  return (
    <section
      id="ecosystem"
      aria-labelledby="ecosystem-heading"
      className="py-20 px-6 lg:px-12 bg-[#F0FAF7]/70 border-b border-[#E2E8F0]"
    >
      <div className="max-w-[1300px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[700px] mx-auto mb-14">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
            {ecosystemContent.tag}
          </span>
          <h2
            id="ecosystem-heading"
            className="text-[32px] sm:text-[38px] font-bold text-[#1A1A2E] leading-tight mb-3"
          >
            {ecosystemContent.heading}
          </h2>
          <p className="text-[15px] text-[#4A5568]">
            {ecosystemContent.subtitle}
          </p>
        </div>

        {/* 8 Feature Cards Grid (4 cols on lg, 2 cols on md, 1 col on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecosystemContent.cards.map((card) => {
            const Icon = iconMap[card.icon] || Shield;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-2xs hover:shadow-lg hover:border-[#00B894]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" style={{ color: card.color }} />
                    </div>
                    <span className="bg-[#00B894]/10 text-[#00846A] font-semibold text-[11px] px-2.5 py-1 rounded-full">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold text-[#1A1A2E] mb-2 group-hover:text-[#00B894] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-[13px] text-[#718096] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold text-[#00846A]">
                  <span>Explore module</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
