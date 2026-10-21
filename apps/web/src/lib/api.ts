import statsMock from '@/mocks/stats.json';
import dashboardMock from '@/mocks/dashboard.json';
import faqMock from '@/mocks/faq.json';
import testimonialsMock from '@/mocks/testimonials.json';
import { siteConfig } from '@/config/site';

export interface PublicStats {
  issuesResolvedThisMonth: number;
  avgResolutionDays: number;
  residentSatisfactionPct: number;
  activeResidents: number;
  updatedAt: string;
}

export interface DemoDashboard {
  society: {
    name: string;
    slug: string;
    units: number;
    location: string;
  };
  metrics: {
    totalComplaints: number;
    resolvedComplaints: number;
    inProgress: number;
    escalated: number;
    slaAdherencePct: number;
    satisfactionScore: number;
    satisfactionPct: number;
  };
  categoryBreakdown: {
    category: string;
    total: number;
    resolved: number;
    avgHours: number;
  }[];
  escalationLevelTimes: {
    level: string;
    slaHours: number;
    avgResolveHours: number;
    resolvedPct: number;
  }[];
  recentResolutions: {
    id: string;
    title: string;
    category: string;
    resolvedAt: string;
    turnaround: string;
    status: string;
    level: string;
  }[];
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  flat: string;
  society: string;
  rating: number;
  quote: string;
  sample: boolean;
}

/**
 * Fetch public impact statistics.
 * In production: GET /public/stats (Next revalidate: 60s)
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  if (!siteConfig.featureFlags.showImpactStats) {
    return null;
  }

  // TODO: Swap to real backend API:
  // const res = await fetch(`${process.env.API_BASE_URL || ''}/public/stats`, {
  //   next: { revalidate: 60 }
  // });
  // if (!res.ok) return null;
  // return res.json();

  try {
    return statsMock as PublicStats;
  } catch (error) {
    console.error('Failed to load public stats:', error);
    return null;
  }
}

/**
 * Fetch transparency dashboard data for a given society slug.
 * In production: GET /public/society/:slug/dashboard
 */
export async function getDemoDashboard(slug: string = 'demo'): Promise<DemoDashboard> {
  // TODO: Swap to real backend API:
  // const res = await fetch(`${process.env.API_BASE_URL || ''}/public/society/${slug}/dashboard`, {
  //   next: { revalidate: 30 }
  // });
  // return res.json();

  return dashboardMock as DemoDashboard;
}

/**
 * Fetch FAQ items with config-driven pricing copy replacement.
 * In production: GET /public/faq
 */
export async function getFaq(): Promise<FaqItem[]> {
  // TODO: Swap to real backend API:
  // const res = await fetch(`${process.env.API_BASE_URL || ''}/public/faq`);
  // const data = await res.json();

  return faqMock.map((item) => ({
    ...item,
    answer:
      item.answer === 'USE_CONFIG_PRICING' ? siteConfig.pricingCopy : item.answer,
  }));
}

/**
 * Fetch approved testimonials.
 * In production: GET /public/testimonials
 */
export async function getTestimonials(): Promise<TestimonialItem[]> {
  if (!siteConfig.featureFlags.showTestimonials) {
    return [];
  }

  // TODO: Swap to real backend API:
  // const res = await fetch(`${process.env.API_BASE_URL || ''}/public/testimonials`);
  // return res.json();

  return testimonialsMock as TestimonialItem[];
}
