import { describe, it, expect } from 'vitest';
import {
  normalizeSecurityAnswer,
  validateSecurityAnswer,
  hashSecurityAnswer,
  verifySecurityAnswer,
  generateRecoveryCodes,
} from '../../src/common/utils/security-crypto';

describe('Account Recovery & Security Question Hardening', () => {
  it('should normalize answers: trim, lowercase, strip punctuation and spaces', () => {
    const raw = '   St. Mary\'s High School, New York!  ';
    const normalized = normalizeSecurityAnswer(raw);
    expect(normalized).toBe('stmaryshighschoolnewyork');
  });

  it('should enforce min 6 characters after normalization', () => {
    const short = validateSecurityAnswer('  A! b  ');
    expect(short.valid).toBe(false);
    expect(short.reason).toContain('at least 6 characters');

    const valid = validateSecurityAnswer('Blue Horizon Elementary');
    expect(valid.valid).toBe(true);
    expect(valid.normalized).toBe('bluehorizonelementary');
  });

  it('should reject answers containing user personal identifiers', () => {
    const res = validateSecurityAnswer('I lived in flat A101', { flat: 'A-101' });
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('must not contain your flat number');

    const resUser = validateSecurityAnswer('my username is rohanmehra', { username: 'rohanmehra' });
    expect(resUser.valid).toBe(false);
    expect(resUser.reason).toContain('must not contain your username');
  });

  it('should hash normalized answers with salt and server pepper', async () => {
    const answer = 'Mount Carmel School';
    const normalized = normalizeSecurityAnswer(answer);
    const hash = await hashSecurityAnswer(normalized);

    expect(hash).toContain('$argon2id$');
    const matches = await verifySecurityAnswer(hash, normalized);
    expect(matches).toBe(true);

    const wrong = await verifySecurityAnswer(hash, 'wronganswerentirely');
    expect(wrong).toBe(false);
  });

  it('should generate 10 unique recovery codes', () => {
    const codes = generateRecoveryCodes(10);
    expect(codes).toHaveLength(10);
    const unique = new Set(codes);
    expect(unique.size).toBe(10);
    expect(codes[0]).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
  });
});
