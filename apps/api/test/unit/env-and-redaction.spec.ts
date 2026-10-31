import { describe, it, expect } from 'vitest';
import { validateEnvironment } from '../../src/common/config/env-validator';
import { redactSecrets } from '../../src/common/utils/log-redaction';

describe('Security Item 1 & 11: Production Environment & Secrets Validation', () => {
  const validProductionEnv = {
    NODE_ENV: 'production',
    PORT: '4000',
    JWT_SECRET: 'd89f81a7b8e19c3d4f5e6a7b8c9d0e1f2a3b4c5d6e7f8091a2b3c4d5e6f7a8b9',
    REFRESH_TOKEN_SECRET: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    SECURITY_PEPPER: 'fe1a9876543210fedcba9876543210fedcba9876543210fedcba9876543210ab',
    ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    DATABASE_URL: 'postgresql://grievease_app:mock_StrongIsolatedProdPass2026!@postgres:5432/grievease_prod',
    REDIS_PASSWORD: 'mock_redis_strong_production_pass_9988!',
  };

  it('should pass cleanly for a hardened, non-default production environment', () => {
    const result = validateEnvironment(validProductionEnv);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should refuse startup if JWT_SECRET is missing or < 32 characters in production', () => {
    const shortSecret = { ...validProductionEnv, JWT_SECRET: 'short_secret_123' };
    const res1 = validateEnvironment(shortSecret);
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes('at least 32 characters'))).toBe(true);

    const missingSecret = { ...validProductionEnv, JWT_SECRET: undefined };
    const res2 = validateEnvironment(missingSecret);
    expect(res2.valid).toBe(false);
  });

  it('should refuse startup if JWT_SECRET contains dev placeholders', () => {
    const devSecret = {
      ...validProductionEnv,
      JWT_SECRET: 'dev_jwt_secret_must_be_changed_in_production_environment_32chars!',
    };
    const res = validateEnvironment(devSecret);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('insecure development'))).toBe(true);
  });

  it('should refuse identical JWT_SECRET and REFRESH_TOKEN_SECRET (defense in depth)', () => {
    const identical = {
      ...validProductionEnv,
      REFRESH_TOKEN_SECRET: validProductionEnv.JWT_SECRET,
    };
    const res = validateEnvironment(identical);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('identical'))).toBe(true);
  });

  it('should refuse startup if DATABASE_URL contains default development credentials', () => {
    const defaultDb = {
      ...validProductionEnv,
      DATABASE_URL: 'postgresql://grievease_user:local_dev_secret_replace_in_prod@localhost:5432/grievease_db',
    };
    const res = validateEnvironment(defaultDb);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('default developer credentials'))).toBe(true);
  });

  it('should refuse startup if debug flags (DEV_FIXED_OTP, DEV_BYPASS_AUTH) are set in production', () => {
    const debugOtp = { ...validProductionEnv, DEV_FIXED_OTP: 'true' };
    const res1 = validateEnvironment(debugOtp);
    expect(res1.valid).toBe(false);
    expect(res1.errors.some((e) => e.includes('DEV_FIXED_OTP is strictly prohibited'))).toBe(true);

    const debugBypass = { ...validProductionEnv, DEV_BYPASS_AUTH: 'true' };
    const res2 = validateEnvironment(debugBypass);
    expect(res2.valid).toBe(false);
    expect(res2.errors.some((e) => e.includes('DEV_BYPASS_AUTH is strictly prohibited'))).toBe(true);
  });
});

describe('Security Item 1: Sensitive Data Log Redaction', () => {
  it('should redact sensitive keys in nested object structures', () => {
    const rawPayload = {
      username: 'resident_aarav',
      password: 'mock_PlaintextSuperSecretPassword123!',
      session: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitivePayload',
        refreshToken: 'rf_987654321',
      },
      metadata: {
        securityPepper: 'super_secret_pepper_value',
        flat: 'A-101',
      },
    };

    const sanitized = redactSecrets(rawPayload);
    expect(sanitized.username).toBe('resident_aarav');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.session.token).toBe('[REDACTED]');
    expect(sanitized.session.refreshToken).toBe('[REDACTED]');
    expect(sanitized.metadata.securityPepper).toBe('[REDACTED]');
    expect(sanitized.metadata.flat).toBe('A-101');
  });

  it('should redact database passwords from connection strings in log text', () => {
    const logString = 'Failed to connect to postgresql://admin:super_secret_db_pass@db.internal:5432/grievease_db after 3 attempts';
    const sanitized = redactSecrets(logString);
    expect(sanitized).not.toContain('super_secret_db_pass');
    expect(sanitized).toContain('postgresql://admin:[REDACTED_PASSWORD]@db.internal:5432/grievease_db');
  });

  it('should redact Authorization Bearer tokens in raw header strings', () => {
    const headerString = 'Incoming Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretClaimToken';
    const sanitized = redactSecrets(headerString);
    expect(sanitized).not.toContain('secretClaimToken');
    expect(sanitized).toBe('Incoming Authorization: Bearer [REDACTED_TOKEN]');
  });
});
