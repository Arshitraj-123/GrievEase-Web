import { describe, it, expect } from 'vitest';
import { computeSlaDueAt, WorkingHoursDay } from '../../src/modules/grievances/sla-calculator';

describe('SLA Calculator (Unit)', () => {
  it('should compute exact 24x7 deadline when working hours are disabled', () => {
    const start = new Date('2026-03-01T10:00:00.000Z');
    const hours = 48; // 2 days
    const due = computeSlaDueAt(start, hours, []);

    expect(due.toISOString()).toBe('2026-03-03T10:00:00.000Z');
  });

  it('should account for paused intervals in 24x7 mode', () => {
    const start = new Date('2026-03-01T10:00:00.000Z');
    const hours = 24;
    const pausedMs = 4 * 60 * 60 * 1000; // 4 hours paused in PENDING_INFO
    const due = computeSlaDueAt(start, hours, [], pausedMs);

    // 24h + 4h = 28h later
    expect(due.toISOString()).toBe('2026-03-02T14:00:00.000Z');
  });

  it('should skip non-working hours and weekends when working hours are active', () => {
    // Mon-Fri: 09:00 to 17:00 (8 hours per day). Weekends disabled.
    const workingHours: WorkingHoursDay[] = [
      { weekday: 0, startTime: '09:00', endTime: '17:00', enabled: false }, // Sun
      { weekday: 1, startTime: '09:00', endTime: '17:00', enabled: true },  // Mon
      { weekday: 2, startTime: '09:00', endTime: '17:00', enabled: true },  // Tue
      { weekday: 3, startTime: '09:00', endTime: '17:00', enabled: true },  // Wed
      { weekday: 4, startTime: '09:00', endTime: '17:00', enabled: true },  // Thu
      { weekday: 5, startTime: '09:00', endTime: '17:00', enabled: true },  // Fri
      { weekday: 6, startTime: '09:00', endTime: '17:00', enabled: false }, // Sat
    ];

    // Friday at 16:00. SLA is 2 hours.
    // 1 hour consumed Friday (16:00 -> 17:00).
    // Saturday and Sunday are skipped.
    // Remaining 1 hour starts Monday 09:00 -> deadline Monday 10:00.
    const friday = new Date(2026, 2, 6, 16, 0, 0); // Local time
    const due = computeSlaDueAt(friday, 2, workingHours);

    expect(due.getDay()).toBe(1); // Monday
    expect(due.getHours()).toBe(10);
    expect(due.getMinutes()).toBe(0);
  });
});
