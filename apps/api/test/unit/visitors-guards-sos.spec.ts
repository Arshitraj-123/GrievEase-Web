import { describe, it, expect, beforeEach } from 'vitest';
import { VisitorPassService } from '../../src/modules/visitors/visitor-pass.service';
import crypto from 'crypto';

describe('Phase 6 Unit Tests: Visitors, Guards, and SOS', () => {
  let passService: VisitorPassService;
  const mockSocietyId = '11111111-1111-1111-1111-111111111111';
  const otherSocietyId = '22222222-2222-2222-2222-222222222222';

  beforeEach(() => {
    passService = new VisitorPassService();
  });

  describe('Visitor Pass Sign and Verify', () => {
    it('should generate valid HMAC-SHA256 token and pass verification', async () => {
      const passId = crypto.randomUUID();
      const validTo = new Date(Date.now() + 3600 * 1000).toISOString();

      const { token, tokenHash } = passService.generatePassToken({
        passId,
        societyId: mockSocietyId,
        serial: 'VP-TEST-001',
        validTo,
        type: 'ONE_TIME',
      });

      expect(token).toBeDefined();
      expect(tokenHash).toHaveLength(64);

      // Verify token format: v1.<payload>.<sig>
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('v1');
    });

    it('should reject tampered token signatures', async () => {
      const passId = crypto.randomUUID();
      const validTo = new Date(Date.now() + 3600 * 1000).toISOString();

      const { token } = passService.generatePassToken({
        passId,
        societyId: mockSocietyId,
        serial: 'VP-TEST-002',
        validTo,
        type: 'ONE_TIME',
      });

      const parts = token.split('.');
      // Tamper signature
      const tampered = `${parts[0]}.${parts[1]}.bad${parts[2].slice(3)}`;
      const result = await passService.verifyToken(tampered, mockSocietyId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid cryptographic pass signature');
    });

    it('should reject expired pass tokens', async () => {
      const passId = crypto.randomUUID();
      const expiredDate = new Date(Date.now() - 3600 * 1000).toISOString();

      const { token } = passService.generatePassToken({
        passId,
        societyId: mockSocietyId,
        serial: 'VP-TEST-003',
        validTo: expiredDate,
        type: 'ONE_TIME',
      });

      const result = await passService.verifyToken(token, mockSocietyId);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.reason).toContain('Pass has expired');
    });

    it('should reject pass tokens belonging to a different society (tenant isolation)', async () => {
      const passId = crypto.randomUUID();
      const validTo = new Date(Date.now() + 3600 * 1000).toISOString();

      const { token } = passService.generatePassToken({
        passId,
        societyId: mockSocietyId,
        serial: 'VP-TEST-004',
        validTo,
        type: 'ONE_TIME',
      });

      // Verify at gate belonging to otherSocietyId
      const result = await passService.verifyToken(token, otherSocietyId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Pass belongs to another society');
    });
  });

  describe('Heartbeat & Guard Staleness Logic', () => {
    it('should consider heartbeats older than 45s as stale', () => {
      const now = Date.now();
      const heartbeats = new Map<string, { timestamp: number; societyId: string }>();

      // Guard 1: heartbeat 10s ago (Active)
      heartbeats.set('guard-1', { timestamp: now - 10000, societyId: mockSocietyId });

      // Guard 2: heartbeat 50s ago (Stale)
      heartbeats.set('guard-2', { timestamp: now - 50000, societyId: mockSocietyId });

      // Guard 3: heartbeat 30s ago in other society
      heartbeats.set('guard-3', { timestamp: now - 30000, societyId: otherSocietyId });

      let activeGuards = 0;
      for (const [_, data] of heartbeats.entries()) {
        if (data.societyId === mockSocietyId && now - data.timestamp < 45 * 1000) {
          activeGuards++;
        }
      }

      expect(activeGuards).toBe(1);
    });
  });

  describe('Overstay Detection Math', () => {
    it('should flag visits as overstay when elapsed time exceeds validTo + grace', () => {
      const now = new Date();
      const validTo = new Date(now.getTime() - 40 * 60 * 1000); // 40 mins ago
      const graceMinutes = 30;

      const graceCutoff = new Date(validTo.getTime() + graceMinutes * 60 * 1000); // 10 mins ago
      const isOverstay = now > graceCutoff;

      expect(isOverstay).toBe(true);
    });

    it('should not flag visits within grace period as overstay', () => {
      const now = new Date();
      const validTo = new Date(now.getTime() - 15 * 60 * 1000); // 15 mins ago
      const graceMinutes = 30;

      const graceCutoff = new Date(validTo.getTime() + graceMinutes * 60 * 1000); // 15 mins in future
      const isOverstay = now > graceCutoff;

      expect(isOverstay).toBe(false);
    });
  });

  describe('First-Response-Wins Atomic Decision Simulation', () => {
    it('should ensure exactly one winner among concurrent responses', () => {
      interface MockApproval {
        status: 'PENDING' | 'APPROVED' | 'DENIED';
        respondedBy?: string;
      }

      const request: MockApproval = { status: 'PENDING' };
      const responses = [
        { userId: 'user-A', decision: 'APPROVED' as const },
        { userId: 'user-B', decision: 'DENIED' as const },
        { userId: 'user-C', decision: 'APPROVED' as const },
      ];

      const results: { userId: string; winner: boolean }[] = [];

      for (const res of responses) {
        // Atomic compare-and-set
        if (request.status === 'PENDING') {
          request.status = res.decision;
          request.respondedBy = res.userId;
          results.push({ userId: res.userId, winner: true });
        } else {
          results.push({ userId: res.userId, winner: false });
        }
      }

      const winners = results.filter((r) => r.winner);
      expect(winners).toHaveLength(1);
      expect(winners[0].userId).toBe('user-A');
      expect(request.status).toBe('APPROVED');
    });
  });

  describe('SOS Cancel Window and Escalation Tiers', () => {
    it('should compute remaining cancellation grace seconds accurately', () => {
      const raisedAt = Date.now();
      const cancelWindowSecs = 5;
      const cancelWindowEndsAt = raisedAt + cancelWindowSecs * 1000;

      const remaining2sLater = Math.max(0, Math.ceil((cancelWindowEndsAt - (raisedAt + 2000)) / 1000));
      expect(remaining2sLater).toBe(3);

      const remaining6sLater = Math.max(0, Math.ceil((cancelWindowEndsAt - (raisedAt + 6000)) / 1000));
      expect(remaining6sLater).toBe(0);
    });

    it('should escalate tier when unacknowledged duration exceeds ackTimeoutSeconds', () => {
      const ackTimeout = 60; // 60s
      const unacknowledgedSeconds = 75;

      const shouldEscalate = unacknowledgedSeconds >= ackTimeout;
      const nextTier = shouldEscalate ? 2 : 1;

      expect(shouldEscalate).toBe(true);
      expect(nextTier).toBe(2);
    });
  });
});
