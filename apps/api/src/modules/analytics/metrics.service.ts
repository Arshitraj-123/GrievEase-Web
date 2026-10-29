import { Injectable } from '@nestjs/common';
import { ResolverPerformanceLabel } from '@grievease/contracts';

export interface PendingInfoInterval {
  start: Date;
  end: Date;
}

export interface WorkingDayConfig {
  weekday: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  startTime: string; // HH:mm (e.g. "09:00")
  endTime: string; // HH:mm (e.g. "18:00")
  enabled: boolean;
}

export interface SuppressedCell<T> {
  item: T;
  count: number;
  isSuppressed: boolean;
  displayValue: string;
}

@Injectable()
export class MetricsService {
  /**
   * Convert UTC Date to canonical YYYY-MM-DD string in target timezone (default Asia/Kolkata).
   */
  toTimezoneDateString(date: Date, timezone: string = 'Asia/Kolkata'): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // 'YYYY-MM-DD'
  }

  /**
   * Convert Date to hour in target timezone (0-23).
   */
  toTimezoneHour(date: Date, timezone: string = 'Asia/Kolkata'): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(formatter.format(date), 10);
  }

  /**
   * Calculate net resolution minutes strictly deducting time spent in PENDING_INFO status.
   * If working hours are enabled and configured, only elapsed minutes within active working windows are counted.
   */
  calculateNetResolutionMinutes(
    createdAt: Date,
    resolvedAt: Date,
    pendingIntervals: PendingInfoInterval[] = [],
    workingHours?: WorkingDayConfig[],
    timezone: string = 'Asia/Kolkata'
  ): number {
    if (resolvedAt <= createdAt) return 0;

    // If working hours are provided and not all 24x7, calculate minute-by-minute or windowed
    const hasWorkingHours = workingHours && workingHours.length > 0 && workingHours.some((w) => !w.enabled || w.startTime !== '00:00' || w.endTime !== '23:59');

    if (!hasWorkingHours) {
      // 24x7 continuous calculation
      let totalMs = resolvedAt.getTime() - createdAt.getTime();

      // Deduct non-overlapping pending info intervals
      for (const interval of pendingIntervals) {
        const intervalStart = Math.max(createdAt.getTime(), interval.start.getTime());
        const intervalEnd = Math.min(resolvedAt.getTime(), interval.end.getTime());
        if (intervalEnd > intervalStart) {
          totalMs -= (intervalEnd - intervalStart);
        }
      }

      return Math.max(0, Math.round(totalMs / (1000 * 60)));
    }

    // Working hours aware calculation
    const workingHoursMap = new Map<number, WorkingDayConfig>();
    for (const w of workingHours!) {
      workingHoursMap.set(w.weekday, w);
    }

    let validMinutes = 0;
    const current = new Date(createdAt.getTime());

    // Advance minute by minute (clamped for performance up to 45 days)
    const maxMinutes = 45 * 24 * 60;
    let stepCount = 0;

    while (current < resolvedAt && stepCount < maxMinutes) {
      stepCount++;
      const currentMs = current.getTime();

      // Check if current minute falls inside any PENDING_INFO pause
      const isPaused = pendingIntervals.some(
        (int) => currentMs >= int.start.getTime() && currentMs < int.end.getTime()
      );

      if (!isPaused) {
        // Evaluate weekday and time in society timezone
        const dateParts = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          weekday: 'short',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
        }).formatToParts(current);

        const weekdayStr = dateParts.find((p) => p.type === 'weekday')?.value;
        const hour = parseInt(dateParts.find((p) => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(dateParts.find((p) => p.type === 'minute')?.value || '0', 10);

        const weekdayNum = this.weekdayNameToNumber(weekdayStr);
        const config = workingHoursMap.get(weekdayNum);

        if (config && config.enabled) {
          const partsStart = (config.startTime || '00:00').split(':').map(Number);
          const partsEnd = (config.endTime || '23:59').split(':').map(Number);
          const startH = partsStart[0] ?? 0;
          const startM = partsStart[1] ?? 0;
          const endH = partsEnd[0] ?? 23;
          const endM = partsEnd[1] ?? 59;
          const currentTotalM = hour * 60 + minute;
          const startTotalM = startH * 60 + startM;
          const endTotalM = endH * 60 + endM;

          if (currentTotalM >= startTotalM && currentTotalM < endTotalM) {
            validMinutes++;
          }
        }
      }

      current.setMinutes(current.getMinutes() + 1);
    }

    return validMinutes;
  }

  private weekdayNameToNumber(name?: string): number {
    switch (name) {
      case 'Sun': return 0;
      case 'Mon': return 1;
      case 'Tue': return 2;
      case 'Wed': return 3;
      case 'Thu': return 4;
      case 'Fri': return 5;
      case 'Sat': return 6;
      default: return 1;
    }
  }

  /**
   * Determine Aging Bucket for an open ticket:
   * 0-1 days: age <= 24 hours
   * 1-3 days: 24h < age <= 72h
   * 3-7 days: 72h < age <= 168h
   * 7+ days: age > 168 hours
   */
  calculateAgingBucket(createdAt: Date, now: Date = new Date()): '0-1' | '1-3' | '3-7' | '7+' {
    const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    if (diffHours <= 24) return '0-1';
    if (diffHours <= 72) return '1-3';
    if (diffHours <= 168) return '3-7';
    return '7+';
  }

  /**
   * Small-number suppression with complementary suppression.
   * Any cell with 1 <= count < minCellSize is suppressed to "<5".
   * If exactly one cell in a group is suppressed and the group total is known,
   * the second smallest item is also suppressed to prevent back-calculation.
   */
  applySmallNumberSuppression<T>(
    items: { item: T; count: number }[],
    minCellSize: number = 5
  ): {
    suppressedCells: SuppressedCell<T>[];
    anySuppressed: boolean;
  } {
    if (items.length === 0) {
      return { suppressedCells: [], anySuppressed: false };
    }

    const results: SuppressedCell<T>[] = items.map((entry) => {
      const isBelowThreshold = entry.count > 0 && entry.count < minCellSize;
      return {
        item: entry.item,
        count: entry.count,
        isSuppressed: isBelowThreshold,
        displayValue: isBelowThreshold ? `<${minCellSize}` : String(entry.count),
      };
    });

    const suppressedCount = results.filter((r) => r.isSuppressed).length;

    // Complementary suppression: if exactly 1 item is suppressed and there are >= 2 items
    if (suppressedCount === 1 && results.length >= 2) {
      // Find the lowest non-suppressed positive item to complementary-suppress
      let secondLowestIdx = -1;
      let minCount = Infinity;

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        if (item && !item.isSuppressed && item.count > 0 && item.count < minCount) {
          minCount = item.count;
          secondLowestIdx = i;
        }
      }

      if (secondLowestIdx !== -1 && results[secondLowestIdx]) {
        results[secondLowestIdx]!.isSuppressed = true;
        results[secondLowestIdx]!.displayValue = `<${minCellSize}`;
      }
    }

    const anySuppressed = results.some((r) => r.isSuppressed);
    return { suppressedCells: results, anySuppressed };
  }

  /**
   * Fair Resolver Performance Evaluation
   * Enforces minimum sample size (N >= 5 closed items) and volume normalization.
   */
  evaluateResolverPerformance(
    closedCount: number,
    breachesWhileAssigned: number,
    thresholds: { excellent: number; onTrack: number } = { excellent: 90, onTrack: 75 }
  ): {
    label: ResolverPerformanceLabel;
    slaHitRate: number | null;
    isSampleSizeSufficient: boolean;
  } {
    if (closedCount < 5) {
      return {
        label: 'Not enough data (<5 closed)',
        slaHitRate: null,
        isSampleSizeSufficient: false,
      };
    }

    // SLA Hit Rate: percentage of closed items that did NOT breach while assigned
    const hits = Math.max(0, closedCount - breachesWhileAssigned);
    const slaHitRate = Math.min(100, Math.max(0, Math.round((hits / closedCount) * 100)));

    let label: ResolverPerformanceLabel = 'Needs support';
    if (slaHitRate >= thresholds.excellent) {
      label = 'Excellent';
    } else if (slaHitRate >= thresholds.onTrack) {
      label = 'On track';
    }

    return {
      label,
      slaHitRate,
      isSampleSizeSufficient: true,
    };
  }

  /**
   * Filter recurring issues: Category + Area Tag with >= 3 distinct complaints in 30 days.
   * Strictly returns categoryName + areaTagName + count (Zero PII).
   */
  filterRecurringIssues(
    issues: { categoryName: string; areaTagName: string; count: number }[]
  ): { categoryName: string; areaTagName: string; count: number }[] {
    return issues
      .filter((i) => i.count >= 3)
      .sort((a, b) => b.count - a.count);
  }
}
