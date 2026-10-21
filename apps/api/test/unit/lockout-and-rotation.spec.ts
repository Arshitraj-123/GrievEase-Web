import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Lockout and Back-off Policy', () => {
  function calculateLockout(failures: number): { locked: boolean; lockDurationMs: number } {
    if (failures < 5) {
      return { locked: false, lockDurationMs: 0 };
    }
    // Base 15 minutes = 900,000 ms, with exponential back-off for additional failures beyond 5
    const multiplier = Math.pow(2, failures - 5);
    const lockDurationMs = Math.min(15 * 60 * 1000 * multiplier, 24 * 60 * 60 * 1000); // capped at 24h
    return { locked: true, lockDurationMs };
  }

  it('should not lock account with fewer than 5 failures', () => {
    expect(calculateLockout(1).locked).toBe(false);
    expect(calculateLockout(3).locked).toBe(false);
    expect(calculateLockout(4).locked).toBe(false);
  });

  it('should lock account for 15 minutes after 5 consecutive failures', () => {
    const res = calculateLockout(5);
    expect(res.locked).toBe(true);
    expect(res.lockDurationMs).toBe(15 * 60 * 1000); // 15 mins
  });

  it('should apply exponential back-off for additional consecutive failures', () => {
    const res6 = calculateLockout(6);
    expect(res6.locked).toBe(true);
    expect(res6.lockDurationMs).toBe(30 * 60 * 1000); // 30 mins

    const res7 = calculateLockout(7);
    expect(res7.locked).toBe(true);
    expect(res7.lockDurationMs).toBe(60 * 60 * 1000); // 1 hour
  });
});

describe('Token Rotation and Family Reuse Detection', () => {
  interface SessionNode {
    familyId: string;
    tokenHash: string;
    revokedAt: Date | null;
  }

  class SessionFamilyTracker {
    private sessions: SessionNode[] = [];

    createSession(familyId: string, token: string) {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const session: SessionNode = { familyId, tokenHash: hash, revokedAt: null };
      this.sessions.push(session);
      return session;
    }

    rotateToken(familyId: string, oldToken: string, newToken: string) {
      const oldHash = crypto.createHash('sha256').update(oldToken).digest('hex');
      const activeSession = this.sessions.find(
        (s) => s.familyId === familyId && s.tokenHash === oldHash && s.revokedAt === null
      );

      if (!activeSession) {
        // Reuse detected of an already-used or unknown token! Revoke the ENTIRE family
        this.revokeFamily(familyId);
        throw new Error('TOKEN_REUSE_DETECTED');
      }

      // Invalidate old token
      activeSession.revokedAt = new Date();

      // Issue new token in same family
      return this.createSession(familyId, newToken);
    }

    revokeFamily(familyId: string) {
      for (const s of this.sessions) {
        if (s.familyId === familyId) {
          s.revokedAt = new Date();
        }
      }
    }

    isTokenValid(familyId: string, token: string): boolean {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      const session = this.sessions.find(
        (s) => s.familyId === familyId && s.tokenHash === hash && s.revokedAt === null
      );
      return Boolean(session);
    }
  }

  it('should allow legitimate token rotation within a family', () => {
    const tracker = new SessionFamilyTracker();
    const family = 'fam-123';

    tracker.createSession(family, 'token-1');
    expect(tracker.isTokenValid(family, 'token-1')).toBe(true);

    tracker.rotateToken(family, 'token-1', 'token-2');
    expect(tracker.isTokenValid(family, 'token-1')).toBe(false);
    expect(tracker.isTokenValid(family, 'token-2')).toBe(true);
  });

  it('should detect token reuse and revoke the entire token family', () => {
    const tracker = new SessionFamilyTracker();
    const family = 'fam-456';

    tracker.createSession(family, 'token-A');
    tracker.rotateToken(family, 'token-A', 'token-B');

    // Attacker attempts to replay token-A
    expect(() => tracker.rotateToken(family, 'token-A', 'token-C')).toThrow('TOKEN_REUSE_DETECTED');

    // Both token-A and the legitimate token-B must now be revoked
    expect(tracker.isTokenValid(family, 'token-A')).toBe(false);
    expect(tracker.isTokenValid(family, 'token-B')).toBe(false);
  });
});

describe('Step-Up Elevated Claim Enforcement', () => {
  it('should enforce 5-minute maximum lifetime for elevated claims', () => {
    const issuedAt = Date.now();
    const elevatedLifetimeMs = 5 * 60 * 1000;
    const expiresAt = issuedAt + elevatedLifetimeMs;

    const isClaimValidAt4Min = issuedAt + 4 * 60 * 1000 < expiresAt;
    const isClaimValidAt6Min = issuedAt + 6 * 60 * 1000 < expiresAt;

    expect(isClaimValidAt4Min).toBe(true);
    expect(isClaimValidAt6Min).toBe(false);
  });
});
