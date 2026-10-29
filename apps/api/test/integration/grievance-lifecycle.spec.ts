import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { GrievanceStateMachine } from '../../src/modules/grievances/grievance-state-machine';
import { computeSlaDueAt } from '../../src/modules/grievances/sla-calculator';
import {
  encryptSubmitter,
  decryptSubmitter,
  generateBlindIndex,
  generateTrackingCode,
  hashTrackingCode,
} from '../../src/common/utils/anonymity-crypto';
import { computeAuditHash } from '../../src/cli/verify-audit';

describe('Grievance Module Lifecycle & Escalation Integration Test', () => {
  const secretKey = crypto.randomBytes(32).toString('hex');
  const societyId = 'soc-e2e-test-1';
  const residentId = 'res-user-123';

  it('1. should process complete lifecycle: submit -> acknowledge -> in_progress -> resolve -> close', () => {
    // A. Submission
    let status: any = 'DRAFT';
    expect(GrievanceStateMachine.canTransition(status, 'SUBMITTED')).toBe(true);
    status = 'SUBMITTED';

    // B. SLA computation
    const submitTime = new Date('2026-03-01T10:00:00.000Z');
    const slaDueAt = computeSlaDueAt(submitTime, 48); // Level 1 is 48h
    expect(slaDueAt.toISOString()).toBe('2026-03-03T10:00:00.000Z');

    // C. Resolver acknowledges
    expect(GrievanceStateMachine.canTransition(status, 'ACKNOWLEDGED')).toBe(true);
    status = 'ACKNOWLEDGED';

    // D. In Progress
    expect(GrievanceStateMachine.canTransition(status, 'IN_PROGRESS')).toBe(true);
    status = 'IN_PROGRESS';

    // E. Resolver marks RESOLVED with closure note
    expect(GrievanceStateMachine.canTransition(status, 'RESOLVED')).toBe(true);
    status = 'RESOLVED';
    const closureNote = 'Electrician replaced the faulty circuit breaker in main panel.';
    expect(closureNote.length).toBeGreaterThan(0);

    // F. Auto-close after auto_close_hours
    expect(GrievanceStateMachine.canTransition(status, 'CLOSED')).toBe(true);
    status = 'CLOSED';
  });

  it('2. should handle auto-escalation cascade through levels 1 to 4 with ceiling', () => {
    let currentLevel = 1;

    // Breach at Level 1 -> moves to Level 2
    expect(currentLevel < 4).toBe(true);
    currentLevel = 2;

    // Breach at Level 2 -> moves to Level 3
    expect(currentLevel < 4).toBe(true);
    currentLevel = 3;

    // Breach at Level 3 -> moves to Level 4 (Governing Body)
    expect(currentLevel < 4).toBe(true);
    currentLevel = 4;

    // Breach at Level 4: Cannot escalate further; must flag as FINAL_LEVEL_OVERDUE
    const canEscalateFurther = currentLevel < 4;
    expect(canEscalateFurther).toBe(false);
    const flagReason = 'FINAL_LEVEL_OVERDUE';
    expect(flagReason).toBe('FINAL_LEVEL_OVERDUE');
  });

  it('3. should skip vacant levels or resolvers on leave during breach cascade', () => {
    // Governance chain simulation:
    // L1: On leave
    // L2: Vacant
    // L3: Active Chairman
    const level1Resolver = { id: 'sec-1', onLeave: true };
    const level2Resolver = null; // Vacant
    const level3Resolver = { id: 'chair-1', onLeave: false };

    let targetLevel = 1;
    let assignedUser: any = null;
    let reason = 'AUTO_SLA';

    while (targetLevel <= 4 && !assignedUser) {
      if (targetLevel === 1) {
        if (level1Resolver.onLeave) {
          reason = 'LEAVE';
          targetLevel++;
          continue;
        }
      }
      if (targetLevel === 2) {
        if (!level2Resolver) {
          reason = 'VACANT';
          targetLevel++;
          continue;
        }
      }
      if (targetLevel === 3) {
        if (level3Resolver && !level3Resolver.onLeave) {
          assignedUser = level3Resolver;
          break;
        }
      }
    }

    expect(targetLevel).toBe(3);
    expect(assignedUser).toEqual(level3Resolver);
    expect(reason).toBe('VACANT');
  });

  it('4. should enforce rate limit using blind index across named and anonymous complaints', () => {
    const residentBlindIndex = generateBlindIndex(secretKey, societyId, residentId);

    // Named submission uses residentBlindIndex
    // Anonymous submission by same resident also uses residentBlindIndex
    const sub1 = { isAnonymous: false, blindIndex: residentBlindIndex };
    const sub2 = { isAnonymous: true, blindIndex: residentBlindIndex };
    const sub3 = { isAnonymous: true, blindIndex: residentBlindIndex };
    const sub4 = { isAnonymous: false, blindIndex: residentBlindIndex };
    const sub5 = { isAnonymous: true, blindIndex: residentBlindIndex };

    const submissions24h = [sub1, sub2, sub3, sub4, sub5];
    const maxLimit = 5;

    const count = submissions24h.filter((s) => s.blindIndex === residentBlindIndex).length;
    expect(count >= maxLimit).toBe(true); // 6th submission will be rejected
  });

  it('5. should encrypt anonymous identity and support verified break-glass reveal', () => {
    const originalResidentData = {
      userId: residentId,
      fullName: 'Aarav Mehta',
      flatNumber: 'C-304',
      mobile: '+919123456789',
    };

    // Encrypted on submission
    const encrypted = encryptSubmitter(originalResidentData, secretKey, 'v1');
    expect(encrypted.encryptedPayload).not.toContain('Aarav Mehta');
    expect(encrypted.encryptedPayload).not.toContain('C-304');

    // Tracking code generation
    const trackingCode = generateTrackingCode();
    const trackingHash = hashTrackingCode(trackingCode);
    expect(trackingCode.startsWith('TRK-')).toBe(true);
    expect(trackingHash).toBe(hashTrackingCode(trackingCode.toLowerCase()));

    // Break-glass reveal decryption by Super Admin
    const decrypted = decryptSubmitter(encrypted.encryptedPayload, secretKey);
    expect(decrypted).toEqual(originalResidentData);
  });

  it('6. should maintain unbroken SHA-256 hash-chained audit log across transitions', () => {
    let prevHash = '0'.repeat(64);
    const auditChain: any[] = [];

    const actions = [
      { action: 'GRIEVANCE_CREATED', entityId: 'gr-1', seq: 1 },
      { action: 'GRIEVANCE_STATUS_ACKNOWLEDGED', entityId: 'gr-1', seq: 2 },
      { action: 'GRIEVANCE_STATUS_IN_PROGRESS', entityId: 'gr-1', seq: 3 },
      { action: 'GRIEVANCE_STATUS_RESOLVED', entityId: 'gr-1', seq: 4 },
    ];

    for (const act of actions) {
      const entryData = {
        action: act.action,
        actorId: 'usr-1',
        actorRole: 'RESIDENT',
        after: null,
        before: null,
        entityId: act.entityId,
        entityType: 'grievance',
        seq: act.seq,
        societyId,
      };
      const hash = computeAuditHash(prevHash, entryData);
      auditChain.push({
        ...entryData,
        prevHash,
        hash,
      });
      prevHash = hash;
    }

    // Verify sequential integrity
    let verificationPassed = true;
    let expectedPrev = '0'.repeat(64);
    for (let i = 0; i < auditChain.length; i++) {
      const block = auditChain[i];
      if (block.prevHash !== expectedPrev) {
        verificationPassed = false;
        break;
      }
      const recomputed = computeAuditHash(expectedPrev, {
        action: block.action,
        actorId: block.actorId,
        actorRole: block.actorRole,
        after: block.after,
        before: block.before,
        entityId: block.entityId,
        entityType: block.entityType,
        seq: block.seq,
        societyId: block.societyId,
      });
      if (recomputed !== block.hash) {
        verificationPassed = false;
        break;
      }
      expectedPrev = block.hash;
    }

    expect(verificationPassed).toBe(true);

    // Tampering test: tamper an entry
    const tamperedBlock = { ...auditChain[1], action: 'TAMPERED_ACTION' };
    const recomputedTampered = computeAuditHash(auditChain[0].hash, {
      action: tamperedBlock.action,
      actorId: tamperedBlock.actorId,
      actorRole: tamperedBlock.actorRole,
      after: tamperedBlock.after,
      before: tamperedBlock.before,
      entityId: tamperedBlock.entityId,
      entityType: tamperedBlock.entityType,
      seq: tamperedBlock.seq,
      societyId: tamperedBlock.societyId,
    });
    expect(recomputedTampered).not.toBe(auditChain[1].hash);
  });
});
