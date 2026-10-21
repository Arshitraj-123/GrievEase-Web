import crypto from 'crypto';
import * as argon2 from 'argon2';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function normalizeSecurityAnswer(answer: string): string {
  if (!answer) return '';
  return answer.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function validateSecurityAnswer(
  rawAnswer: string,
  userMetadata: { username?: string; mobile?: string; flat?: string; fullName?: string } = {}
): { valid: boolean; normalized: string; reason?: string } {
  const normalized = normalizeSecurityAnswer(rawAnswer);

  if (normalized.length < 6) {
    return { valid: false, normalized, reason: 'Answer must be at least 6 characters (excluding spaces/symbols).' };
  }

  const lowerName = (userMetadata.fullName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const lowerUser = (userMetadata.username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const lowerFlat = (userMetadata.flat || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (lowerName && normalized.includes(lowerName)) {
    return { valid: false, normalized, reason: 'Answer must not contain your name.' };
  }
  if (lowerUser && normalized.includes(lowerUser)) {
    return { valid: false, normalized, reason: 'Answer must not contain your username.' };
  }
  if (lowerFlat && normalized.includes(lowerFlat)) {
    return { valid: false, normalized, reason: 'Answer must not contain your flat number.' };
  }

  return { valid: true, normalized };
}

export async function hashSecurityAnswer(normalizedAnswer: string): Promise<string> {
  const pepper = process.env.SECURITY_PEPPER || 'dev_pepper_default_value_replace_in_prod';
  const saltedPeppered = `${normalizedAnswer}:${pepper}`;

  return argon2.hash(saltedPeppered, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 2,
  });
}

export async function verifySecurityAnswer(hash: string, answer: string): Promise<boolean> {
  const pepper = process.env.SECURITY_PEPPER || 'dev_pepper_default_value_replace_in_prod';
  const normalized = normalizeSecurityAnswer(answer);
  const saltedPeppered = `${normalized}:${pepper}`;
  try {
    return await argon2.verify(hash, saltedPeppered);
  } catch {
    return false;
  }
}

// AES-256-GCM for TOTP Secret Encryption
export function encryptTotpSecret(secret: string): string {
  const rawKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const key = Buffer.from(rawKey.slice(0, 64), 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptTotpSecret(encryptedPayload: string): string {
  const parts = encryptedPayload.split(':');
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
    throw new Error('Invalid encrypted TOTP secret format');
  }

  const ivHex = parts[0];
  const authTagHex = parts[1];
  const encryptedHex = parts[2];

  const rawKey = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const key = Buffer.from(rawKey.slice(0, 64), 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function generateActivationCode(): string {
  const bytes = crypto.randomBytes(10);
  let result = '';
  for (let i = 0; i < 10; i++) {
    const b = bytes[i] ?? 0;
    result += ALPHABET[b % ALPHABET.length] ?? '2';
  }
  return result;
}

export function generateRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
  }
  return codes;
}

export function sha256Hex(val: string): string {
  return crypto.createHash('sha256').update(val).digest('hex');
}

export function verifyProofOfWork(nonce: string, solution: string, difficulty: number): boolean {
  if (!nonce || !solution || difficulty <= 0) return false;
  const prefix = '0'.repeat(difficulty);
  const hash = sha256Hex(nonce + solution);
  return hash.startsWith(prefix);
}
