#!/usr/bin/env node

/**
 * Full Git History Secret Scanner for GrievEase
 * Iterates through every commit in the repository and inspects patch diffs
 * for committed credentials, private keys, API secrets, and sensitive tokens.
 */

const { execSync } = require('child_process');

const SECRET_PATTERNS = [
  { name: 'Private Key', regex: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |)PRIVATE KEY-----/i },
  { name: 'AWS Access Key', regex: /\b(AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'GitHub Personal Token', regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36}\b/ },
  { name: 'GitHub Fine-Grained Token', regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/ },
  { name: 'Generic API Secret Key', regex: /(?:api_key|apikey|secret_key|client_secret)\s*[:=]\s*["']([a-zA-Z0-9_\-]{24,})["']/i },
  { name: 'Slack/Discord Webhook', regex: /https:\/\/(?:hooks\.slack\.com\/services|discord\.com\/api\/webhooks)\/[A-Za-z0-9\/\-_]+/i },
  { name: 'Twilio Auth Token', regex: /\bSK[0-9a-fA-F]{32}\b/ },
  { name: 'SendGrid API Key', regex: /\bSG\.[a-zA-Z0-9_\-\.]{40,}\b/ },
  { name: 'Stripe Live Secret Key', regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  { name: 'Hardcoded High-Entropy Password', regex: /(?:password|passwd|pwd)\s*[:=]\s*["'](?![$%{\[])([a-zA-Z0-9!@#$%^&*()_+]{12,})["']/i }
];

const ALLOWLIST_SUBSTRINGS = [
  'local_dev_secret_replace_in_prod',
  'local_redis_secret_replace_in_prod',
  'local_minio_secret_replace_in_prod',
  'dev_jwt_secret_must_be_changed',
  'dev_refresh_secret_must_be_changed',
  'dev_security_pepper_for_hashing',
  '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  'process.env',
  'dummy_hash',
  'example',
  'placeholder',
  'mock',
  'spec'
];

console.log('🔍 Scanning FULL git history across all commits, branches, and tags...');

try {
  // Get all commit hashes
  const commits = execSync('git rev-list --all', { encoding: 'utf-8' })
    .trim()
    .split('\n')
    .filter(Boolean);

  console.log(`Found ${commits.length} commits in git history. Auditing patches...`);

  let findings = [];

  for (const commit of commits) {
    const diff = execSync(`git show -p --unified=0 ${commit}`, {
      encoding: 'utf-8',
      maxBuffer: 20 * 1024 * 1024
    });

    const lines = diff.split('\n');
    let currentFile = 'unknown';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('+++ b/')) {
        currentFile = line.substring(6).trim();
        continue;
      }

      // Only check added lines
      if (!line.startsWith('+') || line.startsWith('+++')) continue;
      const addedContent = line.substring(1).trim();

      // Skip comment lines
      if (addedContent.startsWith('//') || addedContent.startsWith('#') || addedContent.startsWith('*')) {
        continue;
      }

      // Check allowlist
      if (ALLOWLIST_SUBSTRINGS.some((allowed) => addedContent.includes(allowed))) {
        continue;
      }

      for (const pattern of SECRET_PATTERNS) {
        const match = pattern.regex.exec(addedContent);
        if (match) {
          findings.push({
            commit: commit.substring(0, 8),
            file: currentFile,
            pattern: pattern.name,
            matchedSnippet: addedContent.substring(0, 80)
          });
        }
      }
    }
  }

  if (findings.length > 0) {
    console.error(`\n❌ POTENTIAL SECRETS DETECTED IN GIT HISTORY (${findings.length} findings):`);
    findings.forEach((f) => {
      console.error(`  - Commit [${f.commit}] in ${f.file} (${f.pattern}): ${f.matchedSnippet}`);
    });
    process.exit(1);
  } else {
    console.log(`\n✅ GIT HISTORY AUDIT PASSED: Scanned all ${commits.length} commits. Zero real secrets, private keys, or credentials found in git history.`);
    process.exit(0);
  }
} catch (err) {
  console.error(`Failed to scan git history: ${err.message}`);
  process.exit(1);
}

