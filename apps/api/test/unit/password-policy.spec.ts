import { describe, it, expect } from 'vitest';
import * as argon2 from 'argon2';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
  needsRehash,
  ARGON2_CONFIG,
} from '../../src/common/utils/password-policy';

describe('Password Policy & Argon2id Verification', () => {
  it('should enforce min 10 characters for resident and 12 for admin', () => {
    const residentShort = validatePasswordStrength('Short9!', { isAdmin: false });
    expect(residentShort.valid).toBe(false);
    expect(residentShort.reason).toContain('at least 10 characters');

    const adminShort = validatePasswordStrength('TenChars9!', { isAdmin: true });
    expect(adminShort.valid).toBe(false);
    expect(adminShort.reason).toContain('at least 12 characters');

    const adminValid = validatePasswordStrength('CorrectHorseBatteryStaple12!', { isAdmin: true });
    expect(adminValid.valid).toBe(true);
  });

  it('should reject passwords from the common password blacklist', () => {
    const res = validatePasswordStrength('welcome123', { isAdmin: false });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('too common');

    const res2 = validatePasswordStrength('greenvalley', { isAdmin: false });
    expect(res2.valid).toBe(false);
    expect(res2.reason).toContain('too common');
  });

  it('should reject passwords containing personal attributes (username, flat, mobile)', () => {
    const userCheck = validatePasswordStrength('JohnDoeSecretPass123', { username: 'JohnDoe' });
    expect(userCheck.valid).toBe(false);
    expect(userCheck.reason).toContain('must not contain your username');

    const flatCheck = validatePasswordStrength('MyFlatA101SecurePass', { flat: 'A-101' });
    expect(flatCheck.valid).toBe(false);
    expect(flatCheck.reason).toContain('must not contain your flat number');

    const mobileCheck = validatePasswordStrength('Secret543210Pass!', { mobile: '+919876543210' });
    expect(mobileCheck.valid).toBe(false);
    expect(mobileCheck.reason).toContain('must not contain parts of your mobile');
  });

  it('should hash and verify passwords using Argon2id correctly', async () => {
    const samplePassphrase = 'StrongUniquePassphrase2026!';
    const hash = await hashPassword(samplePassphrase);

    expect(hash).toContain('$argon2id$');
    const isValid = await verifyPassword(hash, samplePassphrase);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword(hash, 'WrongPasswordEntirely!');
    expect(isInvalid).toBe(false);
  });

  it('should safely execute dummy hash verification for non-existent users without throwing', async () => {
    const result = await verifyPassword(null, 'AnyPasswordAttempt');
    expect(result).toBe(false);
  });

  it('should trigger needsRehash when hash parameters differ from OWASP standards', async () => {
    // Generate an outdated hash with low memory (e.g., 4096 KB instead of 65536 KB)
    const legacyHash = await argon2.hash('OldLegacyPassword123!', {
      type: argon2.argon2id,
      memoryCost: 4096,
      timeCost: 2,
      parallelism: 1,
    });

    expect(needsRehash(legacyHash)).toBe(true);

    // Current hash with 65536 KB and timeCost 3
    const currentHash = await hashPassword('CurrentValidPassword123!');
    expect(needsRehash(currentHash)).toBe(false);
  });

  it('should verify with pepper and seamlessly support legacy unpeppered verification', async () => {
    const samplePassphrase = 'MultiStagePasswordTest2026!';
    // Hash with legacy method (no pepper)
    const legacyHash = await argon2.hash(samplePassphrase, {
      type: argon2.argon2id,
      memoryCost: ARGON2_CONFIG.memoryCost,
      timeCost: ARGON2_CONFIG.timeCost,
      parallelism: ARGON2_CONFIG.parallelism,
    });

    // verifyPassword should still authenticate the legacy hash via fallback
    const verified = await verifyPassword(legacyHash, samplePassphrase);
    expect(verified).toBe(true);
  });
});
