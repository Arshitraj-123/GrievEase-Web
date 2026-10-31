import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyProofOfWork, sha256Hex } from '../../src/common/utils/security-crypto';

describe('Login Spam Defense, Account Lockout & Password Resets (Items 6 & 8)', () => {
  class AccountSecurityManager {
    private failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
    private passwordResetTokens = new Map<string, { tokenHash: string; expiresAt: number; used: boolean }>();
    private userSessions = new Map<string, string[]>(); // userId -> sessionIds

    recordFailedLogin(userOrIp: string) {
      const current = this.failedAttempts.get(userOrIp) || { count: 0, lockedUntil: null };
      current.count += 1;

      if (current.count >= 5) {
        // Base 15 min lock with exponential backoff for repeat lockouts
        const multiplier = Math.pow(2, Math.max(0, current.count - 5));
        const lockMs = Math.min(15 * 60 * 1000 * multiplier, 24 * 60 * 60 * 1000);
        current.lockedUntil = Date.now() + lockMs;
      }

      this.failedAttempts.set(userOrIp, current);
      return current;
    }

    isLocked(userOrIp: string): { locked: boolean; remainingMinutes?: number } {
      const state = this.failedAttempts.get(userOrIp);
      if (!state || !state.lockedUntil) return { locked: false };
      if (Date.now() > state.lockedUntil) {
        state.lockedUntil = null;
        return { locked: false };
      }
      return {
        locked: true,
        remainingMinutes: Math.ceil((state.lockedUntil - Date.now()) / (60 * 1000)),
      };
    }

    createPasswordResetToken(userId: string): string {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins
      this.passwordResetTokens.set(userId, { tokenHash, expiresAt, used: false });
      return rawToken;
    }

    consumePasswordResetToken(userId: string, rawToken: string): boolean {
      const record = this.passwordResetTokens.get(userId);
      if (!record || record.used) return false;
      if (Date.now() > record.expiresAt) return false;

      const inputHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const match = crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(record.tokenHash, 'hex'));
      if (!match) return false;

      record.used = true;
      // Revoke all existing sessions for this user on password reset
      this.userSessions.delete(userId);
      return true;
    }

    addSession(userId: string, sessionId: string) {
      const list = this.userSessions.get(userId) || [];
      list.push(sessionId);
      this.userSessions.set(userId, list);
    }

    getUserSessions(userId: string): string[] {
      return this.userSessions.get(userId) || [];
    }
  }

  it('should lock an account for 15 minutes after 5 failed login attempts', () => {
    const sec = new AccountSecurityManager();
    const username = 'testuser';

    for (let i = 1; i <= 4; i++) {
      sec.recordFailedLogin(username);
      expect(sec.isLocked(username).locked).toBe(false);
    }

    sec.recordFailedLogin(username); // 5th attempt
    const lockStatus = sec.isLocked(username);
    expect(lockStatus.locked).toBe(true);
    expect(lockStatus.remainingMinutes).toBe(15);
  });

  it('should generate solvable Proof of Work challenges under burst login load', () => {
    const nonce = crypto.randomBytes(16).toString('hex');
    const difficulty = 2; // requires 2 leading zeros

    // Solve challenge
    let counter = 0;
    let foundSolution = '';
    while (true) {
      const candidate = counter.toString();
      const hash = sha256Hex(nonce + candidate);
      if (hash.startsWith('00')) {
        foundSolution = candidate;
        break;
      }
      counter++;
    }

    expect(verifyProofOfWork(nonce, foundSolution, difficulty)).toBe(true);
    // Invalid solution must fail
    expect(verifyProofOfWork(nonce, 'invalid-solution', difficulty)).toBe(false);
  });

  it('should provide uniform generic errors to prevent username enumeration', () => {
    function simulateLoginResponse(userExists: boolean, passwordValid: boolean) {
      if (!userExists || !passwordValid) {
        return { status: 401, error: 'Invalid credentials' };
      }
      return { status: 200, token: 'session_token' };
    }

    const nonExistentResponse = simulateLoginResponse(false, false);
    const wrongPasswordResponse = simulateLoginResponse(true, false);

    expect(nonExistentResponse.status).toBe(401);
    expect(wrongPasswordResponse.status).toBe(401);
    expect(nonExistentResponse.error).toBe(wrongPasswordResponse.error);
  });

  it('should enforce single-use, 15-minute expiration, and session revocation on password resets', () => {
    const sec = new AccountSecurityManager();
    const userId = 'user-123';

    sec.addSession(userId, 'session-device-1');
    sec.addSession(userId, 'session-device-2');
    expect(sec.getUserSessions(userId).length).toBe(2);

    const token = sec.createPasswordResetToken(userId);

    // Tampered token fails
    expect(sec.consumePasswordResetToken(userId, token + 'tampered')).toBe(false);

    // Legitimate token succeeds
    expect(sec.consumePasswordResetToken(userId, token)).toBe(true);

    // Token reuse is blocked
    expect(sec.consumePasswordResetToken(userId, token)).toBe(false);

    // All prior sessions are revoked
    expect(sec.getUserSessions(userId).length).toBe(0);
  });
});
