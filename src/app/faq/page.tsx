'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, ArrowRight, HelpCircle } from 'lucide-react';
import { getFaq, FaqItem } from '@/lib/api';

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openFaqs, setOpenFaqs] = useState<Record<string, boolean>>({ 'faq-1': true });

  useEffect(() => {
    getFaq().then(setFaqs);
  }, []);

  const categories = ['All', ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="py-16 px-6 lg:px-12 bg-white">
      <div className="max-w-[1000px] mx-auto">
        {/* Header */}
        <div className="text-center max-w-[650px] mx-auto mb-12">
          <span className="text-[12px] font-bold tracking-[1.5px] uppercase text-[#00846A] mb-2.5 block">
            HELP CENTER
          </span>
          <h1 className="text-[34px] sm:text-[44px] font-extrabold text-[#1A1A2E] leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[15.5px] text-[#4A5568]">
            Find comprehensive answers on auto-escalation SLAs, anonymous grievances, visitor passes,
            and society onboarding.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8 relative">
          <input
            type="search"
            placeholder="Search FAQs by topic, keyword, or question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] text-sm focus:outline-none focus:ring-2 focus:ring-[#00B894] shadow-2xs"
          />
          <Search className="w-5 h-5 text-[#94A3B8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-[#00B894] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#4A5568] hover:bg-gray-100 border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion */}
        <div className="bg-[#F8FAFC] rounded-3xl p-6 sm:p-10 border border-[#E2E8F0] shadow-sm divide-y divide-gray-200 mb-14">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = Boolean(openFaqs[faq.id]);
              return (
                <div key={faq.id} className="py-5">
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full flex justify-between items-center text-left gap-4 group cursor-pointer"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00846A] block mb-1">
                        {faq.category}
                      </span>
                      <h2 className="text-[16px] font-bold text-[#1A1A2E] group-hover:text-[#00846A] transition-colors leading-snug">
                        {faq.question}
                      </h2>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-full border border-[#CBD5E1] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 bg-[#00B894]/15 text-[#00846A] border-[#00B894]/40' : 'text-[#718096]'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pt-3 pr-6 text-sm text-[#4A5568] leading-relaxed animate-fade-in">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-sm text-[#718096]">
              No FAQs matched your search. Contact our support desk for personalized assistance!
            </div>
          )}
        </div>

        {/* Contact fallback */}
        <div className="text-center p-8 bg-[#F0FAF7] rounded-3xl border border-[#B0EBDC]/60">
          <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">Still have questions?</h3>
          <p className="text-xs text-[#4A5568] mb-4">
            Our society onboarding specialists are ready to guide your managing committee.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#00B894] hover:bg-[#00A383] text-white text-xs font-semibold shadow-xs"
          >
            <span>Contact Support Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
