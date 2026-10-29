import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  encryptSubmitter,
  decryptSubmitter,
  generateBlindIndex,
  generateTrackingCode,
  hashTrackingCode,
} from '../../src/common/utils/anonymity-crypto';

describe('Anonymity Cryptography (Unit)', () => {
  const testKeyV1 = crypto.randomBytes(32).toString('hex');
  const testKeyV2 = crypto.randomBytes(32).toString('hex');

  it('should encrypt and decrypt submitter identity correctly with AES-256-GCM', () => {
    const identity = {
      userId: '7f91a620-802d-4d43-a636-69b8215161aa',
      fullName: 'Suresh Patil',
      flatNumber: 'B-402',
      mobile: '+919876543210',
    };

    const encrypted = encryptSubmitter(identity, testKeyV1, 'v1');
    expect(encrypted.keyVersion).toBe('v1');
    expect(encrypted.encryptedPayload.split(':').length).toBe(3); // iv:authTag:ciphertext

    const decrypted = decryptSubmitter(encrypted.encryptedPayload, testKeyV1);
    expect(decrypted).toEqual(identity);
  });

  it('should fail decryption if ciphertext or auth tag is tampered with', () => {
    const identity = { userId: 'fake-user-id' };
    const encrypted = encryptSubmitter(identity, testKeyV1);
    const parts = encrypted.encryptedPayload.split(':');

    // Tamper with ciphertext by altering the last character
    const tamperedCipher = parts[2]!.slice(0, -2) + (parts[2]!.endsWith('a') ? 'b' : 'a');
    const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

    expect(() => decryptSubmitter(tamperedPayload, testKeyV1)).toThrow();
  });

  it('should support key rotation across versions', () => {
    const identity = { userId: 'rot-user-123', secret: 'test-rotation' };

    // Encrypted with v1
    const encryptedV1 = encryptSubmitter(identity, testKeyV1, 'v1');
    expect(decryptSubmitter(encryptedV1.encryptedPayload, testKeyV1)).toEqual(identity);

    // Re-encrypted with v2 (key rotation)
    const encryptedV2 = encryptSubmitter(identity, testKeyV2, 'v2');
    expect(encryptedV2.keyVersion).toBe('v2');
    expect(decryptSubmitter(encryptedV2.encryptedPayload, testKeyV2)).toEqual(identity);

    // v2 key cannot decrypt v1 payload
    expect(() => decryptSubmitter(encryptedV1.encryptedPayload, testKeyV2)).toThrow();
  });

  it('should generate deterministic HMAC blind index for same user and society', () => {
    const societyId = 'e2079f53-271e-4ce2-a083-d5e1b21226aa';
    const userId = 'user-abc-123';

    const index1 = generateBlindIndex(testKeyV1, societyId, userId);
    const index2 = generateBlindIndex(testKeyV1, societyId, userId);
    const differentUser = generateBlindIndex(testKeyV1, societyId, 'user-xyz-456');

    expect(index1).toBe(index2);
    expect(index1).not.toBe(differentUser);
    expect(index1.length).toBe(64); // SHA-256 hex
  });

  it('should generate unambiguous uppercase tracking codes and correct SHA-256 hashes', () => {
    const code = generateTrackingCode();
    expect(code.length).toBe(13); // TRK-XXXX-YYYY
    // Unambiguous chars: 23456789ABCDEFGHJKLMNPQRSTUVWXYZ (no 0, 1, I, O)
    expect(code).toMatch(/^TRK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/);

    const hash1 = hashTrackingCode(code);
    const hash2 = hashTrackingCode(code.toLowerCase()); // Case-insensitive matching
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });
});
