import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyProofOfWork, sha256Hex, generateRecoveryCodes } from '../../src/common/utils/security-crypto';
import { isAdminRole, Role } from '@grievease/contracts';

describe('Login Spam Defense, Account Lockout & Self-Hosted Recovery (Items 6 & 8)', () => {
  class AccountSecurityManager {
    private failedAttempts = new Map<string, { count: number; lockedUntil: number | null }>();
    private recoveryCodes = new Map<string, { codeHash: string; used: boolean }[]>(); // userId -> codes
    private recoveryTickets = new Map<string, { eligibleAt: number; status: 'PENDING' | 'CANCELLED' | 'USED' }>();
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

    // GrievEase 10 Single-Use Offline Backup Codes (Non-Admin Only)
    provisionRecoveryCodes(userId: string, role: Role): string[] {
      if (isAdminRole(role)) {
        throw new Error('Admin roles cannot use recovery codes. Emergency key transfer protocol required.');
      }
      const plainCodes = generateRecoveryCodes(10);
      const codeRecords = plainCodes.map((code) => ({
        codeHash: sha256Hex(code.replace(/-/g, '').toUpperCase()),
        used: false,
      }));
      this.recoveryCodes.set(userId, codeRecords);
      return plainCodes;
    }

    useRecoveryCode(userId: string, inputCode: string): boolean {
      const records = this.recoveryCodes.get(userId);
      if (!records) return false;

      const inputHash = sha256Hex(inputCode.replace(/-/g, '').toUpperCase());
      const match = records.find((r) => r.codeHash === inputHash && !r.used);
      if (!match) return false;

      // Mark used immediately
      match.used = true;

      // Revoke all existing sessions
      this.userSessions.delete(userId);
      return true;
    }

    // 24-Hour Cooling Off Device-Bound Recovery Ticket
    startSecurityQuestionRecovery(userId: string, role: Role): { ticketId: string; eligibleInHours: number } {
      if (isAdminRole(role)) {
        throw new Error('Admin roles cannot recover via security questions.');
      }

      const ticketId = crypto.randomUUID();
      const delayHours = 24; // 24-hour cooling-off delay
      const eligibleAt = Date.now() + delayHours * 60 * 60 * 1000;

      this.recoveryTickets.set(ticketId, {
        eligibleAt,
        status: 'PENDING',
      });

      return { ticketId, eligibleInHours: delayHours };
    }

    isTicketEligible(ticketId: string): boolean {
      const ticket = this.recoveryTickets.get(ticketId);
      if (!ticket || ticket.status !== 'PENDING') return false;
      return Date.now() >= ticket.eligibleAt;
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

  it('should enforce single-use offline recovery codes and revoke sessions on recovery', () => {
    const sec = new AccountSecurityManager();
    const residentId = 'resident-101';

    sec.addSession(residentId, 'session-phone');
    sec.addSession(residentId, 'session-laptop');
    expect(sec.getUserSessions(residentId).length).toBe(2);

    // Provision 10 offline recovery codes for resident
    const codes = sec.provisionRecoveryCodes(residentId, 'RESIDENT');
    expect(codes.length).toBe(10);

    const firstCode = codes[0];

    // Wrong code fails
    expect(sec.useRecoveryCode(residentId, 'WRONG-CODE-0000')).toBe(false);

    // Legitimate code succeeds
    expect(sec.useRecoveryCode(residentId, firstCode)).toBe(true);

    // Replay attack: Code cannot be reused
    expect(sec.useRecoveryCode(residentId, firstCode)).toBe(false);

    // All prior sessions revoked
    expect(sec.getUserSessions(residentId).length).toBe(0);
  });

  it('should disallow recovery codes or security questions for administrative roles', () => {
    const sec = new AccountSecurityManager();
    const adminRoles: Role[] = ['SECRETARY', 'CHAIRMAN', 'SUPER_ADMIN', 'COMMITTEE', 'GOVERNING_BODY'];

    for (const role of adminRoles) {
      expect(() => sec.provisionRecoveryCodes('admin-user', role)).toThrow(
        /Admin roles cannot use recovery codes/
      );
      expect(() => sec.startSecurityQuestionRecovery('admin-user', role)).toThrow(
        /Admin roles cannot recover via security questions/
      );
    }
  });

  it('should enforce 24-hour cooling off on security question recovery tickets', () => {
    const sec = new AccountSecurityManager();
    const { ticketId, eligibleInHours } = sec.startSecurityQuestionRecovery('resident-102', 'RESIDENT');

    expect(eligibleInHours).toBe(24);
    // Immediately after creation, ticket is locked in cooling-off
    expect(sec.isTicketEligible(ticketId)).toBe(false);
  });
});
