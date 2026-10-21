import { describe, it, expect } from 'vitest';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
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
});
