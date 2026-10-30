'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { ctaContent } from '@/content/cta';
import { siteConfig } from '@/config/site';

export function FinalCta() {
  const flags = siteConfig.featureFlags;

  const visibleGuarantees = ctaContent.guarantees.filter(
    (g) => flags.trustGuarantees[g.key] === true
  );

  const descriptionCopy = flags.showResidentCountClaim
    ? ctaContent.residentCountClaim
    : ctaContent.residentCountClaimGeneral;

  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="section-fluid bg-gradient-to-r from-[#00A383] to-[#00846A] text-white text-center relative overflow-hidden"
    >
      <div className="container-fluid max-w-[1040px] relative z-10">
        <h2 id="cta-heading" className="fluid-h2 font-extrabold leading-tight mb-4">
          {ctaContent.heading}
        </h2>
        <p className="fluid-lead text-white/95 leading-relaxed max-w-[700px] mx-auto mb-10">
          {descriptionCopy}
        </p>

        {/* CTA Buttons Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
          <Link
            href={ctaContent.buttonJoin.href}
            className="h-[56px] px-8 rounded-full bg-white text-[#006653] hover:text-[#004D3F] text-[17px] font-bold shadow-[0_8px_25px_rgba(0,0,0,0.18)] hover:bg-[#F8FAFC] hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center gap-2"
          >
            <span>{ctaContent.buttonJoin.label}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href={ctaContent.buttonDemo.href}
            className="h-[56px] px-8 rounded-full bg-black/20 hover:bg-black/30 border-2 border-white/80 text-white text-[17px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center"
          >
            {ctaContent.buttonDemo.label}
          </Link>
        </div>

        {/* Trust Guarantees: Config-driven */}
        {visibleGuarantees.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-8 text-[14px] text-white/95 font-medium">
            {visibleGuarantees.map((item) => (
              <span key={item.key} className="flex items-center gap-2">
                <Check className="w-4.5 h-4.5 text-emerald-200 stroke-[3]" />
                <span>{item.label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
