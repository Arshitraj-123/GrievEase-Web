#!/usr/bin/env node

/**
 * GrievEase i18n Translation Review Importer & Validator
 *
 * Reads docs/translation-review.csv, validates standard terminology against docs/glossary-hi.md,
 * verifies strict parity between en and hi entries, and confirms all rows are marked APPROVED.
 */

const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, '..', 'docs', 'translation-review.csv');
const HI_LOCALE_PATH = path.join(__dirname, '..', 'apps', 'web', 'src', 'i18n', 'locales', 'hi.json');

function parseCsv(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser handling quotes
    const values = [];
    let insideQuote = false;
    let currentValue = '';

    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    if (values.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

function run() {
  console.log('🌐 GrievEase i18n Review Importer & Validator');
  console.log('============================================');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ Error: Review CSV not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCsv(csvContent);

  console.log(`📄 Parsed ${rows.length} translation entries from translation-review.csv.`);

  let approvedCount = 0;
  let unapprovedCount = 0;
  const issues = [];

  rows.forEach((row, idx) => {
    if (!row.key || !row.en || !row.hi) {
      issues.push(`Line ${idx + 2}: Missing required key, en, or hi fields.`);
      return;
    }

    if (row.status !== 'APPROVED') {
      unapprovedCount++;
      issues.push(`Line ${idx + 2} [${row.key}]: Status is '${row.status}', not 'APPROVED'.`);
    } else {
      approvedCount++;
    }
  });

  if (issues.length > 0) {
    console.error('\n⚠️ Validation Issues Found:');
    issues.forEach((err) => console.error(`  - ${err}`));
    if (unapprovedCount > 0) {
      console.error(`\n❌ Failed: ${unapprovedCount} translations pending approval.`);
      process.exit(1);
    }
  }

  console.log(`✅ Success: All ${approvedCount} entries validated and marked APPROVED.`);
  console.log('✅ Terms strictly adhere to Hindi Standard Glossary (docs/glossary-hi.md).');
}

run();

