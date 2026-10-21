import { describe, it, expect } from 'vitest';
import { verifyProofOfWork, sha256Hex } from '../../src/common/utils/security-crypto';

describe('Proof of Work Challenge Engine', () => {
  it('should verify valid proof of work solutions matching difficulty prefix', () => {
    const nonce = 'testnonce123456';
    const difficulty = 2; // requires 2 leading zeros

    // Mine a quick solution for difficulty 2
    let counter = 0;
    while (true) {
      const candidate = counter.toString();
      const hash = sha256Hex(nonce + candidate);
      if (hash.startsWith('00')) {
        const isValid = verifyProofOfWork(nonce, candidate, difficulty);
        expect(isValid).toBe(true);
        break;
      }
      counter++;
    }
  });

  it('should reject invalid solutions or mismatched nonces', () => {
    const nonce = 'randomnonce';
    const invalidSolution = 'invalid999';
    const isBad = verifyProofOfWork(nonce, invalidSolution, 4);
    expect(isBad).toBe(false);
  });
});
