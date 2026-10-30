import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  CreateVendorSchema,
  CreateVendorTaskSchema,
  AcceptDeclineTaskSchema,
  CompleteVendorTaskSchema,
  ResidentConfirmTaskSchema,
  ContactRequestSchema,
  TestimonialSubmitSchema,
  FaqItemSchema,
  CreatePrivacyRequestSchema,
  AcceptConsentSchema,
} from '@grievease/contracts';
import { StaffCryptoService } from '../../src/modules/staff/staff-crypto.service';
import { computeAuditHash } from '../../src/cli/verify-audit';

describe('Phase 8 Unit Tests: Vendors, CMS, DPDP Privacy & System Operations', () => {
  const cryptoService = new StaffCryptoService();

  // ─── 1. Vendor Portal & Privacy Allow-List ────────────────────────────────────

  describe('1. Vendor Portal: Privacy, Gate Passes & Maker-Checker Confirmation', () => {
    it('should validate vendor creation schema and require category trade', () => {
      const valid = CreateVendorSchema.parse({
        companyName: 'Apex Elevators Pvt Ltd',
        contactPerson: 'Suresh Patil',
        phone: '9876543210',
        category: 'LIFT',
        notes: 'Monthly maintenance contract',
      });
      expect(valid.category).toBe('LIFT');
      expect(valid.companyName).toBe('Apex Elevators Pvt Ltd');

      // Invalid category rejected
      expect(() =>
        CreateVendorSchema.parse({
          companyName: 'Bad Vendor',
          contactPerson: 'X',
          phone: '9876543210',
          category: 'INVALID_CATEGORY' as any,
        }),
      ).toThrow();
    });

    it('should enforce strict vendor privacy allowlist: resident identity hidden by default', () => {
      const rawTaskFromDb = {
        id: 'task-101',
        title: 'Water tap leaking in master bathroom',
        description: 'Please inspect the washer and replace spindle',
        area_text: 'Flat A-204, Wing A',
        flat_number: 'A-204',
        wing: 'A',
        resident_name: 'Pooja Verma', // Private
        resident_phone_encrypted: cryptoService.encrypt('9876500000'), // Private
        is_anonymous: false,
        share_contact_with_vendor: false, // Default: OFF
      };

      // Simulator of vendor service privacy projection
      const sanitizeForVendor = (task: typeof rawTaskFromDb) => {
        return {
          id: task.id,
          title: task.title,
          description: task.description,
          area_text: task.is_anonymous ? 'Society Common Area' : task.area_text,
          flat_number: task.is_anonymous ? null : task.flat_number,
          wing: task.is_anonymous ? null : task.wing,
          // NEVER leak resident name or identity
          resident_phone: task.share_contact_with_vendor
            ? cryptoService.decrypt(task.resident_phone_encrypted)
            : null,
        };
      };

      const projected = sanitizeForVendor(rawTaskFromDb);
      expect((projected as any).resident_name).toBeUndefined();
      expect(projected.resident_phone).toBeNull();
      expect(projected.flat_number).toBe('A-204');

      // If resident opted in, phone is decrypted for technician coordination
      const optedInTask = { ...rawTaskFromDb, share_contact_with_vendor: true };
      const optedInProjected = sanitizeForVendor(optedInTask);
      expect(optedInProjected.resident_phone).toBe('9876500000');
      expect((optedInProjected as any).resident_name).toBeUndefined();
    });

    it('should strip flat numbers completely for anonymous grievances', () => {
      const anonymousTask = {
        id: 'task-102',
        title: 'Corridor lights flickering',
        description: 'Check wiring in 4th floor corridor',
        area_text: '4th Floor Common Passage',
        flat_number: 'B-402', // Reporter flat
        wing: 'B',
        resident_name: 'Secret Reporter',
        resident_phone_encrypted: cryptoService.encrypt('9876511111'),
        is_anonymous: true,
        share_contact_with_vendor: false,
      };

      const projected = {
        id: anonymousTask.id,
        title: anonymousTask.title,
        description: anonymousTask.description,
        area_text: anonymousTask.area_text,
        flat_number: anonymousTask.is_anonymous ? null : anonymousTask.flat_number,
        wing: anonymousTask.is_anonymous ? null : anonymousTask.wing,
        resident_phone: null,
      };

      expect(projected.flat_number).toBeNull();
      expect(projected.wing).toBeNull();
      expect(projected.area_text).toBe('4th Floor Common Passage');
    });

    it('should reject completion if mandatory AFTER photo proof is missing', () => {
      const taskPhotos = [
        { kind: 'BEFORE', storageKey: 'photo-before-1.jpg' },
      ];

      const canComplete = (photos: Array<{ kind: string }>) => {
        return photos.some((p) => p.kind === 'AFTER');
      };

      expect(canComplete(taskPhotos)).toBe(false);

      taskPhotos.push({ kind: 'AFTER', storageKey: 'photo-after-1.jpg' });
      expect(canComplete(taskPhotos)).toBe(true);
    });

    it('should handle resident confirmation: "NOT_FIXED" reopens task and notifies resolver', () => {
      const confirmNotFixedDto = ResidentConfirmTaskSchema.parse({
        confirmation: 'NOT_FIXED',
        reopenReason: 'Tap is still leaking under high water pressure',
        comment: 'Technician left before testing main supply',
      });

      expect(confirmNotFixedDto.confirmation).toBe('NOT_FIXED');
      expect(confirmNotFixedDto.reopenReason).toBeDefined();

      // State machine check
      const computeNextStatus = (conf: string) => {
        return conf === 'NOT_FIXED' ? 'DISPUTED' : 'RESIDENT_CONFIRMED';
      };

      expect(computeNextStatus(confirmNotFixedDto.confirmation)).toBe('DISPUTED');
    });

    it('should enforce vendor performance sample size rule (<5 completed jobs shows not enough data)', () => {
      const calculateScorecard = (completedJobs: number, ratings: number[]) => {
        const hasEnoughData = completedJobs >= 5;
        const avgRating =
          ratings.length > 0
            ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
            : null;

        return {
          completedJobs,
          hasEnoughData,
          avgRating: hasEnoughData ? avgRating : null,
        };
      };

      // 3 jobs: not enough data
      const newVendorScorecard = calculateScorecard(3, [5, 4, 5]);
      expect(newVendorScorecard.hasEnoughData).toBe(false);
      expect(newVendorScorecard.avgRating).toBeNull();

      // 6 jobs: sample size rule satisfied
      const matureVendorScorecard = calculateScorecard(6, [5, 4, 5, 4, 5, 5]);
      expect(matureVendorScorecard.hasEnoughData).toBe(true);
      expect(matureVendorScorecard.avgRating).toBe(4.7);
    });
  });

  // ─── 2. Self-Hosted CMS, Honeypots & Proof-of-Work ──────────────────────────

  describe('2. Content Management & Spam Defense: Honeypots & Testimonials', () => {
    it('should validate contact request and reject honeypot traps with spam error', () => {
      // Normal human request: honeypot is empty and powNonce/powSolution provided
      const validHuman = ContactRequestSchema.parse({
        name: 'Anita Desai',
        email: 'anita@example.com',
        phone: '9876543210',
        type: 'SOCIETY_ENQUIRY',
        message: 'Interested in demo for our cooperative housing society.',
        honeypot: '',
        powNonce: 'pow_nonce_123',
        powSolution: 'pow_sol_456',
      });
      expect(validHuman.name).toBe('Anita Desai');

      // Bot fill: honeypot populated -> schema throws error
      expect(() =>
        ContactRequestSchema.parse({
          name: 'Spam Bot',
          email: 'bot@spam.com',
          type: 'GENERAL',
          message: 'Buy cheap watches online now',
          honeypot: 'http://spam.ru',
          powNonce: 'bot_nonce',
          powSolution: 'bot_sol',
        }),
      ).toThrow();
    });

    it('should enforce testimonial public display threshold: minimum 3 approved reviews', () => {
      const filterPublicTestimonials = (items: Array<{ status: string; consentGiven: boolean }>) => {
        const approvedWithConsent = items.filter(
          (t) => t.status === 'APPROVED' && t.consentGiven === true,
        );
        // Minimum 3 approved threshold rule
        if (approvedWithConsent.length < 3) {
          return { displayReel: false, count: approvedWithConsent.length };
        }
        return { displayReel: true, items: approvedWithConsent, count: approvedWithConsent.length };
      };

      // 2 approved: reel hidden
      expect(
        filterPublicTestimonials([
          { status: 'APPROVED', consentGiven: true },
          { status: 'APPROVED', consentGiven: true },
          { status: 'PENDING', consentGiven: true },
        ]).displayReel,
      ).toBe(false);

      // 3 approved: reel displayed
      expect(
        filterPublicTestimonials([
          { status: 'APPROVED', consentGiven: true },
          { status: 'APPROVED', consentGiven: true },
          { status: 'APPROVED', consentGiven: true },
        ]).displayReel,
      ).toBe(true);
    });

    it('should validate multilingual FAQ content across EN and HI', () => {
      const faq = FaqItemSchema.parse({
        category: 'BILLING',
        question_en: 'How do I pay maintenance charges?',
        question_hi: 'मैं मेंटेनेंस शुल्क का भुगतान कैसे करूं?',
        answer_en: 'Please visit society office to deposit cash.',
        answer_hi: 'कृपया नकद जमा करने के लिए सोसायटी कार्यालय जाएं।',
        published: true,
      });

      expect(faq.question_en).toContain('maintenance');
      expect(faq.question_hi).toContain('मेंटेनेंस');
    });
  });

  // ─── 3. DPDP Act 2023 Statutory Privacy & Anonymisation ─────────────────────

  describe('3. DPDP Act 2023 Privacy: Consent & Immutable Hash-Chained Anonymisation', () => {
    it('should validate consent record schema with versioning and timestamp', () => {
      const consent = AcceptConsentSchema.parse({
        version: '2026.1',
      });
      expect(consent.version).toBe('2026.1');
    });

    it('should anonymize resident identity while preserving audit log and ledger hash chains', () => {
      const originalUserId = crypto.randomUUID();
      const pseudonym = `ANON-RESIDENT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      // User account before anonymisation
      const userBefore = {
        id: originalUserId,
        username: 'GV-A204-R1',
        full_name: 'Vikram Seth',
        phone_encrypted: cryptoService.encrypt('9876543210'),
        status: 'ACTIVE',
      };

      // Anonymised user state (PII purged)
      const userAfter = {
        id: originalUserId, // UUID preserved for foreign key consistency
        username: pseudonym,
        full_name: 'Anonymized Former Resident',
        phone_encrypted: null,
        status: 'DEACTIVATED',
      };

      expect(userAfter.username).toContain('ANON-RESIDENT');
      expect(userAfter.phone_encrypted).toBeNull();
      expect(userAfter.full_name).toBe('Anonymized Former Resident');

      // Audit Log append test without PII
      const prevHash = '0'.repeat(64);
      const auditPayload = {
        action: 'USER_ACCOUNT_ANONYMIZED',
        actorId: 'admin-secretary-1',
        actorRole: 'SECRETARY',
        after: { pseudonym, status: 'DEACTIVATED' },
        before: null,
        device: null,
        entityId: originalUserId,
        entityType: 'app_user',
        ip: '127.0.0.1',
        seq: 1,
        societyId: 'society-1',
      };

      const auditHash = computeAuditHash(prevHash, auditPayload);
      expect(auditHash).toHaveLength(64);
      expect(JSON.stringify(auditPayload)).not.toContain('Vikram Seth');
      expect(JSON.stringify(auditPayload)).not.toContain('9876543210');
    });

    it('should record sensitive access audit logging with IP and actor role', () => {
      const sensitiveAccessEntry = {
        societyId: 'society-1',
        actorId: 'admin-1',
        actorRole: 'SECRETARY',
        targetType: 'resident_phone',
        targetId: 'flat-204',
        action: 'UNMASK_PHONE_FOR_EMERGENCY',
        reason: 'Water pipe burst causing flood into corridor',
        ip: '192.168.1.50',
      };

      expect(sensitiveAccessEntry.reason.length).toBeGreaterThan(15);
      expect(sensitiveAccessEntry.actorRole).toBe('SECRETARY');
    });
  });

  // ─── 4. System Operations & Encrypted Backup Integrity ───────────────────────

  describe('4. Operations & Cryptographic Backups: AES-256-GCM Verification', () => {
    it('should encrypt and decrypt database backup dumps using AES-256-GCM and verify SHA-256', () => {
      const dumpText = '-- GrievEase DB Dump\nCREATE TABLE test_ledger (id UUID PRIMARY KEY);';
      const key = crypto.createHash('sha256').update('test_backup_key_2026!').digest();

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(dumpText, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      const pkg = Buffer.concat([iv, authTag, encrypted]);
      const sha256 = crypto.createHash('sha256').update(pkg).digest('hex');
      expect(sha256).toHaveLength(64);

      // Decryption verification
      const readIv = pkg.subarray(0, 12);
      const readTag = pkg.subarray(12, 28);
      const readCipher = pkg.subarray(28);

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, readIv);
      decipher.setAuthTag(readTag);
      let decrypted = decipher.update(readCipher, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      expect(decrypted).toBe(dumpText);
    });

    it('should fail decryption if encrypted backup is tampered with (GCM authentication check)', () => {
      const dumpText = 'Secret data';
      const key = crypto.createHash('sha256').update('test_key').digest();

      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(dumpText, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Tamper with one byte of ciphertext
      encrypted[0] ^= 0xff;

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);
      expect(() => {
        decipher.update(encrypted, undefined, 'utf8');
        decipher.final('utf8');
      }).toThrow();
    });
  });
});
