import * as argon2 from 'argon2';

// Local offline common password blacklist (frequent passwords to reject)
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'password1234', 'password12345', 'password123456',
  '12345678', '123456789', '1234567890', '123456789012', 'qwertyuiop',
  'admin123', 'admin1234', 'admin12345', 'welcome1', 'welcome123', 'welcome@123',
  'pass@123', 'pass@1234', 'secret123', 'changeme', 'iloveyou',
  'superadmin', 'administrator', 'grievease', 'greenvalley', 'resident123',
  'society123', 'security123', 'committee1', 'secretary1', 'chairman1'
]);

// Pre-computed dummy Argon2id hash for constant-time comparisons when a user does not exist
let DUMMY_HASH = '';
argon2
  .hash('dummy_constant_time_string_for_unregistered_users', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 2,
  })
  .then((h) => {
    DUMMY_HASH = h;
  })
  .catch(() => {
    // fallback if initial hash pending
  });

export interface PasswordValidationOptions {
  isAdmin?: boolean;
  username?: string;
  mobile?: string;
  flat?: string;
  fullName?: string;
}

export function validatePasswordStrength(
  password: string,
  options: PasswordValidationOptions = {}
): { valid: boolean; reason?: string } {
  const minLength = options.isAdmin ? 12 : 10;

  if (!password || password.length < minLength) {
    return {
      valid: false,
      reason: `Password must be at least ${minLength} characters for this role.`,
    };
  }

  // Check lowercase common dictionary
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return {
      valid: false,
      reason: 'This password is too common and easily guessed. Please choose a stronger passphrase.',
    };
  }

  // Check against username, mobile, flat, name
  if (options.username && lower.includes(options.username.toLowerCase())) {
    return { valid: false, reason: 'Password must not contain your username.' };
  }
  if (options.mobile && options.mobile.length >= 6 && password.includes(options.mobile.slice(-6))) {
    return { valid: false, reason: 'Password must not contain parts of your mobile number.' };
  }
  if (options.flat && lower.includes(options.flat.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
    return { valid: false, reason: 'Password must not contain your flat number.' };
  }

  return { valid: true };
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 2,
  });
}

export async function verifyPassword(hash: string | null | undefined, candidate: string): Promise<boolean> {
  if (!hash) {
    // Perform constant-time dummy verification to prevent timing attack / user enumeration
    if (DUMMY_HASH) {
      await argon2.verify(DUMMY_HASH, candidate).catch(() => false);
    }
    return false;
  }

  try {
    return await argon2.verify(hash, candidate);
  } catch {
    return false;
  }
}
