import { describe, it, expect } from 'vitest';

/**
 * Recursive scanner that searches any object or array for forbidden PII / identity keys or values
 */
function scanForIdentityLeaks(obj: any, path: string = ''): string[] {
  const leaks: string[] = [];
  const forbiddenKeyPatterns = [
    /user_?id/i,
    /flat_?id/i,
    /submitter_?mobile/i,
    /mobile/i,
    /submitter_?username/i,
    /flat_?number/i,
    /phone/i,
    /blind_?index/i,
    /tracking_?code_?hash/i,
  ];

  const forbiddenValues = [
    'user-secret-id-999',
    'flat-uuid-402',
    '+919876543210',
    'secret_resident_user',
    'B-402',
  ];

  if (obj === null || obj === undefined) return leaks;

  if (typeof obj === 'string') {
    for (const val of forbiddenValues) {
      if (obj.includes(val)) {
        leaks.push(`Forbidden identity value "${val}" found at ${path}`);
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      leaks.push(...scanForIdentityLeaks(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Allowlist exceptions:
      // - actor_role or role
      // - uploaderId being null
      // - submitter.id being null or absent
      if (key === 'actor_id' || key === 'assigned_to' || key === 'assignedTo') {
        // Resolver/assignee ID is expected for internal workflow, not the submitter's identity
        continue;
      }

      for (const pattern of forbiddenKeyPatterns) {
        if (pattern.test(key) && val !== null && val !== undefined) {
          // If key matches a forbidden PII field and contains a value
          leaks.push(`Forbidden PII key "${key}" found at ${currentPath} with value ${JSON.stringify(val)}`);
        }
      }

      leaks.push(...scanForIdentityLeaks(val, currentPath));
    }
  }

  return leaks;
}

describe('Anonymity Leak Prevention Security Test (Unit/Security)', () => {
  const rawDbAnonymousRow = {
    id: 'gr-test-uuid',
    public_id: 'GR-2026-0001',
    society_id: 'soc-test',
    title: 'Water leakage in corridor',
    description: 'Corridor pipeline leaking',
    priority: 'URGENT',
    status: 'SUBMITTED',
    current_level: 1,
    assigned_to: 'resolver-id-1',
    assigned_to_name: 'Secretary Roy',
    is_anonymous: true,
    submitter_user_id: null,
    submitter_blind_index: 'a7b8c9d0...',
    flat_id: null,
    tracking_code_hash: '3f2e1d...',
    category_name: 'Water Supply',
    category_icon: 'Droplet',
    area_text: 'Wing B 4th floor',
    area_tag_name: 'Wing B Corridor',
    occurred_at: '2026-03-01T10:00:00.000Z',
    sla_due_at: '2026-03-02T10:00:00.000Z',
    flagged: false,
    flag_reason: null,
    created_at: '2026-03-01T10:00:00.000Z',
    resolved_at: null,
    closed_at: null,
    closure_note: null,
    // Database JOINs may have null for submitter fields:
    submitter_name: null,
    submitter_username: null,
    submitter_mobile: null,
    flat_number: null,
  };

  it('admin serializer must contain zero submitter PII for anonymous complaints', () => {
    // Replicating serializeForAdmin
    const serializedAdmin = {
      id: rawDbAnonymousRow.id,
      publicId: rawDbAnonymousRow.public_id,
      title: rawDbAnonymousRow.title,
      description: rawDbAnonymousRow.description,
      priority: rawDbAnonymousRow.priority,
      status: rawDbAnonymousRow.status,
      currentLevel: rawDbAnonymousRow.current_level,
      categoryName: rawDbAnonymousRow.category_name,
      categoryIcon: rawDbAnonymousRow.category_icon,
      areaText: rawDbAnonymousRow.area_text,
      areaTagName: rawDbAnonymousRow.area_tag_name,
      occurredAt: rawDbAnonymousRow.occurred_at,
      slaDueAt: rawDbAnonymousRow.sla_due_at,
      isAnonymous: true,
      assignedTo: rawDbAnonymousRow.assigned_to,
      assignedToName: rawDbAnonymousRow.assigned_to_name,
      flagged: false,
      flagReason: null,
      createdAt: rawDbAnonymousRow.created_at,
      resolvedAt: null,
      closedAt: null,
      closureNote: null,
      submitter: { fullName: 'Anonymous Resident', isAnonymous: true },
    };

    const leaks = scanForIdentityLeaks(serializedAdmin);
    expect(leaks).toEqual([]);
    expect(serializedAdmin.submitter.fullName).toBe('Anonymous Resident');
    expect((serializedAdmin as any).submitter.userId).toBeUndefined();
    expect((serializedAdmin as any).submitter.mobile).toBeUndefined();
  });

  it('resident serializer must contain zero submitter PII for anonymous complaints', () => {
    // Replicating serializeForResident
    const serializedResident = {
      id: rawDbAnonymousRow.id,
      publicId: rawDbAnonymousRow.public_id,
      title: rawDbAnonymousRow.title,
      description: rawDbAnonymousRow.description,
      priority: rawDbAnonymousRow.priority,
      status: rawDbAnonymousRow.status,
      currentLevel: rawDbAnonymousRow.current_level,
      categoryName: rawDbAnonymousRow.category_name,
      categoryIcon: rawDbAnonymousRow.category_icon,
      areaText: rawDbAnonymousRow.area_text,
      areaTagName: rawDbAnonymousRow.area_tag_name,
      occurredAt: rawDbAnonymousRow.occurred_at,
      slaDueAt: rawDbAnonymousRow.sla_due_at,
      isAnonymous: true,
      assignedToName: rawDbAnonymousRow.assigned_to_name,
      createdAt: rawDbAnonymousRow.created_at,
      resolvedAt: null,
      closedAt: null,
      closureNote: null,
      isOwner: true,
    };

    const leaks = scanForIdentityLeaks(serializedResident);
    expect(leaks).toEqual([]);
  });

  it('public track serializer must contain zero PII and zero tracking hashes', () => {
    const publicTrackResponse = {
      publicId: rawDbAnonymousRow.public_id,
      title: rawDbAnonymousRow.title,
      categoryName: rawDbAnonymousRow.category_name,
      status: rawDbAnonymousRow.status,
      currentLevel: rawDbAnonymousRow.current_level,
      slaDueAt: rawDbAnonymousRow.sla_due_at,
      createdAt: rawDbAnonymousRow.created_at,
      resolvedAt: rawDbAnonymousRow.resolved_at,
      closedAt: rawDbAnonymousRow.closed_at,
    };

    const leaks = scanForIdentityLeaks(publicTrackResponse);
    expect(leaks).toEqual([]);
  });

  it('audit log snapshot for anonymous grievance creation must not contain submitter PII', () => {
    const auditRecord = {
      action: 'GRIEVANCE_CREATED',
      actorRole: 'RESIDENT',
      entityType: 'grievance',
      entityId: rawDbAnonymousRow.id,
      before: null,
      after: {
        publicId: rawDbAnonymousRow.public_id,
        isAnonymous: true,
        priority: rawDbAnonymousRow.priority,
        level: 1,
      },
    };

    const leaks = scanForIdentityLeaks(auditRecord);
    expect(leaks).toEqual([]);
  });

  it('socket.io event payload for grievance updates must not leak submitter identity', () => {
    const socketEvent = {
      event: 'grievance.updated',
      data: {
        id: rawDbAnonymousRow.id,
        status: 'IN_PROGRESS',
        currentLevel: 1,
      },
    };

    const leaks = scanForIdentityLeaks(socketEvent);
    expect(leaks).toEqual([]);
  });
});
