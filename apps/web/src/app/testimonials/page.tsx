import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Star, ArrowRight } from 'lucide-react';
import { testimonialsContent } from '@/content/testimonials';

export const metadata: Metadata = {
  title: 'Resident & Committee Testimonials — GrievEase',
  description:
    'Read real reviews and feedback from residents, secretaries, and committee chairs across Indian gated communities using GrievEase.',
  alternates: {
    canonical: '/testimonials',
  },
};

export default function TestimonialsPage() {
  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[700px] mx-auto mb-16">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            COMMUNITY STORIES
          </span>
          <h1 className="text-[36px] sm:text-[44px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Trusted by Residents and Housing Societies
          </h1>
          <p className="text-[16px] text-[#4A5568]">
            See how switching to automated SLAs and transparent resolution transformed daily living
            for communities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {testimonialsContent.items.map((item) => (
            <div
              key={item.id}
              className="bg-[#F8FAFC] rounded-3xl p-8 border border-[#E2E8F0] shadow-sm hover:border-[#00B894]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex gap-1 text-[#F59E0B] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <blockquote className="text-sm text-[#1A1A2E] leading-relaxed italic mb-6">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
              </div>

              <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00B894] to-[#00D4AA] text-white flex items-center justify-center font-bold text-xs">
                    {item.initials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1A1A2E]">{item.name}</div>
                    <div className="text-[11px] text-[#718096]">
                      {item.role} • {item.society}
                    </div>
                  </div>
                </div>

                {item.sample && (
                  <span className="text-[9px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                    Sample
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[#F0FAF7] rounded-3xl p-8 text-center max-w-2xl mx-auto border border-[#B0EBDC]/60">
          <h3 className="text-xl font-bold text-[#1A1A2E] mb-2">
            Ready to upgrade your residential society?
          </h3>
          <p className="text-xs text-[#4A5568] mb-6">
            Join forward-thinking societies bringing peace, speed, and accountability to grievance management.
          </p>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Get Started for Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
