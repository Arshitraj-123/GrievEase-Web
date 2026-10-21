#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const localesDir = path.resolve(__dirname, '../apps/web/src/i18n/locales');
const requiredLocales = ['en', 'hi', 'mr'];

console.log('🔍 Running GrievEase i18n key parity and validation check...');

function getFlattenedKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(getFlattenedKeys(v, fullPath));
    } else {
      keys.push({ path: fullPath, value: v });
    }
  }
  return keys;
}

const loaded = {};
for (const locale of requiredLocales) {
  const filePath = path.join(localesDir, `${locale}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CRITICAL: Missing translation file for locale '${locale}' at ${filePath}`);
    process.exit(1);
  }
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    loaded[locale] = {
      raw: content,
      flattened: getFlattenedKeys(content),
    };
  } catch (err) {
    console.error(`❌ CRITICAL: Failed to parse JSON for locale '${locale}':`, err.message);
    process.exit(1);
  }
}

const baseKeys = new Map(loaded.en.flattened.map((item) => [item.path, item.value]));
let hasErrors = false;

console.log(`ℹ️  Base dictionary ('en') contains ${baseKeys.size} distinct translation keys.`);

for (const locale of ['hi', 'mr']) {
  const targetMap = new Map(loaded[locale].flattened.map((item) => [item.path, item.value]));

  // 1. Check for missing keys in target locale
  for (const [keyPath, baseVal] of baseKeys.entries()) {
    if (!targetMap.has(keyPath)) {
      console.error(`❌ Missing key in '${locale}': ${keyPath}`);
      hasErrors = true;
    } else {
      const targetVal = targetMap.get(keyPath);
      if (typeof targetVal !== 'string' || targetVal.trim() === '') {
        console.error(`❌ Empty translation in '${locale}': ${keyPath}`);
        hasErrors = true;
      }
    }
  }

  // 2. Check for unexpected excess keys
  for (const [targetKey] of targetMap.entries()) {
    if (!baseKeys.has(targetKey)) {
      console.error(`⚠️  Orphan key found in '${locale}' not present in base 'en': ${targetKey}`);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('\n❌ i18n validation FAILED: Missing or incomplete translation keys detected.');
  process.exit(1);
} else {
  console.log('✅ i18n validation PASSED: Perfect key parity across EN, HI, MR translations.\n');
  process.exit(0);
}
