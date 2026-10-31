#!/usr/bin/env node

/**
 * GrievEase Phase 8: Comprehensive Preflight Verification Suite
 * Executes all static checks, i18n parity validations, security scans,
 * and claims compliance audits.
 */

const { execSync } = require('child_process');

console.log('================================================================');
console.log('            GRIEV-EASE PRODUCTION PREFLIGHT CHECKS             ');
console.log('================================================================\n');

const STEPS = [
  { name: '1. Multilingual i18n Key Parity Check', command: 'node scripts/check-i18n.js' },
  { name: '2. Marathi Removal Guard', command: 'node scripts/guard-no-marathi.js' },
  { name: '3. Claims & Zero 3rd-Party Compliance Audit', command: 'node scripts/claims-audit.js' },
  { name: '4. Encrypted Backup & Integrity Benchmark', command: 'node scripts/backup-verify.js' },
  { name: '5. Working Tree Secret & Credentials Scanner', command: 'node scripts/secret-scan.js' },
  { name: '6. Full Git History Secret Scan (40+ Commits)', command: 'node scripts/git-history-scan.js' },
  { name: '7. Shared Contracts Typecheck', command: 'pnpm --filter @grievease/contracts exec tsc -b' },
  { name: '8. API TypeScript Compilation Check', command: 'pnpm --filter @grievease/api exec tsc --noEmit' },
];

let failed = false;

for (const step of STEPS) {
  console.log(`\n▶ Running: ${step.name}...`);
  try {
    execSync(step.command, { stdio: 'inherit' });
    console.log(`✅ ${step.name}: PASSED`);
  } catch (err) {
    console.error(`❌ ${step.name}: FAILED`);
    failed = true;
    break;
  }
}

console.log('\n================================================================');
if (failed) {
  console.error('❌ PREFLIGHT CHECKS FAILED. Correct issues before release.');
  process.exit(1);
} else {
  console.log('🎉 ALL PREFLIGHT VERIFICATIONS PASSED CLEANLY! Ready for deployment.');
  process.exit(0);
}
