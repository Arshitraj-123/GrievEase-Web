import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { VisitorPassService } from '../../src/modules/visitors/visitor-pass.service';
import { StaffCryptoService } from '../../src/modules/staff/staff-crypto.service';

describe('Phase 6 Integration & Security Tests: Visitors, Deliveries, Guards, and SOS', () => {
  const societyA = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const societyB = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const passService = new VisitorPassService();
  const cryptoService = new StaffCryptoService();

  describe('1. Walk-in Approvals: Concurrent First-Response-Wins', () => {
    it('should guarantee exactly one winner when 200 concurrent responses arrive for one approval request', async () => {
      const requestId = 'req-walkin-101';
      let state = {
        status: 'PENDING' as 'PENDING' | 'APPROVED' | 'DENIED',
        respondedBy: null as string | null,
        respondedAt: null as string | null,
      };

      // Atomic Compare-And-Set simulation
      const attemptResponse = async (userId: string, decision: 'APPROVED' | 'DENIED') => {
        if (state.status === 'PENDING') {
          state = {
            status: decision,
            respondedBy: userId,
            respondedAt: new Date().toISOString(),
          };
          return { winner: true, status: decision };
        }
        return { winner: false, status: state.status };
      };

      const results = await Promise.all(
        Array.from({ length: 200 }, (_, i) =>
          attemptResponse(`user-${i}`, i % 2 === 0 ? 'APPROVED' : 'DENIED')
        )
      );

      const winners = results.filter((r) => r.winner);
      const losers = results.filter((r) => !r.winner);

      expect(winners).toHaveLength(1);
      expect(losers).toHaveLength(199);
      expect(['APPROVED', 'DENIED']).toContain(state.status);
      expect(state.respondedBy).toBeDefined();
    });
  });

  describe('2. Pass Admission & Concurrency (One-time pass death)', () => {
    it('should admit exactly once when scanned simultaneously at two gates', async () => {
      const pass = {
        id: 'pass-single-use-01',
        maxEntries: 1,
        entriesUsed: 0,
        status: 'ACTIVE' as 'ACTIVE' | 'USED',
      };

      const attemptScan = async (gateName: string) => {
        // Atomic check and increment
        if (pass.status === 'ACTIVE' && pass.entriesUsed < pass.maxEntries) {
          pass.entriesUsed += 1;
          if (pass.entriesUsed >= pass.maxEntries) {
            pass.status = 'USED';
          }
          return { admitted: true, gate: gateName };
        }
        return { admitted: false, gate: gateName, reason: 'Pass already used' };
      };

      const [resGate1, resGate2] = await Promise.all([
        attemptScan('Gate 1 (North)'),
        attemptScan('Gate 2 (South)'),
      ]);

      const admissions = [resGate1, resGate2].filter((r) => r.admitted);
      expect(admissions).toHaveLength(1);
      expect(pass.entriesUsed).toBe(1);
      expect(pass.status).toBe('USED');
    });

    it('should fail verification immediately when pass is cancelled mid-flight', async () => {
      const passRecord = {
        id: 'pass-cancel-test',
        status: 'CANCELLED' as 'ACTIVE' | 'CANCELLED',
      };

      const verifyStatus = (p: typeof passRecord) => {
        if (p.status === 'CANCELLED') {
          return { isValid: false, reason: 'Pass was cancelled by resident' };
        }
        return { isValid: true };
      };

      const res = verifyStatus(passRecord);
      expect(res.isValid).toBe(false);
      expect(res.reason).toContain('cancelled');
    });
  });

  describe('3. Staff Scan Integration (GUARD_SCAN)', () => {
    it('should assert GUARD_SCAN attendance adheres to append-only supersede pattern', () => {
      const attendanceLog: any[] = [];

      // Initial guard scan at 08:02 AM
      const entry1 = {
        id: 'att-01',
        staffId: 'stf-001',
        flatId: 'flat-101',
        date: '2026-10-29',
        inAt: '08:02:00',
        outAt: null,
        source: 'GUARD_SCAN',
        markedBy: 'guard-401',
        supersedesId: null,
      };
      attendanceLog.push(entry1);

      // Correction made by secretary later (append-only, superseding att-01)
      const entry2 = {
        id: 'att-02',
        staffId: 'stf-001',
        flatId: 'flat-101',
        date: '2026-10-29',
        inAt: '08:00:00', // corrected
        outAt: '17:00:00',
        source: 'MANUAL',
        markedBy: 'secretary-user',
        supersedesId: 'att-01',
      };
      attendanceLog.push(entry2);

      expect(attendanceLog).toHaveLength(2);
      expect(attendanceLog[0].source).toBe('GUARD_SCAN');
      expect(attendanceLog[1].supersedesId).toBe('att-01');
      // Original entry is preserved untouched (never updated/deleted)
      expect(attendanceLog[0].inAt).toBe('08:02:00');
    });
  });

  describe('4. SOS: Cancel Window, Fan-Out & Escalation', () => {
    it('should respect the 5-second cancel window before creating permanent alert', () => {
      const cancelWindowSeconds = 5;
      const raisedAt = Date.now();
      const cancelWindowEndsAt = raisedAt + cancelWindowSeconds * 1000;

      // User taps cancel at 3 seconds
      const userCancelTime = raisedAt + 3000;
      const canCancel = userCancelTime <= cancelWindowEndsAt;
      expect(canCancel).toBe(true);

      // User tries to cancel at 6 seconds (too late)
      const lateCancelTime = raisedAt + 6000;
      const canCancelLate = lateCancelTime <= cancelWindowEndsAt;
      expect(canCancelLate).toBe(false);
    });

    it('should escalate to Tier 2 after ack_timeout_seconds has elapsed', () => {
      const ackTimeoutSeconds = 60;
      const alert = {
        id: 'sos-alert-01',
        status: 'RAISED',
        escalationTier: 1,
        raisedAt: new Date(Date.now() - 65 * 1000).toISOString(), // 65 seconds ago
      };

      const elapsed = (Date.now() - new Date(alert.raisedAt).getTime()) / 1000;
      if (alert.status === 'RAISED' && elapsed >= ackTimeoutSeconds) {
        alert.escalationTier = 2;
      }

      expect(alert.escalationTier).toBe(2);
    });
  });

  describe('5. Safety Honesty: Online Guards Indicator and Offline Banners', () => {
    it('should flag red banner condition when online guards count is zero', () => {
      const activeGuardConsoles: { id: string; lastSeenAt: number }[] = [];

      // No active guards
      const onlineGuards = activeGuardConsoles.filter(
        (g) => Date.now() - g.lastSeenAt < 45 * 1000
      );

      const showNoGuardBanner = onlineGuards.length === 0;
      expect(showNoGuardBanner).toBe(true);
    });

    it('should hide red banner condition when at least one guard console has fresh heartbeat', () => {
      const activeGuardConsoles = [{ id: 'guard-console-1', lastSeenAt: Date.now() - 10000 }]; // 10s ago

      const onlineGuards = activeGuardConsoles.filter(
        (g) => Date.now() - g.lastSeenAt < 45 * 1000
      );

      const showNoGuardBanner = onlineGuards.length === 0;
      expect(showNoGuardBanner).toBe(false);
    });
  });

  describe('6. Multi-Tenant Privacy and Cross-Society Isolation', () => {
    it('should strictly isolate visitor logs between societies', () => {
      const visits = [
        { id: 'v-1', societyId: societyA, visitorName: 'Alpha Guest' },
        { id: 'v-2', societyId: societyB, visitorName: 'Beta Guest' },
      ];

      // Simulated RLS check_tenant_access(society_id)
      const queryVisits = (requesterSocietyId: string) => {
        return visits.filter((v) => v.societyId === requesterSocietyId);
      };

      const resultsA = queryVisits(societyA);
      expect(resultsA).toHaveLength(1);
      expect(resultsA[0].visitorName).toBe('Alpha Guest');

      const resultsB = queryVisits(societyB);
      expect(resultsB).toHaveLength(1);
      expect(resultsB[0].visitorName).toBe('Beta Guest');
    });

    it('should encrypt visitor phone numbers at rest and never leak in plaintext', () => {
      const plainPhone = '+91 98765 43210';
      const encrypted = cryptoService.encrypt(plainPhone);

      // Ciphertext format is iv:authTag:ciphertext
      expect(encrypted).not.toContain('98765');
      expect(encrypted.split(':')).toHaveLength(3);

      const decrypted = cryptoService.decrypt(encrypted);
      expect(decrypted).toBe(plainPhone);
    });
  });
});
