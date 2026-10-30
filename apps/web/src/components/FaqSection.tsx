'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Search, ArrowRight } from 'lucide-react';
import { getFaq, FaqItem } from '@/lib/api';

export function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaq, setActiveFaq] = useState<string | null>('faq-1');

  useEffect(() => {
    getFaq().then(setFaqs);
  }, []);

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section id="faq" aria-labelledby="faq-heading" className="section-fluid bg-[#F8FAFC]">
      <div className="container-fluid max-w-[1040px]">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2 block">
            QUESTIONS &amp; ANSWERS
          </span>
          <h2 id="faq-heading" className="fluid-h2 font-bold text-[#1A1A2E] leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="fluid-lead text-[#4A5568] mt-3 max-w-[720px] mx-auto">
            Everything you need to know about GrievEase, automated SLA escalation timers, cash ledger reconciliations, and instant society onboarding.
          </p>
        </div>

        {/* Search Box above FAQ */}
        <div className="relative mb-8">
          <input
            type="search"
            aria-label="Search frequently asked questions"
            placeholder="Search FAQs (e.g. anonymous, SLA, cash ledger, visitor passes)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 text-[15px] bg-white border border-[#E2E8F0] rounded-2xl focus:outline-none focus:border-[#00B894] focus:ring-2 focus:ring-[#00B894]/20 text-[#1A1A2E] placeholder-[#94A3B8] transition-all shadow-2xs"
          />
          <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Accordion List */}
        <div className="divide-y divide-[#E2E8F0] bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E8F0]/80 shadow-2xs">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = activeFaq === faq.id;
              return (
                <div key={faq.id} className="py-5 first:pt-0 last:pb-0">
                  <button
                    id={`faq-btn-${faq.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    onClick={() => setActiveFaq(isOpen ? null : faq.id)}
                    className="w-full flex justify-between items-center text-left gap-4 group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00B894] rounded-lg p-1"
                  >
                    <span className="text-[17px] sm:text-[18px] font-semibold text-[#1A1A2E] group-hover:text-[#00846A] transition-colors leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`w-8 h-8 rounded-full border border-[#E2E8F0] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'rotate-180 bg-[#00B894]/10 text-[#00846A] border-[#00B894]/30'
                          : 'text-[#718096]'
                      }`}
                      aria-hidden="true"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      id={`faq-answer-${faq.id}`}
                      role="region"
                      aria-labelledby={`faq-btn-${faq.id}`}
                      className="overflow-hidden animate-fade-in"
                    >
                      <p className="text-[15px] text-[#4A5568] leading-relaxed pt-3 pr-6">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-base text-[#718096]">
              No questions matched &ldquo;{searchQuery}&rdquo;. Try another keyword or reach out directly!
            </div>
          )}
        </div>

        {/* View all FAQs Footer Link */}
        <div className="mt-10 text-center pt-6">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-base font-bold text-[#00846A] hover:text-[#00B894] hover:underline"
          >
            <span>View all FAQs &amp; Help Center</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
