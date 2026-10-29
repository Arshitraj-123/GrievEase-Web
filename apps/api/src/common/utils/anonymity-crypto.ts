import crypto from 'crypto';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Encrypts submitter identity (e.g. { userId, flatId, fullName, flatNumber, mobile })
 * using AES-256-GCM.
 * Envelope: iv:authTag:ciphertext
 */
export function encryptSubmitter(
  identityObj: Record<string, any>,
  keyHex: string,
  keyVersion: string = 'v1'
): { encryptedPayload: string; keyVersion: string } {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ANON_ENCRYPTION_KEY must be a 32-byte (64 hex character) key.');
  }

  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plaintext = JSON.stringify(identityObj);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag

  const envelope = `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
  return {
    encryptedPayload: envelope,
    keyVersion,
  };
}

/**
 * Decrypts submitter identity from AES-256-GCM envelope.
 */
export function decryptSubmitter(envelope: string, keyHex: string): Record<string, any> {
  const parts = envelope.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed encrypted identity envelope.');
  }

  const iv = Buffer.from(parts[0]!, 'hex');
  const authTag = Buffer.from(parts[1]!, 'hex');
  const ciphertext = Buffer.from(parts[2]!, 'hex');

  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error('ANON_ENCRYPTION_KEY must be a 32-byte key.');
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

/**
 * Computes deterministic HMAC blind index for anonymous query lookup
 * and rate-limiting without revealing user identity in DB.
 */
export function generateBlindIndex(keyHex: string, societyId: string, userId: string): string {
  const key = Buffer.from(keyHex, 'hex');
  return crypto
    .createHmac('sha256', key)
    .update(`${societyId}:${userId}`)
    .digest('hex');
}

/**
 * Generates unambiguous 12-character tracking code (e.g. TRK-7K9P-2X4M).
 */
export function generateTrackingCode(): string {
  const bytes = crypto.randomBytes(8);
  let randomPart = '';
  for (let i = 0; i < 8; i++) {
    const b = bytes[i] ?? 0;
    randomPart += ALPHABET[b % ALPHABET.length] ?? '2';
  }
  return `TRK-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;
}

/**
 * SHA-256 hash of tracking code for constant-time DB lookup.
 */
export function hashTrackingCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
