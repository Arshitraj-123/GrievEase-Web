import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DemoSecurityGuard } from '../../src/modules/demo/demo.guard';
import { validateEnvironment } from '../../src/common/config/env-validator';
import { ExecutionContext, NotFoundException } from '@nestjs/common';

describe('Demo Mode Production Isolation & Safety Verification', () => {
  const originalEnv = { ...process.env };
  let guard: DemoSecurityGuard;

  beforeEach(() => {
    guard = new DemoSecurityGuard();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function createMockContext(ip: string, headers: Record<string, string>): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          socket: { remoteAddress: ip },
          headers,
        }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should strictly return 404 in production environment even if DEMO_MODE is true', () => {
    process.env.NODE_ENV = 'production';
    process.env.DEMO_MODE = 'true';
    process.env.DEMO_SECRET = 'valid_demo_secret';

    const ctx = createMockContext('127.0.0.1', { 'x-demo-secret': 'valid_demo_secret' });
    expect(() => guard.canActivate(ctx)).toThrow(NotFoundException);
  });

  it('should return 404 when DEMO_MODE is false or unset in non-production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DEMO_MODE;
    process.env.DEMO_SECRET = 'valid_demo_secret';

    const ctx = createMockContext('127.0.0.1', { 'x-demo-secret': 'valid_demo_secret' });
    expect(() => guard.canActivate(ctx)).toThrow(NotFoundException);
  });

  it('should return 404 when request comes from non-localhost IP address', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_MODE = 'true';
    process.env.DEMO_SECRET = 'valid_demo_secret';

    const ctx = createMockContext('192.168.1.100', { 'x-demo-secret': 'valid_demo_secret' });
    expect(() => guard.canActivate(ctx)).toThrow(NotFoundException);
  });

  it('should return 404 when x-demo-secret header is missing or incorrect', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_MODE = 'true';
    process.env.DEMO_SECRET = 'valid_demo_secret';

    const ctxMissing = createMockContext('127.0.0.1', {});
    expect(() => guard.canActivate(ctxMissing)).toThrow(NotFoundException);

    const ctxInvalid = createMockContext('127.0.0.1', { 'x-demo-secret': 'wrong_secret' });
    expect(() => guard.canActivate(ctxInvalid)).toThrow(NotFoundException);
  });

  it('should allow access when DEMO_MODE is true, host is localhost, and secret is valid', () => {
    process.env.NODE_ENV = 'development';
    process.env.DEMO_MODE = 'true';
    process.env.DEMO_SECRET = 'valid_demo_secret';

    const ctx = createMockContext('127.0.0.1', { 'x-demo-secret': 'valid_demo_secret' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should fail production startup validation if DEMO_MODE is set in production', () => {
    const prodEnv = {
      NODE_ENV: 'production',
      DEMO_MODE: 'true',
      JWT_SECRET: 'a_very_strong_jwt_production_secret_32chars!',
      REFRESH_TOKEN_SECRET: 'a_very_strong_refresh_production_secret_32chars!',
      SECURITY_PEPPER: 'a_very_strong_argon2id_pepper_secret_32chars!',
      ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      DATABASE_URL: 'postgresql://mock_prod_app:mock_strongpass@db.internal:5432/grievease_prod',
      REDIS_PASSWORD: 'mock_strong_redis_prod_pass_12345',
    };

    const result = validateEnvironment(prodEnv);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('DEMO_MODE is strictly prohibited in production mode.');
  });
});
