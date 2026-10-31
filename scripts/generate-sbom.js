#!/usr/bin/env node

/**
 * GrievEase CycloneDX Software Bill of Materials (SBOM) Generator
 */

const fs = require('fs');
const path = require('path');

const rootPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
const apiPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../apps/api/package.json'), 'utf8'));
const webPkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../apps/web/package.json'), 'utf8'));

const components = [];

function addComponents(pkg, type) {
  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    if (name.startsWith('@grievease/')) continue;
    components.push({
      type: 'library',
      name,
      version: version.replace(/^[\^~]/, ''),
      purl: `pkg:npm/${name}@${version.replace(/^[\^~]/, '')}`,
      scope: 'required',
    });
  }
}

addComponents(apiPkg, 'api');
addComponents(webPkg, 'web');

const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  serialNumber: `urn:uuid:${require('crypto').randomUUID()}`,
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [{ vendor: 'GrievEase Security', name: 'sbom-generator', version: '1.0.0' }],
    component: {
      type: 'application',
      name: 'grievease-web-app',
      version: '1.0.0',
      description: 'Standalone Self-Hosted Cooperative Housing Society Management Platform',
    },
  },
  components,
};

const outPath = path.resolve(__dirname, '../docs/evidence/sbom.json');
fs.writeFileSync(outPath, JSON.stringify(sbom, null, 2), 'utf8');
console.log(`✅ SBOM successfully generated at docs/evidence/sbom.json with ${components.length} components.`);
