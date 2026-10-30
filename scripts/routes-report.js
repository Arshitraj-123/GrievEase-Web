#!/usr/bin/env node

/**
 * GrievEase Phase 8: Routes & Authorization Enumeration Report
 * Scans API controllers and Web app routes to generate an audit-ready inventory.
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('         GRIEV-EASE COMPREHENSIVE ROUTES & ROLES REPORT         ');
console.log('================================================================\n');

const apiControllersDir = path.resolve(__dirname, '../apps/api/src/modules');
const webAppDir = path.resolve(__dirname, '../apps/web/src/app');

// 1. Scan NestJS API endpoints
console.log('--- 1. BACKEND API ENDPOINTS (NestJS) ---');
const apiRoutes = [];

function scanControllers(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanControllers(fullPath);
    } else if (entry.name.endsWith('.controller.ts')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const baseMatch = content.match(/@Controller\(\[?['"]([^'"\]]+)['"]/);
      const basePath = baseMatch ? baseMatch[1] : '';

      const methodRegex = /@(Get|Post|Put|Delete|Patch)\(['"]?([^'"\)]*)['"]?\)/g;
      let m;
      while ((m = methodRegex.exec(content)) !== null) {
        const httpMethod = m[1].toUpperCase();
        const subPath = m[2];
        const routePath = '/' + [basePath, subPath].filter(Boolean).join('/').replace(/\/+/g, '/');

        // Look for @Roles
        const block = content.slice(Math.max(0, m.index - 200), m.index + 200);
        const rolesMatch = block.match(/@Roles\(([^)]+)\)/);
        const roles = rolesMatch ? rolesMatch[1].replace(/['"\s]/g, '') : 'AUTHENTICATED';

        apiRoutes.push({
          method: httpMethod,
          path: routePath,
          roles,
          file: path.relative(process.cwd(), fullPath),
        });
      }
    }
  }
}

scanControllers(apiControllersDir);

console.table(
  apiRoutes.slice(0, 50).map((r) => ({
    Method: r.method,
    Endpoint: r.path,
    RequiredRoles: r.roles,
  }))
);
console.log(`... Total API Endpoints Detected: ${apiRoutes.length}\n`);

// 2. Scan Next.js Pages
console.log('--- 2. FRONTEND WEB ROUTES (Next.js App Router) ---');
const webRoutes = [];

function scanWebRoutes(dir, currentPath = '') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const seg = entry.name;
      const nextSeg = seg.startsWith('(') && seg.endsWith(')') ? '' : seg;
      scanWebRoutes(fullPath, currentPath + (nextSeg ? '/' + nextSeg : ''));
    } else if (entry.name === 'page.tsx') {
      const finalRoute = currentPath || '/';
      let portal = 'Public / Marketing';
      if (finalRoute.startsWith('/admin')) portal = 'Admin Console';
      else if (finalRoute.startsWith('/app')) portal = 'Resident Portal';
      else if (finalRoute.startsWith('/guard')) portal = 'Guard Console';
      else if (finalRoute.startsWith('/vendor')) portal = 'Vendor Portal';

      webRoutes.push({
        Route: finalRoute,
        Portal: portal,
        File: path.relative(process.cwd(), fullPath),
      });
    }
  }
}

scanWebRoutes(webAppDir);

console.table(webRoutes.slice(0, 50).map((r) => ({ Route: r.Route, Portal: r.Portal })));
console.log(`... Total Frontend Page Routes Detected: ${webRoutes.length}\n`);

console.log('✅ Routes report successfully compiled.');

