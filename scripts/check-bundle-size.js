#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NEXT_STATIC_DIR = path.resolve(__dirname, '../apps/web/.next/static');
const GZIP_BUDGET_LIMIT_KB = 200; // Transfer budget per chunk on throttled 4G (Lighthouse target)
const RAW_BUDGET_LIMIT_KB = 650;  // Raw disk budget per chunk

console.log('📊 Checking Next.js bundle size budgets (Mobile 4G & Lighthouse)...');

if (!fs.existsSync(NEXT_STATIC_DIR)) {
  console.log('⚠️  .next/static directory not found. Please run "pnpm --filter @grievease/web build" first.');
  process.exit(0);
}

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFiles(filePath, fileList);
    } else if (file.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const jsFiles = getFiles(NEXT_STATIC_DIR);
let failed = false;
let totalRawSizeKb = 0;
let totalGzipSizeKb = 0;

for (const f of jsFiles) {
  const content = fs.readFileSync(f);
  const rawSizeKb = Math.round(content.length / 1024);
  const gzipSizeKb = Math.round(zlib.gzipSync(content).length / 1024);

  totalRawSizeKb += rawSizeKb;
  totalGzipSizeKb += gzipSizeKb;

  const rel = path.relative(NEXT_STATIC_DIR, f);

  if (gzipSizeKb > GZIP_BUDGET_LIMIT_KB || rawSizeKb > RAW_BUDGET_LIMIT_KB) {
    console.error(
      `❌ Bundle budget exceeded for ${rel}: ${gzipSizeKb} KB gzip / ${rawSizeKb} KB raw (Limits: ${GZIP_BUDGET_LIMIT_KB} KB gzip / ${RAW_BUDGET_LIMIT_KB} KB raw)`
    );
    failed = true;
  }
}

console.log(
  `Found ${jsFiles.length} JavaScript chunks. Total volume: ${totalGzipSizeKb} KB gzip (${totalRawSizeKb} KB raw).`
);

if (failed) {
  console.error('\n❌ Bundle size budget failed: One or more chunks exceeded performance thresholds.');
  process.exit(1);
} else {
  console.log(
    `✅ All chunks passed mobile performance budget (< ${GZIP_BUDGET_LIMIT_KB} KB gzip transfer each).\n`
  );
  process.exit(0);
}
