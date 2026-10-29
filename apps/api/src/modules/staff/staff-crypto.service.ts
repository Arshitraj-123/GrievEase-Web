import { Injectable } from '@nestjs/common';
import crypto from 'crypto';

@Injectable()
export class StaffCryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly encKey: Buffer;
  private readonly blindIndexPepper: string;

  constructor() {
    // 32-byte key for AES-256-GCM
    const rawKey = process.env.STAFF_ENCRYPTION_KEY || 'grievease_staff_aes_256_key_32bytes_sec!';
    this.encKey = crypto.createHash('sha256').update(rawKey).digest();

    this.blindIndexPepper = process.env.STAFF_BLIND_PEPPER || 'grievease_staff_pepper_blind_idx_2026';
  }

  /**
   * Deterministic HMAC-SHA256 for phone duplicate detection (blind index)
   */
  computePhoneBlindIndex(phone: string): string {
    const normalized = phone.replace(/[^0-9]/g, '').slice(-10);
    return crypto
      .createHmac('sha256', this.blindIndexPepper)
      .update(normalized)
      .digest('hex');
  }

  /**
   * AES-256-GCM string encryption with 12-byte IV and 16-byte auth tag
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.encKey, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * AES-256-GCM string decryption
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const ivHex = parts[0];
    const authTagHex = parts[1];
    const encryptedText = parts[2];
    if (!ivHex || !authTagHex || !encryptedText) {
      throw new Error('Invalid ciphertext format');
    }
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.encKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Encrypt raw buffer (e.g. ID proof image) with AES-256-GCM
   */
  encryptBuffer(buffer: Buffer): Buffer {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.encKey, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Prepend 12-byte IV + 16-byte authTag + ciphertext
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt raw buffer with AES-256-GCM
   */
  decryptBuffer(encryptedBuffer: Buffer): Buffer {
    if (encryptedBuffer.length < 28) {
      throw new Error('Invalid encrypted buffer length');
    }
    const iv = encryptedBuffer.subarray(0, 12);
    const authTag = encryptedBuffer.subarray(12, 28);
    const ciphertext = encryptedBuffer.subarray(28);

    const decipher = crypto.createDecipheriv(this.algorithm, this.encKey, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}
