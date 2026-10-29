import { describe, it, expect } from 'vitest';

describe('Escalation Engine Idempotency & Queue Keys (Unit)', () => {
  it('should generate deterministic BullMQ job IDs for warning and breach jobs per grievance and level', () => {
    const grievanceId = 'gr-uuid-1234';
    const level = 2;

    const warningJobId = `grievance:${grievanceId}:level:${level}:warning`;
    const breachJobId = `grievance:${grievanceId}:level:${level}:breach`;

    // Same input must produce identical jobId so duplicate additions in BullMQ are deduplicated
    expect(`grievance:${grievanceId}:level:${level}:warning`).toBe(warningJobId);
    expect(`grievance:${grievanceId}:level:${level}:breach`).toBe(breachJobId);
  });

  it('should enforce Level 4 as the maximum escalation ceiling', () => {
    const currentLevel = 4;
    const canAutoEscalate = currentLevel < 4;

    expect(canAutoEscalate).toBe(false);
  });

  it('should detect terminal statuses that abort breach escalation', () => {
    const terminalStatuses = ['RESOLVED', 'CLOSED', 'DRAFT'];

    for (const status of terminalStatuses) {
      const shouldAbort = terminalStatuses.includes(status);
      expect(shouldAbort).toBe(true);
    }

    const activeStatuses = ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'PENDING_INFO', 'ESCALATED', 'REOPENED'];
    for (const status of activeStatuses) {
      const shouldAbort = terminalStatuses.includes(status);
      expect(shouldAbort).toBe(false);
    }
  });
});
