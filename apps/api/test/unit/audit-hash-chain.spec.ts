import { describe, it, expect } from 'vitest';
import { computeAuditHash } from '../../src/cli/verify-audit';

describe('Cryptographic Audit Hash Chain', () => {
  it('should deterministically compute hash from prevHash and sorted canonical JSON', () => {
    const prevHash = '0'.repeat(64);
    const entryData = {
      action: 'USER_CREATED',
      actorId: 'usr-123',
      actorRole: 'SUPER_ADMIN',
      after: { username: 'test.user' },
      before: null,
      device: 'Chrome-Mac',
      entityId: 'ent-456',
      entityType: 'app_user',
      ip: '192.168.1.1',
      seq: 1,
      societyId: 'soc-789',
    };

    const hash1 = computeAuditHash(prevHash, entryData);
    const hash2 = computeAuditHash(prevHash, entryData);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('should produce a completely different hash if any field is tampered with', () => {
    const prevHash = '0'.repeat(64);
    const original = {
      action: 'USER_CREATED',
      actorId: 'usr-123',
      actorRole: 'SUPER_ADMIN',
      seq: 1,
      societyId: 'soc-789',
    };

    const tampered = {
      ...original,
      actorRole: 'RESIDENT', // Tampered actor role!
    };

    const originalHash = computeAuditHash(prevHash, original);
    const tamperedHash = computeAuditHash(prevHash, tampered);

    expect(originalHash).not.toBe(tamperedHash);
  });

  it('should chain sequentially and break if prevHash does not match', () => {
    const genesisPrev = '0'.repeat(64);
    const block1Data = { action: 'INIT', seq: 1, societyId: 'soc-1' };
    const block1Hash = computeAuditHash(genesisPrev, block1Data);

    const block2Data = { action: 'UPDATE', seq: 2, societyId: 'soc-1' };
    const block2HashValid = computeAuditHash(block1Hash, block2Data);

    // If attacker changes block 1 or passes an incorrect prevHash
    const fakePrevHash = 'f'.repeat(64);
    const block2HashTampered = computeAuditHash(fakePrevHash, block2Data);

    expect(block2HashValid).not.toBe(block2HashTampered);
  });
});
