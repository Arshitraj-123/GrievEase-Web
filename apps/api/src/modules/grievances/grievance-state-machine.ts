import { ConflictException } from '@nestjs/common';
import { GrievanceStatus } from '@grievease/contracts';

/**
 * Valid transitions map for the GrievEase Grievance Lifecycle
 */
export const VALID_STATUS_TRANSITIONS: Record<GrievanceStatus, GrievanceStatus[]> = {
  DRAFT: ['SUBMITTED'],
  SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'PENDING_INFO', 'ESCALATED', 'RESOLVED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'PENDING_INFO', 'ESCALATED', 'RESOLVED'],
  IN_PROGRESS: ['PENDING_INFO', 'ESCALATED', 'RESOLVED'],
  PENDING_INFO: ['IN_PROGRESS', 'ACKNOWLEDGED', 'RESOLVED', 'ESCALATED'],
  ESCALATED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'PENDING_INFO', 'RESOLVED'],
  RESOLVED: ['CLOSED', 'REOPENED'],
  REOPENED: ['IN_PROGRESS', 'ESCALATED', 'RESOLVED'],
  CLOSED: ['ESCALATED'], // Re-opened via approved Appeal only
};

export class GrievanceStateMachine {
  /**
   * Returns true if transition is legal, false otherwise.
   */
  static canTransition(from: GrievanceStatus, to: GrievanceStatus): boolean {
    if (from === to) return true;
    const allowed = VALID_STATUS_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Asserts transition is legal or throws HTTP 409 ConflictException.
   */
  static assertValidTransition(from: GrievanceStatus, to: GrievanceStatus): void {
    if (!this.canTransition(from, to)) {
      throw new ConflictException(
        `Illegal grievance status transition from '${from}' to '${to}'. Allowed transitions: ${
          VALID_STATUS_TRANSITIONS[from]?.join(', ') || 'none'
        }`
      );
    }
  }

  /**
   * Returns list of allowed next statuses.
   */
  static getAllowedTransitions(from: GrievanceStatus): GrievanceStatus[] {
    return VALID_STATUS_TRANSITIONS[from] ? [...VALID_STATUS_TRANSITIONS[from]] : [];
  }
}
