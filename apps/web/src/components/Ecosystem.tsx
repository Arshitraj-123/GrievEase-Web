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
      className="section-fluid px-6 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]/80"
    >
      <div className="container-fluid">
        {/* Header */}
        <div className="text-center max-w-[850px] mx-auto mb-14">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            {ecosystemContent.tag}
          </span>
          <h2
            id="ecosystem-heading"
            className="text-[clamp(2rem,1.2rem+2.4vw,3.5rem)] font-extrabold text-[#1A1A2E] leading-tight mb-4"
          >
            {ecosystemContent.heading}
          </h2>
          <p className="text-[clamp(1.0625rem,1rem+0.3125vw,1.125rem)] text-[#4A5568] leading-relaxed">
            {ecosystemContent.subtitle}
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ecosystemContent.cards.map((card) => {
            const Icon = iconMap[card.icon] || Shield;
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group bg-white rounded-3xl p-7 border border-[#E2E8F0]/90 shadow-sm hover:shadow-xl hover:border-[#00B894]/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894]"
              >
                <div>
                  <div className="flex justify-between items-start mb-5">
                    <div
                      className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6" style={{ color: card.color }} />
                    </div>
                    <span className="bg-[#00B894]/10 text-[#00846A] font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wider">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-[clamp(1.15rem,1.1rem+0.2vw,1.3rem)] font-bold text-[#1A1A2E] mb-2 group-hover:text-[#00B894] transition-colors leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-[14px] text-[#718096] leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F1F5F9] flex items-center justify-between text-xs font-bold text-[#00846A]">
                  <span>Explore module</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
