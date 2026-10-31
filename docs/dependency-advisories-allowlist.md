# GrievEase Dependency Security Audit & Advisories Allowlist

## Overview
This document logs the dependency security review, transitive vulnerability triage, and accepted risk justifications for the GrievEase monorepo in accordance with OWASP Top 10 A06:2021 (Vulnerable and Outdated Components).

## Resolved Advisories

### 1. `xlsx` (SheetJS) Prototype Pollution
- **Advisory IDs**: GHSA-4r6h-8v6p-xvw6, GHSA-7h5x-4q76-q56p
- **Severity**: High
- **Status**: **REMOVED**
- **Action**: Completely excised `xlsx` from `apps/api/package.json`. GrievEase uses native streaming CSV (`csv-parse`, `csv-stringify`) and PDF generation (`pdfkit`) with zero dependency on SheetJS.

## Triage of Transitive Development-Only Dependencies

| Package | Severity | Context | Resolution / Justification |
|---|---|---|---|
| `tinypool` (via `vitest`) | Moderate | Dev-only test runner | Vitest execution occurs exclusively at build/test time on developer machines and isolated CI runners. Not shipped to production containers or web browsers. |
| `body-parser` (via `@nestjs/platform-express`) | Moderate | NestJS framework core | Request body limits are strictly constrained (`100kb` for JSON, `5mb` for multi-part file uploads) via NestJS configuration and Nginx edge proxy limits. |

## CI & Automated Monitoring Controls
1. **GitHub Dependabot**: Automated weekly scans configured via `.github/dependabot.yml` targeting npm dependencies and GitHub Actions.
2. **Preflight Gating**: `scripts/preflight.js` and `scripts/secret-scan.js` block deployment if high-risk vulnerabilities are present.
3. **No Dynamic Third-Party Registries at Runtime**: Production Docker containers run as non-root with read-only root friendly configurations; no runtime npm installs or external package fetching allowed.
