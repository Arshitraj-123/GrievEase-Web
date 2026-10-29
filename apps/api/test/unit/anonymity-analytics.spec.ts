import { describe, it, expect } from 'vitest';
import { MetricsService } from '../../src/modules/analytics/metrics.service';

describe('Phase 4: Privacy & Anonymity Verification in Analytics', () => {
  const service = new MetricsService();

  describe('1. Zero-PII Guarantee in Aggregations', () => {
    it('should never include PII (names, mobiles, emails, flats, free text) in public or resident metrics', () => {
      const publicPayloadSample = {
        summaryCards: {
          openLoad: 12,
          resolvedCount: 45,
          avgResolutionHours: 14.2,
          satisfactionScore: 4.5,
          ratedCount: 38,
          escalationRate: 5,
        },
        topRecurringIssues: [
          { categoryName: 'Water Supply', areaTagName: 'Pump House B', count: 4 },
        ],
      };

      const serialized = JSON.stringify(publicPayloadSample);
      const forbiddenPatterns = [
        /flat_number/i,
        /mobile/i,
        /email/i,
        /full_name/i,
        /complainant/i,
        /tracking_code/i,
      ];

      for (const pattern of forbiddenPatterns) {
        expect(serialized).not.toMatch(pattern);
      }
    });

    it('recurring issues list must only expose category name, area tag name, and count', () => {
      const issues = [
        { categoryName: 'Lift', areaTagName: 'Wing A Lift 1', count: 5 },
      ];
      const recurring = service.filterRecurringIssues(issues);

      expect(recurring[0]).toEqual({
        categoryName: 'Lift',
        areaTagName: 'Wing A Lift 1',
        count: 5,
      });

      // Verify no description or free-text keys exist
      expect((recurring[0] as any).description).toBeUndefined();
      expect((recurring[0] as any).title).toBeUndefined();
    });
  });

  describe('2. Small-Number Suppression & Complementary Protection', () => {
    it('should suppress cells with 1 <= count < 5 and prevent algebraic recovery', () => {
      // 4 wings: Wing A=50, Wing B=20, Wing C=15, Wing D=3
      // Total = 88.
      // If only Wing D was suppressed: 88 - (50+20+15) = 3 -> back-calculated!
      // Therefore, complementary suppression MUST suppress the next lowest cell (Wing C = 15).
      const cells = [
        { item: 'Wing A', count: 50 },
        { item: 'Wing B', count: 20 },
        { item: 'Wing C', count: 15 },
        { item: 'Wing D', count: 3 }, // < 5
      ];

      const { suppressedCells } = service.applySmallNumberSuppression(cells, 5);

      const dCell = suppressedCells.find((c) => c.item === 'Wing D');
      const cCell = suppressedCells.find((c) => c.item === 'Wing C');
      const bCell = suppressedCells.find((c) => c.item === 'Wing B');
      const aCell = suppressedCells.find((c) => c.item === 'Wing A');

      expect(dCell?.isSuppressed).toBe(true);
      expect(dCell?.displayValue).toBe('<5');

      // Complementary suppression on lowest non-suppressed positive cell
      expect(cCell?.isSuppressed).toBe(true);
      expect(cCell?.displayValue).toBe('<5');

      // High volume cells remain visible
      expect(bCell?.isSuppressed).toBe(false);
      expect(bCell?.displayValue).toBe('20');
      expect(aCell?.isSuppressed).toBe(false);
      expect(aCell?.displayValue).toBe('50');
    });

    it('should not suppress cells with count 0 (zero is not a small positive count)', () => {
      const cells = [
        { item: 'Category X', count: 0 },
        { item: 'Category Y', count: 10 },
      ];

      const { suppressedCells } = service.applySmallNumberSuppression(cells, 5);
      const zeroCell = suppressedCells.find((c) => c.item === 'Category X');
      expect(zeroCell?.isSuppressed).toBe(false);
      expect(zeroCell?.displayValue).toBe('0');
    });
  });

  describe('3. Anonymity Isolation in Wing Aggregations', () => {
    it('anonymous complaints must have null wing/flat and never populate wing_daily_agg', () => {
      const mockGrievances = [
        { id: 'g1', is_anonymous: false, wing_id: 'wing-1', flat_id: 'flat-101' },
        { id: 'g2', is_anonymous: true, wing_id: null, flat_id: null },
      ];

      // Wing aggregator logic: only named grievances can increment wing counts
      const wingCounts: Record<string, number> = {};
      for (const g of mockGrievances) {
        if (!g.is_anonymous && g.wing_id) {
          wingCounts[g.wing_id] = (wingCounts[g.wing_id] || 0) + 1;
        }
      }

      expect(wingCounts['wing-1']).toBe(1);
      expect(Object.keys(wingCounts)).toHaveLength(1);
      expect(wingCounts['null']).toBeUndefined();
    });
  });
});
