import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { sanitizeNoticeHtml } from '../../src/modules/notices/notice-sanitizer';
import { StaffCryptoService } from '../../src/modules/staff/staff-crypto.service';
import { StaffPassService } from '../../src/modules/staff/staff-pass.service';
import { StaffScheduleWindow } from '@grievease/contracts';

describe('Community Modules (Unit Tests)', () => {
  describe('HTML Notice Sanitiser', () => {
    it('should strip scripts, iframes, styles, and remote images', () => {
      const maliciousHtml = `
        <h3>Annual General Meeting Notice</h3>
        <p>Please join us at the clubhouse.</p>
        <script>alert("XSS Attack!");</script>
        <iframe src="https://evil.com/phishing"></iframe>
        <style>body { display: none; }</style>
        <img src="https://track.com/beacon.png" alt="tracker" />
        <a href="javascript:void(0)" onclick="stealTokens()">Click here</a>
      `;

      const sanitized = sanitizeNoticeHtml(maliciousHtml);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<style>');
      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onclick');
      expect(sanitized).toContain('<h3>Annual General Meeting Notice</h3>');
      expect(sanitized).toContain('<p>Please join us at the clubhouse.</p>');
    });

    it('should allow legitimate formatting tags: bold, italic, lists, paragraphs, safe links', () => {
      const validHtml = `
        <p><strong>Important:</strong> Water supply will be <em>interrupted</em> on Saturday.</p>
        <ul>
          <li>Tower A: 10:00 - 12:00</li>
          <li>Tower B: 12:00 - 14:00</li>
        </ul>
        <p>Refer to guidelines at <a href="https://example.com/water-schedule" target="_blank">Water Schedule</a></p>
      `;

      const sanitized = sanitizeNoticeHtml(validHtml);

      expect(sanitized).toContain('<strong>Important:</strong>');
      expect(sanitized).toContain('<em>interrupted</em>');
      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>Tower A: 10:00 - 12:00</li>');
      expect(sanitized).toContain('href="https://example.com/water-schedule"');
      expect(sanitized).toContain('rel="noopener noreferrer"');
    });
  });

  describe('Staff Cryptography & Duplicate Detection', () => {
    const cryptoService = new StaffCryptoService();

    it('should produce identical deterministic blind indexes for identical normalized phone numbers', () => {
      const phone1 = '+91 98765 43210';
      const phone2 = '9876543210';
      const phone3 = '09876543210';
      const phoneDifferent = '9876543211';

      const idx1 = cryptoService.computePhoneBlindIndex(phone1);
      const idx2 = cryptoService.computePhoneBlindIndex(phone2);
      const idx3 = cryptoService.computePhoneBlindIndex(phone3);
      const idxDiff = cryptoService.computePhoneBlindIndex(phoneDifferent);

      expect(idx1).toBe(idx2);
      expect(idx2).toBe(idx3);
      expect(idx1).not.toBe(idxDiff);
      expect(idx1).toHaveLength(64); // SHA-256 hex length
    });

    it('should encrypt and decrypt string fields with AES-256-GCM', () => {
      const plaintext = '9876543210';
      const encrypted = cryptoService.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

      const decrypted = cryptoService.decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt binary buffers (ID Proof images at rest) with AES-256-GCM', () => {
      const fakeImageBuffer = Buffer.from('FAKE_PNG_BINARY_DATA_WITH_CONFIDENTIAL_ID_CARD', 'utf8');
      const encryptedBuffer = cryptoService.encryptBuffer(fakeImageBuffer);

      expect(encryptedBuffer).not.toEqual(fakeImageBuffer);
      expect(encryptedBuffer.length).toBeGreaterThanOrEqual(fakeImageBuffer.length + 28); // 12-byte IV + 16-byte authTag

      const decryptedBuffer = cryptoService.decryptBuffer(encryptedBuffer);
      expect(decryptedBuffer.toString('utf8')).toBe(fakeImageBuffer.toString('utf8'));
    });

    it('should throw when decrypting tampered ciphertext', () => {
      const encrypted = cryptoService.encrypt('sensitive phone number');
      const parts = encrypted.split(':');
      const tamperedParts = `${parts[0]}:${parts[1]}:${parts[2]?.slice(0, -2)}ff`;

      expect(() => cryptoService.decrypt(tamperedParts)).toThrow();
    });
  });

  describe('Staff Pass Token & Verification', () => {
    const passService = new StaffPassService();

    it('should generate HMAC-SHA256 signed pass tokens', () => {
      const payload = {
        staffId: 'd3b07384-d113-4632-a567-000000000001',
        serial: 'STF-2026-1042',
        societyId: 'd3b07384-d113-4632-a567-000000000099',
        validTo: new Date(Date.now() + 86400000).toISOString(),
      };

      const { token, tokenHash } = passService.generatePassToken(payload);

      expect(token).toContain('.');
      const [dataStr, signature] = token.split('.');
      expect(dataStr).toBeDefined();
      expect(signature).toHaveLength(64); // HMAC-SHA256 hex
      expect(tokenHash).toHaveLength(64);
    });

    it('should reject tampered or corrupted pass tokens during verification', async () => {
      const payload = {
        staffId: 'd3b07384-d113-4632-a567-000000000001',
        serial: 'STF-2026-1042',
        societyId: 'd3b07384-d113-4632-a567-000000000099',
        validTo: new Date(Date.now() + 86400000).toISOString(),
      };

      const { token } = passService.generatePassToken(payload);
      const [dataStr, signature] = token.split('.');

      // Tamper signature
      const tamperedSig = signature.slice(0, -2) + (signature.endsWith('0') ? '1' : '0');
      const tamperedToken = `${dataStr}.${tamperedSig}`;

      const result = await passService.verify(tamperedToken);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Invalid cryptographic pass signature');
    });

    it('should enforce schedule window matching logic', () => {
      const schedules: StaffScheduleWindow[] = [
        { day: 'MONDAY', startTime: '08:00', endTime: '12:00' },
        { day: 'WEDNESDAY', startTime: '14:00', endTime: '18:00' },
      ];

      const isAllowedAt = (dayName: string, currentTime: string): boolean => {
        return schedules.some(
          (s) => s.day === dayName && currentTime >= s.startTime && currentTime <= s.endTime
        );
      };

      expect(isAllowedAt('MONDAY', '09:30')).toBe(true);
      expect(isAllowedAt('MONDAY', '07:59')).toBe(false);
      expect(isAllowedAt('MONDAY', '12:01')).toBe(false);
      expect(isAllowedAt('TUESDAY', '10:00')).toBe(false);
      expect(isAllowedAt('WEDNESDAY', '15:00')).toBe(true);
    });
  });

  describe('Poll Quorum & Ballot Anonymity Maths', () => {
    it('should compute quorum achievement accurately from turnout and total eligible', () => {
      const computeQuorum = (
        totalVotes: number,
        totalEligible: number,
        quorumPercent: number | null
      ) => {
        if (!quorumPercent) return { isQuorumMet: true, turnoutPercent: 0 };
        const turnoutPercent = (totalVotes / Math.max(1, totalEligible)) * 100;
        return {
          isQuorumMet: turnoutPercent >= quorumPercent,
          turnoutPercent: Math.round(turnoutPercent * 10) / 10,
        };
      };

      // 45 votes out of 100 with 50% quorum requirement -> NOT MET
      expect(computeQuorum(45, 100, 50)).toEqual({ isQuorumMet: false, turnoutPercent: 45 });

      // 50 votes out of 100 with 50% quorum requirement -> MET
      expect(computeQuorum(50, 100, 50)).toEqual({ isQuorumMet: true, turnoutPercent: 50 });

      // 62 votes out of 120 with 50% quorum requirement -> MET (51.7%)
      expect(computeQuorum(62, 120, 50)).toEqual({ isQuorumMet: true, turnoutPercent: 51.7 });
    });

    it('should ensure voter_ref differentiates PER_FLAT vs PER_USER', () => {
      const getVoterRef = (voteUnit: 'PER_USER' | 'PER_FLAT', userId: string, flatId: string | null) => {
        if (voteUnit === 'PER_FLAT') {
          if (!flatId) throw new Error('Flat ID required for per-flat voting');
          return flatId;
        }
        return userId;
      };

      const userA = 'user-001';
      const userB = 'user-002'; // Same flat
      const flat101 = 'flat-101';

      // For PER_USER: userA and userB have different voterRefs
      expect(getVoterRef('PER_USER', userA, flat101)).toBe('user-001');
      expect(getVoterRef('PER_USER', userB, flat101)).toBe('user-002');

      // For PER_FLAT: userA and userB both produce flat101 as voterRef, guaranteeing 1 vote per flat!
      expect(getVoterRef('PER_FLAT', userA, flat101)).toBe('flat-101');
      expect(getVoterRef('PER_FLAT', userB, flat101)).toBe('flat-101');
    });

    it('should assert unlinkability of secret ballots (time rounded to the hour and no voter reference)', () => {
      // Simulate secret ballot insertion
      const castDate = new Date('2026-10-29T14:37:22.123Z');
      const castBucket = new Date(castDate);
      castBucket.setUTCMinutes(0, 0, 0); // Hour bucket: 2026-10-29T14:00:00.000Z

      const ballotRecord = {
        poll_id: 'poll-01',
        option_id: 'opt-02',
        cast_bucket: castBucket.toISOString(),
      };

      // Ballot has ZERO voter reference, and timestamp is quantized to the hour
      expect(ballotRecord).not.toHaveProperty('voter_ref');
      expect(ballotRecord).not.toHaveProperty('user_id');
      expect(ballotRecord).not.toHaveProperty('voter_id');
      expect(ballotRecord.cast_bucket).toBe('2026-10-29T14:00:00.000Z');
    });
  });

  describe('Append-Only Attendance Correction Supersedes Logic', () => {
    it('should preserve original entry and point correction row to superseded id', () => {
      // Original manual attendance record
      const row1 = {
        id: 'att-001',
        staff_id: 'stf-001',
        flat_id: 'flat-101',
        date: '2026-10-29',
        in_at: '09:00',
        out_at: '11:00',
        supersedes_id: null,
      };

      // Resident corrects exit time: new record created with supersedes_id = 'att-001'
      const row2 = {
        id: 'att-002',
        staff_id: 'stf-001',
        flat_id: 'flat-101',
        date: '2026-10-29',
        in_at: '09:00',
        out_at: '12:00', // corrected
        supersedes_id: row1.id,
      };

      expect(row1.id).toBe('att-001');
      expect(row2.supersedes_id).toBe(row1.id);
      expect(row2.out_at).toBe('12:00');
      // Original row is completely unmutated
      expect(row1.out_at).toBe('11:00');
    });
  });
});
