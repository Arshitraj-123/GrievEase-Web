'use client';

import React from 'react';
import { Zap, Eye, MessageCircle, Users } from 'lucide-react';

export function ValueStrip() {
  const items = [
    {
      icon: Zap,
      title: 'Faster Resolution',
      subtitle: 'For Every Issue',
      color: 'text-[#00846A]',
      bg: 'bg-[#00B894]/10',
    },
    {
      icon: Eye,
      title: 'Transparent',
      subtitle: 'Tracking System',
      color: 'text-[#3B82F6]',
      bg: 'bg-[#3B82F6]/10',
    },
    {
      icon: MessageCircle,
      title: 'Better Communication',
      subtitle: 'Among Residents',
      color: 'text-[#8B5CF6]',
      bg: 'bg-[#8B5CF6]/10',
    },
    {
      icon: Users,
      title: 'Smarter Community',
      subtitle: 'Management',
      color: 'text-[#10B981]',
      bg: 'bg-[#10B981]/10',
    },
  ];

  return (
    <section
      aria-label="Core GrievEase Values"
      className="py-10 px-6 lg:px-12 bg-[#F8FAFC] border-y border-[#E2E8F0]/80"
    >
      <div className="container-fluid">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0]/60 shadow-2xs hover:shadow-xs hover:border-[#00B894]/40 transition-all"
              >
                <div
                  className={`w-13 h-13 rounded-xl ${item.bg} flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <div className="text-[15px] sm:text-[16px] font-bold text-[#1A1A2E] leading-snug">
                    {item.title}
                  </div>
                  <div className="text-[13px] text-[#718096] font-medium">{item.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
