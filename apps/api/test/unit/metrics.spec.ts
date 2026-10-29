import { describe, it, expect } from 'vitest';
import { MetricsService, WorkingDayConfig } from '../../src/modules/analytics/metrics.service';

describe('Phase 4: MetricsService Unit Tests (docs/metrics.md reconciliation)', () => {
  const service = new MetricsService();

  describe('1. Timezone & Temporal Bucketing', () => {
    it('should correctly format date in Asia/Kolkata timezone around midnight', () => {
      // 2026-03-01 18:45:00 UTC is 2026-03-02 00:15:00 IST (+5:30)
      const dateUtc = new Date('2026-03-01T18:45:00.000Z');
      const kolkataDate = service.toTimezoneDateString(dateUtc, 'Asia/Kolkata');
      expect(kolkataDate).toBe('2026-03-02');

      // 2026-03-01 18:15:00 UTC is 2026-03-01 23:45:00 IST
      const dateEarlier = new Date('2026-03-01T18:15:00.000Z');
      expect(service.toTimezoneDateString(dateEarlier, 'Asia/Kolkata')).toBe('2026-03-01');
    });
  });

  describe('2. Resolution Duration & PENDING_INFO Deduction', () => {
    it('should calculate net resolution minutes strictly subtracting PENDING_INFO pauses', () => {
      // Created: 10:00, Resolved: 16:00 (Total 360 minutes elapsed)
      const createdAt = new Date('2026-03-01T10:00:00.000Z');
      const resolvedAt = new Date('2026-03-01T16:00:00.000Z');

      // Pending Info from 11:30 to 13:00 (90 minutes paused)
      const pendingIntervals = [
        {
          start: new Date('2026-03-01T11:30:00.000Z'),
          end: new Date('2026-03-01T13:00:00.000Z'),
        },
      ];

      const netMinutes = service.calculateNetResolutionMinutes(createdAt, resolvedAt, pendingIntervals);
      expect(netMinutes).toBe(270); // 360 - 90 = 270
    });

    it('should accurately handle multiple non-contiguous PENDING_INFO intervals', () => {
      const createdAt = new Date('2026-03-01T08:00:00.000Z');
      const resolvedAt = new Date('2026-03-01T12:00:00.000Z'); // 240 mins total

      const pendingIntervals = [
        { start: new Date('2026-03-01T08:30:00.000Z'), end: new Date('2026-03-01T09:00:00.000Z') }, // 30m
        { start: new Date('2026-03-01T10:00:00.000Z'), end: new Date('2026-03-01T11:00:00.000Z') }, // 60m
      ];

      const netMinutes = service.calculateNetResolutionMinutes(createdAt, resolvedAt, pendingIntervals);
      expect(netMinutes).toBe(150); // 240 - 90 = 150
    });

    it('should respect working hours and exclude closed periods', () => {
      // Monday 9:00 to 18:00 UTC working hours
      const workingHours: WorkingDayConfig[] = [
        { weekday: 1, startTime: '09:00', endTime: '17:00', enabled: true }, // 8 hours (480 mins)
        { weekday: 2, startTime: '09:00', endTime: '17:00', enabled: true },
      ];

      // Ticket opened Monday 16:00 UTC, resolved Tuesday 10:00 UTC
      // In Asia/Kolkata: let's test with timezone = 'UTC' for direct hour mapping
      const createdAt = new Date('2026-03-02T16:00:00.000Z'); // Monday 16:00 (1 hour remaining in workday)
      const resolvedAt = new Date('2026-03-03T10:00:00.000Z'); // Tuesday 10:00 (1 hour into workday)

      const netMinutes = service.calculateNetResolutionMinutes(
        createdAt,
        resolvedAt,
        [],
        workingHours,
        'UTC'
      );

      // Should count 60 mins from Monday (16:00 to 17:00) + 60 mins from Tuesday (09:00 to 10:00) = 120 mins
      expect(netMinutes).toBe(120);
    });
  });

  describe('3. Aging Buckets', () => {
    const referenceNow = new Date('2026-03-10T12:00:00.000Z');

    it('should assign 0-1 days for tickets <= 24 hours old', () => {
      const created = new Date('2026-03-10T02:00:00.000Z'); // 10 hours ago
      expect(service.calculateAgingBucket(created, referenceNow)).toBe('0-1');
    });

    it('should assign 1-3 days for tickets between 24 and 72 hours old', () => {
      const created = new Date('2026-03-08T12:00:00.000Z'); // 48 hours ago
      expect(service.calculateAgingBucket(created, referenceNow)).toBe('1-3');
    });

    it('should assign 3-7 days for tickets between 72 and 168 hours old', () => {
      const created = new Date('2026-03-05T12:00:00.000Z'); // 5 days ago (120 hours)
      expect(service.calculateAgingBucket(created, referenceNow)).toBe('3-7');
    });

    it('should assign 7+ days for tickets older than 168 hours', () => {
      const created = new Date('2026-03-01T12:00:00.000Z'); // 9 days ago
      expect(service.calculateAgingBucket(created, referenceNow)).toBe('7+');
    });
  });

  describe('4. Privacy & Small-Number Suppression (with Complementary Suppression)', () => {
    it('should suppress cells with count < MIN_CELL_SIZE (5) to "<5"', () => {
      const items = [
        { item: 'Wing A', count: 12 },
        { item: 'Wing B', count: 3 }, // < 5, suppressed
        { item: 'Wing C', count: 2 }, // < 5, suppressed
        { item: 'Wing D', count: 20 },
      ];

      const { suppressedCells } = service.applySmallNumberSuppression(items, 5);

      expect(suppressedCells.find((c) => c.item === 'Wing A')?.displayValue).toBe('12');
      expect(suppressedCells.find((c) => c.item === 'Wing B')?.displayValue).toBe('<5');
      expect(suppressedCells.find((c) => c.item === 'Wing C')?.displayValue).toBe('<5');
      expect(suppressedCells.find((c) => c.item === 'Wing D')?.displayValue).toBe('20');
    });

    it('should apply complementary suppression when exactly one cell is suppressed', () => {
      const items = [
        { item: 'Plumbing', count: 30 },
        { item: 'Electrical', count: 18 },
        { item: 'Lift', count: 3 }, // Only this 1 cell is < 5
      ];

      const { suppressedCells } = service.applySmallNumberSuppression(items, 5);

      // Lift is suppressed because 3 < 5
      expect(suppressedCells.find((c) => c.item === 'Lift')?.isSuppressed).toBe(true);
      expect(suppressedCells.find((c) => c.item === 'Lift')?.displayValue).toBe('<5');

      // Complementary suppression: Electrical (18) is the lowest among non-suppressed, so it must also be suppressed!
      expect(suppressedCells.find((c) => c.item === 'Electrical')?.isSuppressed).toBe(true);
      expect(suppressedCells.find((c) => c.item === 'Electrical')?.displayValue).toBe('<5');

      // Plumbing (30) remains unsuppressed
      expect(suppressedCells.find((c) => c.item === 'Plumbing')?.isSuppressed).toBe(false);
      expect(suppressedCells.find((c) => c.item === 'Plumbing')?.displayValue).toBe('30');
    });
  });

  describe('5. Resolver Fair Evaluation Rules', () => {
    it('should return "Not enough data (<5 closed)" when resolver has fewer than 5 closed items', () => {
      const result = service.evaluateResolverPerformance(4, 0);
      expect(result.label).toBe('Not enough data (<5 closed)');
      expect(result.slaHitRate).toBeNull();
      expect(result.isSampleSizeSufficient).toBe(false);
    });

    it('should assign "Excellent" for hit rate >= 90% when sample size >= 5', () => {
      // 10 closed, 1 breach -> 9 hits = 90%
      const result = service.evaluateResolverPerformance(10, 1, { excellent: 90, onTrack: 75 });
      expect(result.slaHitRate).toBe(90);
      expect(result.label).toBe('Excellent');
      expect(result.isSampleSizeSufficient).toBe(true);
    });

    it('should assign "On track" for hit rate between 75% and 89%', () => {
      // 10 closed, 2 breaches -> 8 hits = 80%
      const result = service.evaluateResolverPerformance(10, 2, { excellent: 90, onTrack: 75 });
      expect(result.slaHitRate).toBe(80);
      expect(result.label).toBe('On track');
    });

    it('should assign "Needs support" for hit rate < 75%', () => {
      // 10 closed, 4 breaches -> 6 hits = 60%
      const result = service.evaluateResolverPerformance(10, 4, { excellent: 90, onTrack: 75 });
      expect(result.slaHitRate).toBe(60);
      expect(result.label).toBe('Needs support');
    });
  });

  describe('6. Recurring Issue Detection', () => {
    it('should filter combinations with >= 3 occurrences in 30 days and sort descending', () => {
      const candidates = [
        { categoryName: 'Water Supply', areaTagName: 'Block B Pump', count: 5 },
        { categoryName: 'Lift', areaTagName: 'Wing A Lift 2', count: 2 }, // Below 3, ignored
        { categoryName: 'Security', areaTagName: 'Gate 1', count: 3 },
      ];

      const recurring = service.filterRecurringIssues(candidates);
      expect(recurring.length).toBe(2);
      expect(recurring[0].categoryName).toBe('Water Supply');
      expect(recurring[0].count).toBe(5);
      expect(recurring[1].categoryName).toBe('Security');
      expect(recurring[1].count).toBe(3);
    });
  });
});
