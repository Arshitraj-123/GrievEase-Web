/**
 * GrievEase Production Environment Security Validator
 * Enforces strict cryptographic entropy, prevents default developer credentials,
 * and ensures no debug/insecure flags are active in production deployments.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
}

const INSECURE_PATTERNS = [
  'dev_',
  'replace_in_prod',
  'example',
  'secret123',
  'password123',
  'changeme',
  'default',
];

export function validateEnvironment(env: Record<string, string | undefined>): EnvValidationResult {
  const errors: string[] = [];
  const isProd = env.NODE_ENV === 'production';

  // If in development/test, ensure basic sanity but permit local mocks
  if (!isProd) {
    if (env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length !== 64) {
      errors.push('ENCRYPTION_KEY must be exactly 64 hexadecimal characters (32 bytes).');
    }
    return { valid: errors.length === 0, errors };
  }

  // --- STRICT PRODUCTION CONSTRAINTS ---

  // 1. JWT Access Secret
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    errors.push('JWT_SECRET must be set and contain at least 32 characters in production.');
  } else if (INSECURE_PATTERNS.some((p) => jwtSecret.toLowerCase().includes(p))) {
    errors.push('JWT_SECRET contains insecure development or default placeholder text.');
  }

  // 2. Refresh Token Secret
  const refreshSecret = env.REFRESH_TOKEN_SECRET || env.REFRESH_SECRET;
  if (!refreshSecret || refreshSecret.length < 32) {
    errors.push('REFRESH_TOKEN_SECRET must be set and contain at least 32 characters in production.');
  } else if (refreshSecret === jwtSecret) {
    errors.push('REFRESH_TOKEN_SECRET must not be identical to JWT_SECRET (defense-in-depth).');
  } else if (INSECURE_PATTERNS.some((p) => refreshSecret.toLowerCase().includes(p))) {
    errors.push('REFRESH_TOKEN_SECRET contains insecure development placeholder text.');
  }

  // 3. Security Pepper for Argon2id
  const pepper = env.SECURITY_PEPPER;
  if (!pepper || pepper.length < 32) {
    errors.push('SECURITY_PEPPER must be set and contain at least 32 characters in production.');
  } else if (INSECURE_PATTERNS.some((p) => pepper.toLowerCase().includes(p))) {
    errors.push('SECURITY_PEPPER contains insecure development placeholder text.');
  }

  // 4. AES-256-GCM Encryption Key
  const encKey = env.ENCRYPTION_KEY || env.ANON_ENCRYPTION_KEY;
  if (!encKey || encKey.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(encKey)) {
    errors.push('ENCRYPTION_KEY must be a valid 64-character hexadecimal string (32 bytes).');
  }

  // 5. Database Credentials
  const dbUrl = env.DATABASE_URL;
  if (!dbUrl) {
    errors.push('DATABASE_URL must be defined.');
  } else if (dbUrl.includes('local_dev_secret_replace_in_prod') || dbUrl.includes('postgres:postgres@')) {
    errors.push('DATABASE_URL is using default developer credentials. Rotate credentials for production.');
  }

  // 6. Redis Credentials
  const redisPw = env.REDIS_PASSWORD;
  if (redisPw && redisPw.includes('local_redis_secret_replace_in_prod')) {
    errors.push('REDIS_PASSWORD is using default placeholder password.');
  }

  // 7. Debug and Insecure Feature Flags MUST be OFF
  if (env.DEV_FIXED_OTP === 'true' || env.DEV_FIXED_OTP === '1') {
    errors.push('DEV_FIXED_OTP is strictly prohibited in production.');
  }
  if (env.DEV_BYPASS_AUTH === 'true') {
    errors.push('DEV_BYPASS_AUTH is strictly prohibited in production.');
  }
  if (env.SWAGGER_ENABLED === 'true') {
    errors.push('SWAGGER_ENABLED should not be active in production mode.');
  }
  if (env.DEBUG && env.DEBUG.includes('*')) {
    errors.push('Wildcard DEBUG logging is enabled; this may leak sensitive data into logs.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidEnvironment(): void {
  const result = validateEnvironment(process.env);
  if (!result.valid) {
    console.error('\n================================================================');
    console.error('⛔ FATAL: PRODUCTION ENVIRONMENT SECURITY VALIDATION FAILED:');
    result.errors.forEach((err) => console.error(`  - ${err}`));
    console.error('================================================================\n');
    throw new Error(`Environment security check failed with ${result.errors.length} violations.`);
  }
}

