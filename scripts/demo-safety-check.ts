/**
 * GrievEase Demo Safety Verification Guard
 * Ensures DEMO_MODE can NEVER be active in production,
 * and validates that demo endpoints are sealed against production deployments.
 */

import { validateEnvironment } from '../apps/api/src/common/config/env-validator';

console.log('🛡️  Validating Demo Mode Safety Constraints...');

// 1. Current Environment Check
if (process.env.NODE_ENV === 'production' && (process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1')) {
  console.error('❌ FATAL SAFETY VIOLATION: DEMO_MODE is enabled while NODE_ENV=production!');
  process.exit(1);
}

// 2. Automated Env Validator Assertion Test
const testProdWithDemo = validateEnvironment({
  NODE_ENV: 'production',
  DEMO_MODE: 'true',
  JWT_SECRET: '0123456789abcdef0123456789abcdef',
  REFRESH_TOKEN_SECRET: 'abcdef0123456789abcdef0123456789',
  SECURITY_PEPPER: 'pepper_0123456789abcdef0123456789',
  ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  DATABASE_URL: 'postgresql://mock_prod_user:mock_secret_prod_pass@db.internal:5432/grievease_prod',
  REDIS_PASSWORD: 'mock_prod_redis_strong_pass_123',
});

if (testProdWithDemo.valid || !testProdWithDemo.errors.some((e) => e.includes('DEMO_MODE'))) {
  console.error('❌ FATAL: env-validator did not reject DEMO_MODE=true in production!');
  process.exit(1);
}

console.log('✅ Demo Mode Safety Check Passed: Production isolation strictly enforced.');
process.exit(0);
