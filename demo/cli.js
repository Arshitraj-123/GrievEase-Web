#!/usr/bin/env node
/**
 * GrievEase Demo CLI Entry Point
 * Enforces production lockout and normalizes cross-platform invocation.
 */

const { spawnSync } = require('child_process');
const path = require('path');

// 1. HARD RULE SAFETY CHECK: Refuse to start in production!
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ FATAL: Demo runner is strictly forbidden from executing when NODE_ENV=production!\n');
  process.exit(1);
}

// 2. Set Demo Execution Environment
process.env.DEMO_MODE = 'true';
process.env.ALLOW_DEMO_SEED_ON_DEV = 'true';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/grievease_demo';
}

if (!process.env.BASE_URL) {
  process.env.BASE_URL = 'http://127.0.0.1:3000';
}

const args = process.argv.slice(2);
const command = args[0] || 'verify';
const passThroughArgs = args.slice(1);

const rootDir = path.resolve(__dirname, '..');

let scriptTarget = '';
let defaultFlags = [];

switch (command) {
  case 'reset':
    scriptTarget = path.resolve(__dirname, 'seed/demo-seed.ts');
    break;
  case 'record':
    scriptTarget = path.resolve(__dirname, 'runner.ts');
    defaultFlags = ['--record'];
    break;
  case 'verify':
    scriptTarget = path.resolve(__dirname, 'runner.ts');
    defaultFlags = ['--verify'];
    break;
  case 'pack':
    scriptTarget = path.resolve(__dirname, 'pack.ts');
    break;
  case 'coverage':
    scriptTarget = path.resolve(__dirname, 'coverage.ts');
    break;
  default:
    console.error(`Unknown demo command: ${command}`);
    console.error('Available commands: reset, record, verify, pack, coverage');
    process.exit(1);
}

// Resolve tsx cli from apps/api
let tsxCli = '';
try {
  const tsxEntry = require.resolve('tsx', { paths: [path.resolve(rootDir, 'apps/api')] });
  tsxCli = path.join(path.dirname(tsxEntry), 'cli.mjs');
} catch (e) {
  tsxCli = path.resolve(rootDir, 'node_modules/.pnpm/tsx@4.23.15/node_modules/tsx/dist/cli.mjs');
}

const executionArgs = [tsxCli, scriptTarget, ...defaultFlags, ...passThroughArgs];

const result = spawnSync(process.execPath, executionArgs, {
  stdio: 'inherit',
  env: process.env,
  cwd: rootDir,
});

process.exit(result.status ?? 0);
