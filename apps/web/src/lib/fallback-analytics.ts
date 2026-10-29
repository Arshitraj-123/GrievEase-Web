import {
  PublicDashboardStatsDto,
  ResidentAnalyticsDto,
  AdminAnalyticsDto,
  ResolverSummaryDto,
  SlaBreachReportDto,
  AnalyticsSettingsDto,
} from '@grievease/contracts';

export function getFallbackPalmGroveDashboard(): PublicDashboardStatsDto {
  return {
    societyName: 'Palm Grove Heights CHS',
    societySlug: 'palm-grove',
    summaryCards: {
      openLoad: 14,
      resolvedCount: 382,
      avgResolutionHours: 28.5,
      satisfactionScore: 4.8,
      ratedCount: 264,
      escalationRate: 3.4,
    },
    statusSplit: [
      { status: 'RESOLVED', count: 342 },
      { status: 'CLOSED', count: 40 },
      { status: 'IN_PROGRESS', count: 11 },
      { status: 'SUBMITTED', count: 3 },
    ],
    resolutionByCategory: [
      { categoryId: 'cat-1', categoryName: 'Water & Plumbing', resolvedCount: 142, avgHours: 18.2 },
      { categoryId: 'cat-2', categoryName: 'Electricity & Lift', resolvedCount: 98, avgHours: 12.4 },
      { categoryId: 'cat-3', categoryName: 'Security & Access', resolvedCount: 64, avgHours: 24.1 },
      { categoryId: 'cat-4', categoryName: 'Common Amenities', resolvedCount: 46, avgHours: 36.8 },
      { categoryId: 'cat-5', categoryName: 'Noise & Civics', resolvedCount: 32, avgHours: 42.5 },
    ],
    averageTimePerLevel: [
      { level: 1, avgMinutes: 1240, avgHours: 20.7, count: 280 },
      { level: 2, avgMinutes: 2450, avgHours: 40.8, count: 72 },
      { level: 3, avgMinutes: 4120, avgHours: 68.7, count: 22 },
      { level: 4, avgMinutes: 6200, avgHours: 103.3, count: 8 },
    ],
    satisfaction: {
      score: 4.8,
      count: 264,
      breakdown: [
        { stars: 5, count: 218 },
        { stars: 4, count: 34 },
        { stars: 3, count: 8 },
        { stars: 2, count: 3 },
        { stars: 1, count: 1 },
      ],
    },
    twelveMonthTrend: [
      { month: '2025-11', submitted: 35, resolved: 33 },
      { month: '2025-12', submitted: 42, resolved: 41 },
      { month: '2026-01', submitted: 38, resolved: 36 },
      { month: '2026-02', submitted: 45, resolved: 44 },
      { month: '2026-03', submitted: 51, resolved: 48 },
      { month: '2026-04', submitted: 40, resolved: 39 },
      { month: '2026-05', submitted: 36, resolved: 35 },
      { month: '2026-06', submitted: 48, resolved: 46 },
      { month: '2026-07', submitted: 53, resolved: 50 },
      { month: '2026-08', submitted: 49, resolved: 47 },
      { month: '2026-09', submitted: 44, resolved: 42 },
      { month: '2026-10', submitted: 39, resolved: 38 },
    ],
    topRecurringIssues: [
      { categoryName: 'Water & Plumbing', areaTagName: 'B-Wing Pipe Shaft', count: 5 },
      { categoryName: 'Electricity & Lift', areaTagName: 'Passenger Lift 2', count: 4 },
      { categoryName: 'Security & Access', areaTagName: 'Main Gate Boom Barrier', count: 3 },
    ],
    suppressed: false,
    lastUpdated: new Date().toISOString(),
  };
}

export function getFallbackResidentAnalytics(): ResidentAnalyticsDto {
  const base = getFallbackPalmGroveDashboard();
  return {
    ...base,
    slaComplianceByLevel: [
      { level: 1, complianceRate: 94, totalHandled: 280 },
      { level: 2, complianceRate: 91, totalHandled: 72 },
      { level: 3, complianceRate: 88, totalHandled: 22 },
      { level: 4, complianceRate: 82, totalHandled: 8 },
    ],
  };
}

export function getFallbackAdminAnalytics(): AdminAnalyticsDto {
  return {
    kpis: {
      totalSubmitted: 396,
      openLoad: 14,
      resolvedCount: 382,
      avgResolutionHours: 28.5,
      slaComplianceRate: 93.5,
      satisfactionScore: 4.8,
      appealsCount: 4,
      reopensCount: 9,
    },
    trend: [
      { date: '2026-10-01', submitted: 12, resolved: 11, escalated: 1 },
      { date: '2026-10-08', submitted: 15, resolved: 14, escalated: 0 },
      { date: '2026-10-15', submitted: 10, resolved: 10, escalated: 0 },
      { date: '2026-10-22', submitted: 18, resolved: 16, escalated: 1 },
    ],
    categoryMix: [
      { categoryId: 'cat-1', categoryName: 'Water & Plumbing', count: 142, percentage: 37 },
      { categoryId: 'cat-2', categoryName: 'Electricity & Lift', count: 98, percentage: 26 },
      { categoryId: 'cat-3', categoryName: 'Security & Access', count: 64, percentage: 17 },
      { categoryId: 'cat-4', categoryName: 'Common Amenities', count: 46, percentage: 12 },
      { categoryId: 'cat-5', categoryName: 'Noise & Civics', count: 32, percentage: 8 },
    ],
    priorityMix: [
      { priority: 'LOW', count: 68 },
      { priority: 'MEDIUM', count: 210 },
      { priority: 'HIGH', count: 84 },
      { priority: 'URGENT', count: 20 },
    ],
    agingBuckets: {
      zeroToOneDays: 8,
      oneToThreeDays: 4,
      threeToSevenDays: 2,
      sevenPlusDays: 0,
    },
    wingHeatmap: [
      { wingId: 'w-a', wingName: 'Wing A', categoryId: 'cat-1', categoryName: 'Water & Plumbing', count: 18, isSuppressed: false, displayValue: '18' },
      { wingId: 'w-a', wingName: 'Wing A', categoryId: 'cat-2', categoryName: 'Electricity & Lift', count: 12, isSuppressed: false, displayValue: '12' },
      { wingId: 'w-a', wingName: 'Wing A', categoryId: 'cat-3', categoryName: 'Security & Access', count: 3, isSuppressed: true, displayValue: '<5' },
      { wingId: 'w-b', wingName: 'Wing B', categoryId: 'cat-1', categoryName: 'Water & Plumbing', count: 24, isSuppressed: false, displayValue: '24' },
      { wingId: 'w-b', wingName: 'Wing B', categoryId: 'cat-2', categoryName: 'Electricity & Lift', count: 14, isSuppressed: false, displayValue: '14' },
      { wingId: 'w-b', wingName: 'Wing B', categoryId: 'cat-3', categoryName: 'Security & Access', count: 2, isSuppressed: true, displayValue: '<5' },
      { wingId: 'w-c', wingName: 'Wing C', categoryId: 'cat-1', categoryName: 'Water & Plumbing', count: 11, isSuppressed: false, displayValue: '11' },
      { wingId: 'w-c', wingName: 'Wing C', categoryId: 'cat-2', categoryName: 'Electricity & Lift', count: 4, isSuppressed: true, displayValue: '<5' },
      { wingId: 'w-c', wingName: 'Wing C', categoryId: 'cat-3', categoryName: 'Security & Access', count: 2, isSuppressed: true, displayValue: '<5' },
    ],
    levelFunnel: [
      { level: 1, levelName: 'Level 1: Secretary', enteredCount: 382, resolvedCount: 280, escalatedOutCount: 102, avgMinutes: 1240 },
      { level: 2, levelName: 'Level 2: Committee', enteredCount: 102, resolvedCount: 72, escalatedOutCount: 30, avgMinutes: 2450 },
      { level: 3, levelName: 'Level 3: Chairman', enteredCount: 30, resolvedCount: 22, escalatedOutCount: 8, avgMinutes: 4120 },
      { level: 4, levelName: 'Level 4: Governing Body', enteredCount: 8, resolvedCount: 8, escalatedOutCount: 0, avgMinutes: 6200 },
    ],
    finalLevelOverdue: [],
  };
}

export function getFallbackResolverPerformance(level: number = 1): ResolverSummaryDto[] {
  if (level === 1) {
    return [
      {
        userId: 'usr-sec-1',
        fullName: 'Rajesh Kulkarni',
        level: 1,
        levelName: 'Level 1: Secretary',
        assigned: 185,
        resolved: 178,
        acknowledgedWithinSlaRate: 98,
        avgAckMinutes: 24,
        avgResolutionMinutes: 1180,
        slaHitRate: 96,
        breachesWhileAssigned: 7,
        reopenRate: 2,
        avgRating: 4.9,
        ratingCount: 120,
        currentOpenLoad: 7,
        performanceLabel: 'Excellent',
        isSampleSizeSufficient: true,
      },
      {
        userId: 'usr-sec-2',
        fullName: 'Sunita Deshmukh',
        level: 1,
        levelName: 'Level 1: Secretary',
        assigned: 112,
        resolved: 102,
        acknowledgedWithinSlaRate: 92,
        avgAckMinutes: 45,
        avgResolutionMinutes: 1420,
        slaHitRate: 88,
        breachesWhileAssigned: 10,
        reopenRate: 3,
        avgRating: 4.6,
        ratingCount: 82,
        currentOpenLoad: 10,
        performanceLabel: 'On track',
        isSampleSizeSufficient: true,
      },
      {
        userId: 'usr-sec-3',
        fullName: 'Aniket Verma',
        level: 1,
        levelName: 'Level 1: Secretary',
        assigned: 4,
        resolved: 3,
        acknowledgedWithinSlaRate: 100,
        avgAckMinutes: 18,
        avgResolutionMinutes: 980,
        slaHitRate: null,
        breachesWhileAssigned: 0,
        reopenRate: 0,
        avgRating: null,
        ratingCount: 2,
        currentOpenLoad: 1,
        performanceLabel: 'Not enough data (<5 closed)',
        isSampleSizeSufficient: false,
      },
    ];
  }
  return [
    {
      userId: 'usr-com-1',
      fullName: 'Vikram Mehta',
      level: level,
      levelName: `Level ${level}`,
      assigned: 42,
      resolved: 38,
      acknowledgedWithinSlaRate: 95,
      avgAckMinutes: 60,
      avgResolutionMinutes: 2400,
      slaHitRate: 90,
      breachesWhileAssigned: 4,
      reopenRate: 3,
      avgRating: 4.7,
      ratingCount: 28,
      currentOpenLoad: 4,
      performanceLabel: 'Excellent',
      isSampleSizeSufficient: true,
    },
  ];
}

export function getFallbackSlaBreaches(): SlaBreachReportDto {
  return {
    items: [
      {
        id: 'esc-1',
        publicId: 'GRV-2026-0042',
        categoryName: 'Water & Plumbing',
        levelFrom: 1,
        levelTo: 2,
        reason: 'AUTO_SLA',
        hoursOverdue: 2.5,
        resolverAtTime: 'Sunita Deshmukh',
        occurredAt: '2026-10-28T09:30:00Z',
      },
      {
        id: 'esc-2',
        publicId: 'GRV-2026-0038',
        categoryName: 'Electricity & Lift',
        levelFrom: 2,
        levelTo: 3,
        reason: 'AUTO_SLA',
        hoursOverdue: 4.1,
        resolverAtTime: 'Vikram Mehta',
        occurredAt: '2026-10-27T14:15:00Z',
      },
    ],
    total: 2,
    page: 1,
    limit: 20,
  };
}

export function getFallbackAnalyticsSettings(): AnalyticsSettingsDto {
  return {
    publicDashboardEnabled: true,
    publicDashboardVisibility: 'PUBLIC',
    minCellSize: 5,
    perfThresholdExcellent: 90,
    perfThresholdOnTrack: 75,
  };
}
