import React from 'react';
import type { Metadata } from 'next';
import { Hero } from '@/components/Hero';
import { ValueStrip } from '@/components/ValueStrip';
import { ProblemVsSolution } from '@/components/ProblemVsSolution';
import { KeyFeatures } from '@/components/KeyFeatures';
import { HowItWorks } from '@/components/HowItWorks';
import { Escalation } from '@/components/Escalation';
import { Differentiators } from '@/components/Differentiators';
import { Ecosystem } from '@/components/Ecosystem';
import { TransparencyDashboardPreview } from '@/components/TransparencyDashboardPreview';
import { RoleTabs } from '@/components/RoleTabs';
import { ImpactStats } from '@/components/ImpactStats';
import { Testimonials } from '@/components/Testimonials';
import { DownloadApp } from '@/components/DownloadApp';
import { FaqSection } from '@/components/FaqSection';
import { FinalCta } from '@/components/FinalCta';
import faqMock from '@/mocks/faq.json';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'GrievEase — Smarter Communities, Happier Living',
  description:
    'Society grievance and community management platform. Auto-escalation with strict SLAs (48h/72h/96h/120h), immutable audit trail, anonymous complaints, and live transparency dashboards.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  // Generate FAQPage JSON-LD
  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqMock.slice(0, 8).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text:
          faq.answer === 'USE_CONFIG_PRICING' ? siteConfig.pricingCopy : faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* 2. Hero */}
      <Hero />

      {/* 3. Value strip (keep the existing 4 items) */}
      <ValueStrip />

      {/* 4. Problem vs Solution (NEW) */}
      <ProblemVsSolution />

      {/* 5. Key Features (keep, fix icons) */}
      <KeyFeatures />

      {/* 6. How It Works (keep) */}
      <HowItWorks />

      {/* 7. Escalation (keep, fix copy) */}
      <Escalation />

      {/* 8. Differentiators (NEW): Anonymous complaints, Immutable audit trail, Real-time updates, Resolver performance */}
      <Differentiators />

      {/* 9. Ecosystem (keep, extend to 8 cards) */}
      <Ecosystem />

      {/* 10. Live Transparency Dashboard preview (NEW) */}
      <TransparencyDashboardPreview />

      {/* 11. Role tabs (NEW) */}
      <RoleTabs />

      {/* 12. Impact stats (keep, make data driven) */}
      <ImpactStats />

      {/* 13. Testimonials (NEW) */}
      <Testimonials />

      {/* 14. Download App (keep, fix) */}
      <DownloadApp />

      {/* 15. FAQ (expand) */}
      <FaqSection />

      {/* 16. Final CTA */}
      <FinalCta />
    </>
  );
}
