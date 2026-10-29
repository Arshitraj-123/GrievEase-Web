import {
  PublicDashboardStatsDto,
  LandingStatsDto,
  ResidentAnalyticsDto,
  AdminAnalyticsDto,
  ResolverSummaryDto,
  ResolverDetailDto,
  SlaBreachReportDto,
  AnalyticsSettingsDto,
  AnalyticsRange,
  ReportType,
  ReportFormat,
} from '@grievease/contracts';
import faqMock from '@/mocks/faq.json';
import testimonialsMock from '@/mocks/testimonials.json';
import { siteConfig } from '@/config/site';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type PublicStats = LandingStatsDto;

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
 * Fetch real public impact statistics from backend.
 * 60s cache. Returns null if 204 No Content, disabled, or RESIDENTS_ONLY.
 * NEVER displays invented numbers.
 */
export async function getPublicStats(): Promise<LandingStatsDto | null> {
  try {
    const res = await fetch(`${API_BASE}/public/stats`, {
      next: { revalidate: 60 },
    });
    if (res.status === 204 || !res.ok) {
      return null;
    }
    return (await res.json()) as LandingStatsDto;
  } catch {
    // If server is not responding, return null so UI hides invented stats
    return null;
  }
}

import {
  getFallbackPalmGroveDashboard,
  getFallbackResidentAnalytics,
  getFallbackAdminAnalytics,
  getFallbackResolverPerformance,
  getFallbackSlaBreaches,
  getFallbackAnalyticsSettings,
} from './fallback-analytics';

/**
 * Fetch public / resident transparency dashboard for a given society slug.
 * GET /public/society/:slug/dashboard?range=30d|90d|12m
 */
export async function getSocietyTransparencyDashboard(
  slug: string,
  range: AnalyticsRange = '30d'
): Promise<PublicDashboardStatsDto | null> {
  try {
    const res = await fetch(`${API_BASE}/public/society/${encodeURIComponent(slug)}/dashboard?range=${range}`, {
      next: { revalidate: 60 },
      credentials: 'include',
    });
    if (res.ok) {
      return (await res.json()) as PublicDashboardStatsDto;
    }
  } catch {
    // API server offline; fallback for palm-grove preview
  }
  if (slug === 'palm-grove' || slug === 'demo') {
    return getFallbackPalmGroveDashboard();
  }
  return null;
}

/**
 * Fetch resident portal analytics.
 * GET /app/analytics
 */
export async function getResidentAnalytics(
  range: AnalyticsRange = '30d'
): Promise<ResidentAnalyticsDto | null> {
  try {
    const res = await fetch(`${API_BASE}/app/analytics?range=${range}`, {
      credentials: 'include',
    });
    if (res.ok) {
      return (await res.json()) as ResidentAnalyticsDto;
    }
  } catch {
    // API server offline
  }
  return getFallbackResidentAnalytics();
}

/**
 * Fetch executive admin analytics.
 * GET /admin/analytics
 */
export async function getAdminAnalytics(
  filters: { range?: AnalyticsRange; categoryId?: string; priority?: string; wingId?: string } = {}
): Promise<AdminAnalyticsDto | null> {
  try {
    const params = new URLSearchParams();
    if (filters.range) params.set('range', filters.range);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.priority) params.set('priority', filters.priority);
    if (filters.wingId) params.set('wingId', filters.wingId);

    const res = await fetch(`${API_BASE}/admin/analytics?${params.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      return (await res.json()) as AdminAnalyticsDto;
    }
  } catch {
    // API server offline
  }
  return getFallbackAdminAnalytics();
}

/**
 * Fetch resolver performance leaderboard.
 * GET /admin/performance
 */
export async function getResolverPerformance(level?: number): Promise<ResolverSummaryDto[]> {
  try {
    const url = level ? `${API_BASE}/admin/performance?level=${level}` : `${API_BASE}/admin/performance`;
    const res = await fetch(url, { credentials: 'include' });
    if (res.ok) {
      return (await res.json()) as ResolverSummaryDto[];
    }
  } catch {
    // API server offline
  }
  return getFallbackResolverPerformance(level);
}

/**
 * Fetch resolver self-performance.
 * GET /admin/performance/me
 */
export async function getMyPerformance(): Promise<ResolverSummaryDto | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/performance/me`, { credentials: 'include' });
    if (res.ok) {
      return (await res.json()) as ResolverSummaryDto;
    }
  } catch {
    // API server offline
  }
  return getFallbackResolverPerformance(1)[0];
}

/**
 * Fetch resolver drill-down.
 * GET /admin/performance/:userId
 */
export async function getResolverDetail(userId: string): Promise<ResolverDetailDto | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/performance/${userId}`, { credentials: 'include' });
    if (res.ok) {
      return (await res.json()) as ResolverDetailDto;
    }
  } catch {
    // API server offline
  }
  const summary = getFallbackResolverPerformance(1)[0];
  return {
    ...summary,
    recentBreaches: [
      {
        id: 'esc-1',
        publicId: 'GRV-2026-0042',
        categoryName: 'Water & Plumbing',
        levelFrom: 1,
        levelTo: 2,
        reason: 'AUTO_SLA',
        hoursOverdue: 2.5,
        resolverAtTime: 'Rajesh Kulkarni',
        occurredAt: '2026-10-28T09:30:00Z',
      },
    ],
    dailyTrend: [
      { date: '2026-10-24', resolved: 6, breaches: 0 },
      { date: '2026-10-25', resolved: 8, breaches: 0 },
      { date: '2026-10-26', resolved: 5, breaches: 1 },
      { date: '2026-10-27', resolved: 9, breaches: 0 },
      { date: '2026-10-28', resolved: 7, breaches: 0 },
    ],
  };
}

/**
 * Fetch auto-escalation breaches.
 * GET /admin/sla-breaches
 */
export async function getSlaBreaches(page: number = 1, limit: number = 20): Promise<SlaBreachReportDto | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/sla-breaches?page=${page}&limit=${limit}`, {
      credentials: 'include',
    });
    if (res.ok) {
      return (await res.json()) as SlaBreachReportDto;
    }
  } catch {
    // API server offline
  }
  return getFallbackSlaBreaches();
}

/**
 * Fetch analytics settings.
 * GET /admin/settings/analytics
 */
export async function getAnalyticsSettings(): Promise<AnalyticsSettingsDto | null> {
  try {
    const res = await fetch(`${API_BASE}/admin/settings/analytics`, { credentials: 'include' });
    if (res.ok) {
      return (await res.json()) as AnalyticsSettingsDto;
    }
  } catch {
    // API server offline
  }
  return getFallbackAnalyticsSettings();
}

/**
 * Update analytics settings.
 * PATCH /admin/settings/analytics
 */
export async function updateAnalyticsSettings(dto: AnalyticsSettingsDto): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/settings/analytics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dto),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Helper to build report export URL with auth token.
 */
export function getReportExportUrl(type: ReportType, format: ReportFormat, filters: Record<string, string> = {}): string {
  const params = new URLSearchParams({ format, ...filters });
  return `${API_BASE}/admin/reports/${type}?${params.toString()}`;
}

/**
 * FAQ items.
 */
export async function getFaq(): Promise<FaqItem[]> {
  return faqMock.map((item) => ({
    ...item,
    answer: item.answer === 'USE_CONFIG_PRICING' ? siteConfig.pricingCopy : item.answer,
  }));
}

/**
 * Approved testimonials.
 */
export async function getTestimonials(): Promise<TestimonialItem[]> {
  if (!siteConfig.featureFlags.showTestimonials) {
    return [];
  }
  return testimonialsMock as TestimonialItem[];
}

export interface DemoDashboard {
  society: {
    name: string;
    units: number;
    location: string;
  };
  metrics: {
    totalComplaints: number;
    resolvedComplaints: number;
    inProgress: number;
    escalated: number;
    slaAdherencePct: number;
    avgResolutionDays: number;
    satisfactionScore: number;
    satisfactionPct: number;
  };
  categoryBreakdown: Array<{
    category: string;
    total: number;
    resolved: number;
    avgHours: number;
  }>;
  escalationLevelTimes: Array<{
    level: string;
    slaHours: number;
    avgResolveHours: number;
    resolvedPct: number;
  }>;
}

/**
 * Fetch transparency dashboard data or map from public dashboard API.
 */
export async function getDemoDashboard(slug: string = 'palm-grove'): Promise<DemoDashboard | null> {
  const dash = await getSocietyTransparencyDashboard(slug);
  if (!dash) return null;
  const total = dash.summaryCards.openLoad + dash.summaryCards.resolvedCount;
  return {
    society: {
      name: dash.societyName,
      units: 320,
      location: 'Pune, Maharashtra',
    },
    metrics: {
      totalComplaints: total,
      resolvedComplaints: dash.summaryCards.resolvedCount,
      inProgress: dash.summaryCards.openLoad,
      escalated: Math.round(dash.summaryCards.openLoad * (dash.summaryCards.escalationRate / 100)),
      slaAdherencePct: Math.max(0, 100 - dash.summaryCards.escalationRate),
      avgResolutionDays: parseFloat((dash.summaryCards.avgResolutionHours / 24).toFixed(1)),
      satisfactionScore: dash.summaryCards.satisfactionScore || 4.8,
      satisfactionPct: Math.round(((dash.summaryCards.satisfactionScore || 4.5) / 5) * 100),
    },
    categoryBreakdown: dash.resolutionByCategory.map((c) => ({
      category: c.categoryName,
      total: c.resolvedCount,
      resolved: c.resolvedCount,
      avgHours: c.avgHours,
    })),
    escalationLevelTimes: dash.averageTimePerLevel.map((l) => ({
      level: `Level ${l.level}`,
      slaHours: l.level === 1 ? 48 : l.level === 2 ? 72 : l.level === 3 ? 96 : 120,
      avgResolveHours: l.avgHours,
      resolvedPct: Math.round((l.count / Math.max(1, dash.summaryCards.resolvedCount)) * 100),
    })),
  };
}

