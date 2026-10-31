#!/usr/bin/env node

/**
 * Secret Scanner for GrievEase Repository.
 * Ensures no hardcoded credentials, API keys, private keys, or default passwords exist in source files.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const IGNORED_PATHS = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  '.env.example',
  'scripts/secret-scan.js',
  'package-lock.json',
  'pnpm-lock.yaml',
  'docs',
  'README.md',
  'mocks',
  'demo',
];

const SECRET_PATTERNS = [
  { name: 'Private Key', regex: /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/i },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic API Secret Key', regex: /(api_key|apikey|secret_key|client_secret)\s*[:=]\s*["'][a-zA-Z0-9_\-]{20,}["']/i },
  { name: 'Hardcoded Password Assignment', regex: /(?:password|passwd|pwd)\s*[:=]\s*["'](?![$%{\[])[a-zA-Z0-9!@#$%^&*()_+]{8,}["']/i },
  { name: 'Default Admin Password', regex: /(?:password|pwd)\s*[:=]\s*["'](admin|root|password|123456|secret)["']/i },
  { name: 'Slack/Discord Webhook', regex: /https:\/\/(hooks\.slack\.com|discord\.com\/api\/webhooks)\//i },
  { name: 'Twilio Auth Token', regex: /SK[0-9a-fA-F]{32}/ },
  { name: 'SendGrid API Key', regex: /SG\.[a-zA-Z0-9_\-\.]{40,}/ },
  { name: 'Stripe Secret Key', regex: /sk_live_[0-9a-zA-Z]{24}/ },
];

let violations = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(ROOT_DIR, fullPath).replace(/\\/g, '/');

    if (IGNORED_PATHS.some((ignored) => relPath.startsWith(ignored) || relPath.includes('/' + ignored + '/'))) {
      continue;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Only check text / source code files
      if (/\.(ts|tsx|js|jsx|json|yaml|yml|env|sql|sh)$/i.test(entry.name)) {
        scanFile(fullPath, relPath);
      }
    }
  }
}

function scanFile(filePath, relPath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Skip commented lines in config/example
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) return;

      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(line)) {
          // Exclude template references or dev constants explicitly allowed
          if (line.includes('process.env') || line.includes('${') || line.includes('example') || line.includes('mock')) {
            continue;
          }
          violations.push({
            file: relPath,
            line: idx + 1,
            issue: pattern.name,
            snippet: line.trim().substring(0, 80),
          });
        }
      }
    });
  } catch (err) {
    console.error(`Could not read ${relPath}: ${err.message}`);
  }
}

console.log('Running GrievEase security secret scan...');
scanDirectory(ROOT_DIR);

if (violations.length > 0) {
  console.error('\n❌ SECRET SCAN FAILED! Potential secrets or hardcoded passwords found:');
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [${v.issue}] -> ${v.snippet}`);
  });
  process.exit(1);
} else {
  console.log('✅ SECRET SCAN PASSED: No hardcoded secrets, default credentials, or cloud keys detected.');
  process.exit(0);
}
