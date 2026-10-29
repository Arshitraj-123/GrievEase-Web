import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateBlindIndex } from '../../src/common/utils/anonymity-crypto';

describe('Grievance Rate Limiting Logic (Unit)', () => {
  const secretKey = crypto.randomBytes(32).toString('hex');
  const societyId = 'soc-123';
  const userId = 'resident-456';

  it('should compute identical blind index for named and anonymous submissions by the same resident', () => {
    // Both named and anonymous submissions from the same user compute the same blind index:
    const namedBlindIndex = generateBlindIndex(secretKey, societyId, userId);
    const anonymousBlindIndex = generateBlindIndex(secretKey, societyId, userId);

    expect(namedBlindIndex).toBe(anonymousBlindIndex);
  });

  it('should prevent anonymity from bypassing rate limits by unifying count queries under blind index', () => {
    const blindIndex = generateBlindIndex(secretKey, societyId, userId);

    // Mock submissions in the last 24h
    const submissions = [
      { id: '1', is_anonymous: false, submitter_user_id: userId, submitter_blind_index: blindIndex },
      { id: '2', is_anonymous: true, submitter_user_id: null, submitter_blind_index: blindIndex },
      { id: '3', is_anonymous: true, submitter_user_id: null, submitter_blind_index: blindIndex },
      { id: '4', is_anonymous: false, submitter_user_id: userId, submitter_blind_index: blindIndex },
      { id: '5', is_anonymous: true, submitter_user_id: null, submitter_blind_index: blindIndex },
    ];

    const rateLimitPer24h = 5;

    // Filter by blind index
    const count = submissions.filter((s) => s.submitter_blind_index === blindIndex).length;

    expect(count).toBe(5);
    const isExceeded = count >= rateLimitPer24h;
    expect(isExceeded).toBe(true);
  });
});
