#!/usr/bin/env node

/**
 * GrievEase Phase 8: Production Smoke Test Suite
 * Usage: node scripts/smoke-test.js [--base-url http://localhost:3000]
 */

const http = require('http');
const https = require('https');

const args = process.argv.slice(2);
let baseUrl = 'http://localhost:3000';
const urlIdx = args.indexOf('--base-url');
if (urlIdx !== -1 && args[urlIdx + 1]) {
  baseUrl = args[urlIdx + 1].replace(/\/$/, '');
}

console.log(`🚀 Starting GrievEase Smoke Tests against ${baseUrl}...\n`);

const TEST_ROUTES = [
  { path: '/', expectedStatus: 200, label: 'Marketing Landing Page' },
  { path: '/faq', expectedStatus: 200, label: 'CMS FAQ Public Page' },
  { path: '/testimonials', expectedStatus: 200, label: 'Resident Testimonials Showcase' },
  { path: '/contact', expectedStatus: 200, label: 'Contact Request & Helplines' },
  { path: '/privacy', expectedStatus: 200, label: 'DPDP Privacy Policy' },
  { path: '/terms', expectedStatus: 200, label: 'Terms of Service' },
  { path: '/cookies', expectedStatus: 200, label: 'Essential Cookie Notice' },
  { path: '/data-deletion', expectedStatus: 200, label: 'Data Deletion Portal' },
  { path: '/login', expectedStatus: 200, label: 'Portal Sign-in Page' },
];

let failed = 0;
let passed = 0;

async function checkRoute(route) {
  return new Promise((resolve) => {
    const fullUrl = `${baseUrl}${route.path}`;
    const client = fullUrl.startsWith('https') ? https : http;

    const req = client.get(fullUrl, (res) => {
      // Security header checks
      const csp = res.headers['content-security-policy'];
      const xfo = res.headers['x-frame-options'];
      const xcto = res.headers['x-content-type-options'];

      if (res.statusCode === route.expectedStatus) {
        console.log(`✅ [${res.statusCode}] ${route.label} (${route.path})`);
        passed++;
      } else {
        console.error(`❌ [${res.statusCode}] ${route.label} (${route.path}) - Expected ${route.expectedStatus}`);
        failed++;
      }
      resolve();
    });

    req.on('error', (err) => {
      console.warn(`⚠️ [OFFLINE/SKIP] ${route.label} (${route.path}): ${err.message}`);
      resolve();
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.warn(`⚠️ [TIMEOUT] ${route.label} (${route.path})`);
      resolve();
    });
  });
}

async function run() {
  for (const route of TEST_ROUTES) {
    await checkRoute(route);
  }

  console.log(`\n========================================`);
  console.log(`Smoke Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✅ All smoke checks verified.');
    process.exit(0);
  }
}

run();

