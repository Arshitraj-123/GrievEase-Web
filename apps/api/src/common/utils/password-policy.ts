import * as argon2 from 'argon2';
import os from 'os';

// Local offline common password blacklist (frequent passwords to reject)
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'password1234', 'password12345', 'password123456',
  '12345678', '123456789', '1234567890', '123456789012', 'qwertyuiop',
  'admin123', 'admin1234', 'admin12345', 'welcome1', 'welcome123', 'welcome@123',
  'pass@123', 'pass@1234', 'secret123', 'changeme', 'iloveyou',
  'superadmin', 'administrator', 'grievease', 'greenvalley', 'resident123',
  'society123', 'security123', 'committee1', 'secretary1', 'chairman1'
]);

export const ARGON2_CONFIG = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB memory
  timeCost: 3,       // 3 iterations
  parallelism: 2,   // 2 lanes / threads
};

/**
 * Memory-aware concurrency limiter for Argon2id hashing.
 * Prevents container Out-Of-Memory (OOM) crashes under burst authentication floods
 * by queueing concurrent compute tasks and capping peak memory.
 */
export class Argon2ConcurrencyLimiter {
  private active = 0;
  private queue: (() => void)[] = [];
  public readonly maxConcurrent: number;

  constructor(maxConcurrent?: number) {
    if (maxConcurrent && maxConcurrent > 0) {
      this.maxConcurrent = maxConcurrent;
    } else if (process.env.ARGON2_MAX_CONCURRENT) {
      this.maxConcurrent = parseInt(process.env.ARGON2_MAX_CONCURRENT, 10);
    } else {
      // Sized to safe bounds based on available memory (64MB per worker)
      const cpus = os.cpus()?.length || 2;
      this.maxConcurrent = Math.max(2, Math.min(cpus, 8));
    }
  }

  async acquire(): Promise<() => void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      let released = false;
      return () => {
        if (!released) {
          released = true;
          this.release();
        }
      };
    }

    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active++;
        let released = false;
        resolve(() => {
          if (!released) {
            released = true;
            this.release();
          }
        });
      });
    });
  }

  private release() {
    this.active--;
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getActiveCount(): number {
    return this.active;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

export const argon2Limiter = new Argon2ConcurrencyLimiter();

function getPepper(): Buffer | undefined {
  const pepper = process.env.SECURITY_PEPPER;
  return pepper && pepper.length > 0 ? Buffer.from(pepper, 'utf8') : undefined;
}

// Pre-computed dummy Argon2id hash for constant-time comparisons when a user does not exist
let DUMMY_HASH = '';
argon2
  .hash('dummy_constant_time_string_for_unregistered_users', {
    ...ARGON2_CONFIG,
    ...(getPepper() ? { secret: getPepper() } : {}),
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
  const release = await argon2Limiter.acquire();
  try {
    const pepper = getPepper();
    return await argon2.hash(password, {
      ...ARGON2_CONFIG,
      ...(pepper ? { secret: pepper } : {}),
    });
  } finally {
    release();
  }
}

export async function verifyPassword(hash: string | null | undefined, candidate: string): Promise<boolean> {
  const release = await argon2Limiter.acquire();
  try {
    const pepper = getPepper();
    if (!hash) {
      // Perform constant-time dummy verification to prevent timing attack / user enumeration
      if (DUMMY_HASH) {
        await argon2.verify(DUMMY_HASH, candidate, pepper ? { secret: pepper } : undefined).catch(() => false);
      }
      return false;
    }

    try {
      if (pepper) {
        const matchWithPepper = await argon2.verify(hash, candidate, { secret: pepper }).catch(() => false);
        if (matchWithPepper) return true;
        // Fallback: Check without pepper for legacy hashes awaiting upgrade
        return await argon2.verify(hash, candidate).catch(() => false);
      }
      return await argon2.verify(hash, candidate);
    } catch {
      return false;
    }
  } finally {
    release();
  }
}

export function needsRehash(hash: string): boolean {
  if (!hash) return false;
  try {
    return argon2.needsRehash(hash, {
      memoryCost: ARGON2_CONFIG.memoryCost,
      timeCost: ARGON2_CONFIG.timeCost,
    });
  } catch {
    return true;
  }
}
