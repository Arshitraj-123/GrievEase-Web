import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

export interface BookingPassPayload {
  bookingId: string;
  societyId: string;
  amenityId: string;
  amenityName: string;
  flatId: string;
  slotStart: string;
  slotEnd: string;
  serial: string;
}

/**
 * Amenity Booking Pass Service
 * Uses the same HMAC-SHA256 pattern as VisitorPassService
 * Format: {keyVersion}.{base64url(JSON payload)}.{HMAC-SHA256 signature}
 */
@Injectable()
export class BookingPassService {
  private readonly passSecret: string;
  private readonly keyVersion: string;

  constructor() {
    this.passSecret =
      process.env.AMENITY_PASS_SECRET ||
      'grievease_amenity_booking_pass_hmac_secret_2026_key!';
    this.keyVersion = process.env.AMENITY_PASS_KEY_VERSION || 'v1';
  }

  /**
   * Generate an HMAC-signed booking pass token for QR display
   */
  generatePassToken(payload: BookingPassPayload): { token: string; tokenHash: string } {
    const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr)
      .digest('hex');

    const token = `${this.keyVersion}.${dataStr}.${signature}`;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, tokenHash };
  }

  /**
   * Verify a booking pass token (constant-time signature check)
   */
  verifyPassToken(token: string): {
    isValid: boolean;
    payload?: BookingPassPayload;
    reason?: string;
  } {
    if (!token || typeof token !== 'string') {
      return { isValid: false, reason: 'Missing pass token' };
    }

    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1] || !parts[2]) {
      return { isValid: false, reason: 'Malformed pass token format' };
    }

    const [, dataStr, signature] = parts;
    const expectedSignature = crypto
      .createHmac('sha256', this.passSecret)
      .update(dataStr!)
      .digest('hex');

    const sigBuf = Buffer.from(signature!, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { isValid: false, reason: 'Invalid cryptographic pass signature' };
    }

    try {
      const payload: BookingPassPayload = JSON.parse(
        Buffer.from(dataStr!, 'base64url').toString('utf8'),
      );
      return { isValid: true, payload };
    } catch {
      return { isValid: false, reason: 'Invalid token payload' };
    }
  }
}
