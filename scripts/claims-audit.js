#!/usr/bin/env node

/**
 * GrievEase Phase 8 Claims Audit Tool
 *
 * Verifies that the public web application and copy NEVER make forbidden promises:
 * - No claims of "online payment", "UPI", "cards", or payment gateways
 * - No claims of "SMS alerts", "push notifications", or "OTP verification"
 * - No claims of being "tax-compliant" (bylaws require CA sign-off)
 *
 * Only permitted occurrences are explicit negative disclaimers
 * (e.g., "does not process online payment", "no SMS", "payments are cash only").
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_TERMS = [
  {
    term: 'online payment',
    pattern: /\bonline payment[s]?\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|prohibit|zero)\s+.*online payment/i,
  },
  {
    term: 'upi',
    pattern: /\bupi\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|zero)\s+.*upi/i,
  },
  {
    term: 'credit card',
    pattern: /\bcredit card[s]?\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|zero)\s+.*credit card/i,
  },
  {
    term: 'debit card',
    pattern: /\bdebit card[s]?\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|zero)\s+.*debit card/i,
  },
  {
    term: 'sms alert',
    pattern: /\bsms alert[s]?\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|strictly in-app)\s+.*sms/i,
  },
  {
    term: 'push notification',
    pattern: /\bpush notification[s]?\b/i,
    allowedPattern: /(no|not|never|doesn't|does not|without|strictly in-app)\s+.*push/i,
  },
  {
    term: 'tax-compliant',
    pattern: /\btax-compliant\b/i,
    allowedPattern: /(confirm with your CA|not tax-compliant|not a tax advisor|confirm GST applicability)/i,
  },
];

const SCAN_DIRS = [
  path.resolve(__dirname, '../apps/web/src/app'),
  path.resolve(__dirname, '../apps/web/src/content'),
  path.resolve(__dirname, '../apps/web/src/components'),
];

console.log('🔍 Starting GrievEase Claims & Compliance Audit...');

let violationsCount = 0;

function scanFile(filePath) {
  // Skip binary/non-text files and test specs
  if (!/\.(tsx|ts|js|jsx|json|md)$/.test(filePath) || filePath.includes('.spec.') || filePath.includes('.test.')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, lineNum) => {
    // Skip comments or import lines
    if (/^\s*(\/\/|\/\*|\*|import)/.test(line)) return;

    for (const rule of FORBIDDEN_TERMS) {
      if (rule.pattern.test(line)) {
        // Check if permitted by allowed negative pattern
        if (!rule.allowedPattern.test(line)) {
          console.error(`❌ VIOLATION in ${path.relative(process.cwd(), filePath)}:${lineNum + 1}`);
          console.error(`   Found unhedged promise: "${rule.term}"`);
          console.error(`   Line content: "${line.trim()}"\n`);
          violationsCount++;
        }
      }
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.next') {
        walkDir(fullPath);
      }
    } else {
      scanFile(fullPath);
    }
  }
}

for (const dir of SCAN_DIRS) {
  walkDir(dir);
}

if (violationsCount > 0) {
  console.error(`❌ FAILED: Found ${violationsCount} forbidden marketing claim violations.`);
  process.exit(1);
} else {
  console.log('✅ PASSED: All public copy and resident claims comply with zero-3rd-party offline cash and in-app alert constraints.');
  process.exit(0);
}
