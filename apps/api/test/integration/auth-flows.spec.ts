import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  validatePasswordStrength,
  hashPassword,
  verifyPassword,
} from '../../src/common/utils/password-policy';
import {
  validateSecurityAnswer,
  hashSecurityAnswer,
  verifySecurityAnswer,
  verifyProofOfWork,
  sha256Hex,
} from '../../src/common/utils/security-crypto';

describe('End-to-End Auth & Recovery Flow Integration', () => {
  it('should complete resident activation, password setting, security question hashing, and recovery cycle', async () => {
    // 1. Password creation
    const samplePassphrase = 'ResidentPasswordSecure2026!';
    const passwordCheck = validatePasswordStrength(samplePassphrase, {
      isAdmin: false,
      username: 'resident.rohan',
    });
    expect(passwordCheck.valid).toBe(true);

    const passHash = await hashPassword(samplePassphrase);
    expect(passHash).toContain('$argon2id$');
    expect(await verifyPassword(passHash, samplePassphrase)).toBe(true);

    // 2. Setup 3 custom security questions
    const q1Answer = '  St. Xavier High School!  ';
    const norm1 = validateSecurityAnswer(q1Answer, {
      username: 'resident.rohan',
      fullName: 'Rohan Sharma',
      flat: '101',
    });
    expect(norm1.valid).toBe(true);
    expect(norm1.normalized).toBe('stxavierhighschool');

    const hash1 = await hashSecurityAnswer(norm1.normalized);
    expect(await verifySecurityAnswer(hash1, 'st. xavier high school')).toBe(true);
    expect(await verifySecurityAnswer(hash1, 'wrong answer')).toBe(false);

    // 3. PoW challenge generation & solution
    const nonce = 'randomtestnonce999';
    const difficulty = 2; // requires 2 leading zeros

    let counter = 0;
    let found = '';
    while (counter < 500000) {
      const candidate = `${counter}`;
      const hash = sha256Hex(nonce + candidate);
      if (hash.startsWith('00')) {
        found = candidate;
        break;
      }
      counter++;
    }
    expect(found.length).toBeGreaterThan(0);
    expect(verifyProofOfWork(nonce, found, difficulty)).toBe(true);
  });

  it('should reject common breached passwords and weak credentials', () => {
    expect(validatePasswordStrength('password123456', { isAdmin: false }).valid).toBe(false);
    expect(validatePasswordStrength('Welcome@123', { isAdmin: false }).valid).toBe(false);
    expect(validatePasswordStrength('123456789012', { isAdmin: false }).valid).toBe(false);
  });

  it('should enforce stricter password policy for admin roles (min 12 characters)', () => {
    const adminCheck10Chars = validatePasswordStrength('AdminPass!', { isAdmin: true });
    expect(adminCheck10Chars.valid).toBe(false);
    expect(adminCheck10Chars.reason).toContain('12 characters');

    const adminCheck14Chars = validatePasswordStrength('SuperAdminSecure2026Passphrase!', { isAdmin: true });
    expect(adminCheck14Chars.valid).toBe(true);
  });

  it('should reject security answers that match user identity, flat, or mobile', () => {
    const checkName = validateSecurityAnswer('Rohan Sharma', { fullName: 'Rohan Sharma' });
    expect(checkName.valid).toBe(false);
    expect(checkName.reason).toContain('must not contain your name');

    const checkFlat = validateSecurityAnswer('A-101 Green Valley', { flat: 'A-101' });
    expect(checkFlat.valid).toBe(false);
    expect(checkFlat.reason).toContain('flat number');
  });
});
