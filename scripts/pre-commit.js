#!/usr/bin/env node

/**
 * GrievEase Pre-Commit Security Hook
 * Blocks commits if:
 * 1. Working tree contains secrets, API keys, private keys, or credentials
 * 2. Marathi translations or legacy keys are reintroduced
 * 3. i18n translation integrity fails
 */

const { execSync } = require('child_process');

console.log('🔒 Running GrievEase Pre-Commit Security Gates...');

try {
  console.log('1/3 Scanning staged files and working tree for secrets...');
  execSync('node scripts/secret-scan.js', { stdio: 'inherit' });

  console.log('2/3 Validating i18n keys and Marathi guardrails...');
  execSync('node scripts/guard-no-marathi.js', { stdio: 'inherit' });
  execSync('node scripts/check-i18n.js', { stdio: 'inherit' });

  console.log('3/3 Verifying claims audit...');
  execSync('node scripts/claims-audit.js', { stdio: 'inherit' });

  console.log('✅ All pre-commit security gates passed successfully.');
  process.exit(0);
} catch (err) {
  console.error('\n❌ PRE-COMMIT CHECK FAILED: Commit aborted.');
  process.exit(1);
}

