import { describe, it, expect } from 'vitest';
import { GrievanceStateMachine } from '../../src/modules/grievances/grievance-state-machine';
import { ConflictException } from '@nestjs/common';
import { GrievanceStatus } from '@grievease/contracts';

describe('GrievanceStateMachine (Unit)', () => {
  it('should allow valid transitions according to workflow specifications', () => {
    // DRAFT -> SUBMITTED
    expect(GrievanceStateMachine.canTransition('DRAFT', 'SUBMITTED')).toBe(true);
    expect(() => GrievanceStateMachine.assertValidTransition('DRAFT', 'SUBMITTED')).not.toThrow();

    // SUBMITTED -> ACKNOWLEDGED
    expect(GrievanceStateMachine.canTransition('SUBMITTED', 'ACKNOWLEDGED')).toBe(true);

    // ACKNOWLEDGED -> IN_PROGRESS
    expect(GrievanceStateMachine.canTransition('ACKNOWLEDGED', 'IN_PROGRESS')).toBe(true);

    // IN_PROGRESS -> PENDING_INFO
    expect(GrievanceStateMachine.canTransition('IN_PROGRESS', 'PENDING_INFO')).toBe(true);

    // PENDING_INFO -> IN_PROGRESS
    expect(GrievanceStateMachine.canTransition('PENDING_INFO', 'IN_PROGRESS')).toBe(true);

    // IN_PROGRESS -> RESOLVED
    expect(GrievanceStateMachine.canTransition('IN_PROGRESS', 'RESOLVED')).toBe(true);

    // RESOLVED -> REOPENED
    expect(GrievanceStateMachine.canTransition('RESOLVED', 'REOPENED')).toBe(true);

    // RESOLVED -> CLOSED
    expect(GrievanceStateMachine.canTransition('RESOLVED', 'CLOSED')).toBe(true);

    // Any open status -> ESCALATED
    expect(GrievanceStateMachine.canTransition('SUBMITTED', 'ESCALATED')).toBe(true);
    expect(GrievanceStateMachine.canTransition('ACKNOWLEDGED', 'ESCALATED')).toBe(true);
    expect(GrievanceStateMachine.canTransition('IN_PROGRESS', 'ESCALATED')).toBe(true);
  });

  it('should reject illegal transitions with a 409 ConflictException', () => {
    const illegalPairs: [GrievanceStatus, GrievanceStatus][] = [
      ['CLOSED', 'SUBMITTED'],
      ['CLOSED', 'IN_PROGRESS'],
      ['CLOSED', 'RESOLVED'],
      ['DRAFT', 'CLOSED'],
      ['SUBMITTED', 'CLOSED'],
      ['SUBMITTED', 'REOPENED'],
      ['PENDING_INFO', 'CLOSED'],
    ];

    for (const [from, to] of illegalPairs) {
      expect(GrievanceStateMachine.canTransition(from, to)).toBe(false);
      expect(() => GrievanceStateMachine.assertValidTransition(from, to)).toThrow(
        ConflictException
      );
    }
  });

  it('should return allowed next transitions for given status', () => {
    const inProgressTransitions = GrievanceStateMachine.getAllowedTransitions('IN_PROGRESS');
    expect(inProgressTransitions).toContain('PENDING_INFO');
    expect(inProgressTransitions).toContain('RESOLVED');
    expect(inProgressTransitions).toContain('ESCALATED');
    expect(inProgressTransitions).not.toContain('DRAFT');
  });
});
