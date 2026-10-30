#!/usr/bin/env node

/**
 * CI Guard: scripts/guard-no-marathi.js
 * Verifies that Marathi language support has been completely removed across the codebase,
 * ensuring no 'mr' locale, translation column, or file reappears.
 * Allows legitimate non-language hits (e.g. Tailwind margin classes `mr-1`, `mr-2`, name `Mr. S. Rao`).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const PROHIBITED_FILES = [
  'apps/web/src/i18n/locales/mr.json',
  'docs/guides/guard-guide.mr.md',
  'docs/guides/resident-guide.mr.md',
  'docs/guides/vendor-guide.mr.md',
];

const ALLOWLISTED_FILES = new Set([
  'docs/marathi-removal-report.md',
  'apps/api/src/database/migrations/0008_remove_marathi_archive.sql',
  'scripts/guard-no-marathi.js',
  'marathi-hits-clean.csv',
  'marathi-hits-detailed.txt',
]);

const PROHIBITED_PATTERNS = [
  { pattern: /['"`]mr['"`]/i, description: "'mr' as string literal (locale/language code)" },
  { pattern: /name_mr|desc_mr|description_mr|rules_text_mr|rules_mr|question_mr|answer_mr|value_mr/i, description: "Marathi database column or field (_mr)" },
  { pattern: /['"`]MR['"`]/, description: "'MR' as uppercase locale code" },
  { pattern: /['"]मराठी['"]|['"]Marathi \(/i, description: "Marathi language label in code" },
  { pattern: /\b(nameMr|descMr|bodyMr|titleMr|valueMr|questionMr|answerMr)\b/, description: "Marathi camelCase variable (Mr suffix)" },
];

// Legitimate non-language patterns to allow-list
function isAllowListed(line, fileRel) {
  // Tailwind margin classes
  if (/(\b|-|\/|:)mr-[0-9.]+/.test(line)) {
    // If the only occurrence of 'mr' on this line is in a Tailwind class like 'mr-1', '-mr-1', 'file:mr-4'
    const withoutTailwind = line.replace(/(-?mr-[0-9.]+)/g, '');
    let stillHasHit = false;
    for (const { pattern } of PROHIBITED_PATTERNS) {
      if (pattern.test(withoutTailwind)) {
        stillHasHit = true;
        break;
      }
    }
    if (!stillHasHit) return true;
  }

  // Name "Mr. S. Rao" or "Mr. "
  if (/Mr\.\s+[A-Z]/i.test(line)) {
    const withoutTitle = line.replace(/Mr\.\s+[A-Za-z.\s]+/g, '');
    let stillHasHit = false;
    for (const { pattern } of PROHIBITED_PATTERNS) {
      if (pattern.test(withoutTitle)) {
        stillHasHit = true;
        break;
      }
    }
    if (!stillHasHit) return true;
  }

  // Database migrations: historical schema migrations and removal migration 0008
  if (fileRel.startsWith('apps/api/src/database/migrations/')) {
    return true;
  }

  // Explicit validation that rejects 'mr'
  if (line.includes("Language must be en or hi") || line.includes("lang === 'mr'")) {
    return true;
  }

  // Test that asserts absence of Marathi
  if (line.includes("toHaveCount(0)") || line.includes("not.toBeVisible()")) {
    return true;
  }

  return false;
}

let violations = 0;

console.log('🛡️  Running GrievEase No-Marathi CI Guard...\n');

// 1. Check for prohibited files
for (const relPath of PROHIBITED_FILES) {
  const fullPath = path.join(ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    console.error(`❌ Prohibited Marathi file exists: ${relPath}`);
    violations++;
  }
}

// 2. Scan source trees
const SCAN_DIRS = ['apps', 'packages', 'scripts'];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.next' || file === 'dist' || file === 'build' || file === '.turbo') {
      continue;
    }
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (/\.(ts|tsx|js|jsx|json|sql)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

for (const dir of SCAN_DIRS) {
  const files = walk(path.join(ROOT, dir));
  for (const filePath of files) {
    const fileRel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    if (ALLOWLISTED_FILES.has(fileRel)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      for (const { pattern, description } of PROHIBITED_PATTERNS) {
        if (pattern.test(line)) {
          if (!isAllowListed(line, fileRel)) {
            console.error(`❌ Prohibited Marathi reference in ${fileRel}:${idx + 1}`);
            console.error(`   ${line.trim()}`);
            console.error(`   Reason: ${description}\n`);
            violations++;
            break;
          }
        }
      }
    });
  }
}

if (violations > 0) {
  console.error(`\n❌ CI Guard failed with ${violations} Marathi violation(s).`);
  process.exit(1);
} else {
  console.log('✅ CI Guard passed: GrievEase code is 100% free of Marathi references.\n');
  process.exit(0);
}
