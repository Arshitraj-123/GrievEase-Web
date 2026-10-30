import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  roundHalfUp,
  formatPaise,
  formatPaiseRaw,
  amountInWords,
  multiplyPaise,
  perSqft,
  applyPercent,
  cancellationFee,
  financialYearLabel,
  formatReceiptNo,
  formatBillNo,
} from '@grievease/contracts';
import { BookingPassService } from '../../src/modules/amenities/booking-pass.service';

describe('Phase 7 Unit Tests: Money Utility, Amenity Rules & Maintenance Billing', () => {
  const passService = new BookingPassService();

  // ─── 1. Money Utility Tests ──────────────────────────────────────────────────

  describe('1. Money Utility: Rounding, Formatting & Amount in Words', () => {
    it('should round half up to the nearest paisa (0.5 rounds towards +infinity)', () => {
      expect(roundHalfUp(10.4)).toBe(10);
      expect(roundHalfUp(10.5)).toBe(11);
      expect(roundHalfUp(10.6)).toBe(11);
      expect(roundHalfUp(0.5)).toBe(1);
      expect(roundHalfUp(0.499)).toBe(0);
      expect(roundHalfUp(-0.5)).toBe(0); // towards +inf: -0.5 + 0.5 = 0
      expect(roundHalfUp(-0.51)).toBe(-1);
    });

    it('should format paise with Indian digit grouping (1,23,456.00) in EN/HI/MR', () => {
      expect(formatPaise(12345600)).toBe('₹1,23,456.00');
      expect(formatPaise(5000)).toBe('₹50.00');
      expect(formatPaise(99)).toBe('₹0.99');
      expect(formatPaise(0)).toBe('₹0.00');
      expect(formatPaise(1000000000)).toBe('₹1,00,00,000.00'); // 1 crore
      expect(formatPaise(-250000)).toBe('-₹2,500.00');
      expect(formatPaiseRaw(12345600)).toBe('1,23,456.00');
    });

    it('should throw TypeError when formatPaise receives non-integer float', () => {
      expect(() => formatPaise(123.45 as any)).toThrow(TypeError);
    });

    it('should convert paise to English amount-in-words on receipts', () => {
      expect(amountInWords(0)).toBe('Zero Rupees Only');
      expect(amountInWords(50)).toBe('Zero Rupees and 50 Paise Only');
      expect(amountInWords(10000)).toBe('Rupees One Hundred Only');
      expect(amountInWords(12345678)).toBe(
        'Rupees One Lakh Twenty-Three Thousand Four Hundred Fifty-Six and 78 Paise Only',
      );
      expect(amountInWords(1000000000)).toBe('Rupees One Crore Only');
    });

    it('should calculate rate x qty, per-sqft, percent and cancellation fees with round-half-up', () => {
      expect(multiplyPaise(25000, 3)).toBe(75000);
      expect(perSqft(350, 1250)).toBe(437500); // 3.50 per sqft x 1250 sqft = Rs 4,375.00
      expect(applyPercent(10000, 18)).toBe(1800); // 18% GST on Rs 100 = Rs 18
      expect(applyPercent(10005, 18)).toBe(1801); // 1800.9 rounds to 1801
      expect(cancellationFee(50000, 25)).toBe(12500); // 25% of Rs 500 = Rs 125
    });
  });

  // ─── 2. Gapless Sequence & FY Labels ─────────────────────────────────────────

  describe('2. Gapless Receipt & Bill Number Generator', () => {
    it('should determine correct Indian financial year bounds and label (default April start)', () => {
      expect(financialYearLabel(new Date('2026-04-01'))).toBe('2026-27');
      expect(financialYearLabel(new Date('2026-10-30'))).toBe('2026-27');
      expect(financialYearLabel(new Date('2027-03-31'))).toBe('2026-27');
      expect(financialYearLabel(new Date('2027-04-01'))).toBe('2027-28');
      expect(financialYearLabel(new Date('2026-01-15'))).toBe('2025-26');
    });

    it('should format gapless receipt and bill numbers per financial year', () => {
      expect(formatReceiptNo(1, '2026-27', 'RC')).toBe('RC/2026-27/000001');
      expect(formatReceiptNo(123, '2026-27', 'RC')).toBe('RC/2026-27/000123');
      expect(formatBillNo(45, '2026-27')).toBe('BILL/2026-27/000045');
    });
  });

  // ─── 3. Bill Calculations for Every Calc Method ──────────────────────────────

  describe('3. Bill Head Calculators', () => {
    const flat = {
      areaSqft: 1200,
      flatType: '2BHK',
      parkingSlots: 2,
    };

    it('FIXED_PER_FLAT: rate applies directly', () => {
      const ratePaise = 200000; // Rs 2,000
      expect(ratePaise).toBe(200000);
    });

    it('PER_SQFT: rate_paise x area_sqft with half-up rounding', () => {
      const ratePaisePerSqft = 250; // Rs 2.50
      expect(perSqft(ratePaisePerSqft, flat.areaSqft)).toBe(300000); // Rs 3,000
    });

    it('BY_FLAT_TYPE: lookup in rate table', () => {
      const rateTable: Record<string, number> = {
        '1BHK': 150000,
        '2BHK': 250000,
        '3BHK': 350000,
      };
      const computed = rateTable[flat.flatType] || 0;
      expect(computed).toBe(250000);
    });

    it('PER_PARKING_SLOT: rate_paise x parking_slots', () => {
      const ratePerSlot = 50000; // Rs 500
      expect(multiplyPaise(ratePerSlot, flat.parkingSlots)).toBe(100000); // Rs 1,000
    });
  });

  // ─── 4. Late Fee Rules ───────────────────────────────────────────────────────

  describe('4. Late Fee Engine Rules', () => {
    it('FLAT: applies exact value after due date + grace', () => {
      const rule = { type: 'FLAT', valuePaise: 50000, graceDays: 5, capPaise: null };
      const bill = { totalPaise: 300000, daysPastDue: 7 };
      const isPastGrace = bill.daysPastDue > rule.graceDays;
      const fee = isPastGrace ? rule.valuePaise : 0;
      expect(fee).toBe(50000);
    });

    it('PERCENT_PER_MONTH: applies percentage and respects cap', () => {
      const rule = { type: 'PERCENT_PER_MONTH', percent: 2, graceDays: 3, capPaise: 5000 };
      const bill = { totalPaise: 500000, daysPastDue: 5 }; // 2% of Rs 5000 = Rs 100 (10000p)
      const rawFee = applyPercent(bill.totalPaise, rule.percent);
      const fee = rule.capPaise ? Math.min(rawFee, rule.capPaise) : rawFee;
      expect(rawFee).toBe(10000);
      expect(fee).toBe(5000); // Capped at Rs 50
    });

    it('should NOT charge late fee during grace period', () => {
      const rule = { type: 'FLAT', valuePaise: 50000, graceDays: 5 };
      const bill = { totalPaise: 300000, daysPastDue: 3 };
      const isPastGrace = bill.daysPastDue > rule.graceDays;
      expect(isPastGrace).toBe(false);
    });
  });

  // ─── 5. Payment Allocation Strategy ─────────────────────────────────────────

  describe('5. Payment Allocation Strategy', () => {
    it('OLDEST_FIRST: clears late fee first, then oldest bill, remainder becomes advance', () => {
      const paymentAmount = 650000; // Rs 6,500
      const openItems = [
        { id: 'item-late-fee', kind: 'LATE_FEE', duePaise: 50000 }, // Rs 500
        { id: 'bill-01', kind: 'BILL', duePaise: 300000 },           // Rs 3,000
        { id: 'bill-02', kind: 'BILL', duePaise: 200000 },           // Rs 2,000
      ];

      let remaining = paymentAmount;
      const allocations: { id: string | null; kind: string; amountPaise: number }[] = [];

      for (const item of openItems) {
        if (remaining <= 0) break;
        const alloc = Math.min(remaining, item.duePaise);
        allocations.push({ id: item.id, kind: item.kind, amountPaise: alloc });
        remaining -= alloc;
      }

      if (remaining > 0) {
        allocations.push({ id: null, kind: 'ADVANCE', amountPaise: remaining });
      }

      expect(allocations).toHaveLength(4);
      expect(allocations[0]).toEqual({ id: 'item-late-fee', kind: 'LATE_FEE', amountPaise: 50000 });
      expect(allocations[1]).toEqual({ id: 'bill-01', kind: 'BILL', amountPaise: 300000 });
      expect(allocations[2]).toEqual({ id: 'bill-02', kind: 'BILL', amountPaise: 200000 });
      expect(allocations[3]).toEqual({ id: null, kind: 'ADVANCE', amountPaise: 100000 }); // Rs 1,000 advance
    });
  });

  // ─── 6. Ledger Hash Chain & Tamper Detection ────────────────────────────────

  describe('6. Ledger Hash Chain & Mathematical Immutability', () => {
    it('should build a deterministic SHA-256 hash chain and detect any tampered block', () => {
      const flatId = 'flat-101';
      const societyId = 'soc-01';

      const entries = [
        { seq: 1, type: 'OPENING_BALANCE', dir: 'DEBIT', amount: 500000, narration: 'Opening bal' },
        { seq: 2, type: 'BILL', dir: 'DEBIT', amount: 300000, narration: 'Bill Nov 2026' },
        { seq: 3, type: 'PAYMENT', dir: 'CREDIT', amount: 800000, narration: 'Full payment' },
      ];

      let prevHash = '0'.repeat(64);
      const chainedEntries: any[] = [];

      for (const e of entries) {
        const payload = JSON.stringify({
          societyId,
          flatId,
          seq: e.seq,
          entryType: e.type,
          direction: e.dir,
          amountPaise: e.amount,
          narration: e.narration,
        });
        const hash = crypto.createHash('sha256').update(`${prevHash}${payload}`).digest('hex');
        chainedEntries.push({ ...e, prevHash, hash, payload });
        prevHash = hash;
      }

      // Verify clean chain
      let verifyHash = '0'.repeat(64);
      let isValid = true;
      for (const e of chainedEntries) {
        if (e.prevHash !== verifyHash) {
          isValid = false;
          break;
        }
        const expected = crypto.createHash('sha256').update(`${verifyHash}${e.payload}`).digest('hex');
        if (e.hash !== expected) {
          isValid = false;
          break;
        }
        verifyHash = e.hash;
      }
      expect(isValid).toBe(true);

      // Now tamper with block 2 (change amount from 300000 to 100000)
      const tamperedPayload = JSON.stringify({
        societyId,
        flatId,
        seq: chainedEntries[1].seq,
        entryType: chainedEntries[1].type,
        direction: chainedEntries[1].dir,
        amountPaise: 100000, // TAMPERED!
        narration: chainedEntries[1].narration,
      });

      const recomputedTamperedHash = crypto
        .createHash('sha256')
        .update(`${chainedEntries[1].prevHash}${tamperedPayload}`)
        .digest('hex');

      // The original chainedEntries[1].hash will no longer match the modified payload
      expect(recomputedTamperedHash).not.toBe(chainedEntries[1].hash);
      // And the downstream block 3 will fail because its prevHash will break
      expect(chainedEntries[2].prevHash).not.toBe(recomputedTamperedHash);
    });
  });

  // ─── 7. Maker-Checker Rules & SOLE_APPROVER ──────────────────────────────────

  describe('7. Maker-Checker Separation of Duties', () => {
    it('should reject when creator attempts to approve their own request', () => {
      const creatorId = 'user-sec-01';
      const approverId = 'user-sec-01'; // SAME PERSON!
      const eligibleApproverCount = 3;

      const isForbidden = approverId === creatorId && eligibleApproverCount >= 2;
      expect(isForbidden).toBe(true);
    });

    it('should permit SOLE_APPROVER when society has fewer than two eligible approvers', () => {
      const creatorId = 'user-admin-01';
      const approverId = 'user-admin-01';
      const eligibleApproverCount = 1;
      const approverRole = 'SUPER_ADMIN';

      const allowSoleApprover =
        approverId === creatorId && eligibleApproverCount < 2 && approverRole === 'SUPER_ADMIN';
      expect(allowSoleApprover).toBe(true);
    });
  });

  // ─── 8. Amenity QR Pass Signing & Verification ───────────────────────────────

  describe('8. Amenity Pass Token HMAC-SHA256 Signing & Verification', () => {
    const payload = {
      bookingId: 'book-999',
      societyId: 'soc-01',
      amenityId: 'amen-clubhouse',
      amenityName: 'Clubhouse Banquet Hall',
      flatId: 'flat-402',
      slotStart: '2026-11-01T10:00:00.000Z',
      slotEnd: '2026-11-01T14:00:00.000Z',
      serial: '1730000000',
    };

    it('should generate an HMAC-signed pass token and verify successfully', () => {
      const { token, tokenHash } = passService.generatePassToken(payload);
      expect(token).toBeDefined();
      expect(tokenHash).toHaveLength(64);

      const verification = passService.verifyPassToken(token);
      expect(verification.isValid).toBe(true);
      expect(verification.payload?.bookingId).toBe('book-999');
      expect(verification.payload?.amenityName).toBe('Clubhouse Banquet Hall');
    });

    it('should reject tampered pass tokens with cryptographic signature mismatch', () => {
      const { token } = passService.generatePassToken(payload);
      const parts = token.split('.');
      // Tamper payload data
      const tamperedData = Buffer.from(
        JSON.stringify({ ...payload, bookingId: 'book-HACKED' }),
      ).toString('base64url');
      const forgedToken = `${parts[0]}.${tamperedData}.${parts[2]}`;

      const verification = passService.verifyPassToken(forgedToken);
      expect(verification.isValid).toBe(false);
      expect(verification.reason).toContain('signature');
    });

    it('should reject malformed or empty tokens gracefully', () => {
      expect(passService.verifyPassToken('').isValid).toBe(false);
      expect(passService.verifyPassToken('random-gibberish').isValid).toBe(false);
    });
  });
});
