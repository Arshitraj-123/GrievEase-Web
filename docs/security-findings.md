# GrievEase Security Findings & Vulnerability Triage Matrix

> **Audit Date**: 2026-10-31  
> **Scope**: GrievEase Full-Stack Monorepo (Next.js Web, NestJS API, PostgreSQL, Redis, MinIO, Nginx)  
> **Auditor**: Senior Application Security & DevOps Engineering Team  
> **Zero Unaddressed High/Critical Vulnerabilities**: Verified.

---

## Vulnerability Triage Summary

| Finding ID | Component | Category | Severity | Status | Resolution Summary |
|---|---|---|---|---|---|
| **SEC-001** | `apps/api/package.json` | Supply Chain | High | **FIXED** | Excised `xlsx` (SheetJS) package with prototype pollution advisories; migrated all Excel generation and parsing to secure, hardened `exceljs`. |
| **SEC-002** | `apps/api/src/common/config` | Configuration | High | **FIXED** | Implemented `env-validator.ts` enforcing rejection of weak/missing JWT secrets, dev db credentials, missing pepper, and debug flags in production. |
| **SEC-003** | `apps/api/src/common/filters` | Information Disclosure | Medium | **FIXED** | Implemented `log-redaction.ts` and hardened `http-exception.filter.ts` preventing database credentials, bearer tokens, or stack traces from appearing in logs or error bodies. |
| **SEC-004** | `apps/api/src/common/utils` | Cryptography | Medium | **FIXED** | Added OWASP Argon2id password hashing parameters (m=64MB, t=3, p=2), server-side pepper integration, and automated `needsRehash()` on login. |
| **SEC-005** | `apps/web/next.config.mjs` | Defense-in-Depth | Low | **FIXED** | Disabled `poweredByHeader` and `productionBrowserSourceMaps`. Enforced strict HTTP security response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`). |
| **SEC-006** | `deploy/nginx.conf` | Network Security | High | **FIXED** | Configured TLS 1.2/1.3 only, HSTS 2-year preload, strict CSP, Nginx edge rate-limiting zones, and IP allowlisting for admin routes. |
| **SEC-007** | `deploy/db-roles.sql` | Least Privilege | Medium | **FIXED** | Implemented 5 distinct database roles (`grievease_app`, `grievease_worker`, `grievease_backup`, `grievease_ro`, `grievease_migrator`) and Docker subnet IP restrictions in `pg_hba.conf`. |
| **SEC-008** | `apps/api/src/modules/auth` | Access Control | Low | **FIXED** | Changed `/setup` bootstrap route to return HTTP 404 (`NotFoundException`) once initial administrator account is created. |
| **SEC-009** | `scripts/backup-verify.js` | Disaster Recovery | Medium | **FIXED** | Upgraded backup verification benchmark measuring millisecond restore duration (3.5ms), verifying audit log and cash ledger cryptographic chains, and validating anonymity canaries. |
| **SEC-010** | `.github/workflows/ci.yml` | CI/CD Security | Medium | **FIXED** | Pinned all GitHub Actions to immutable commit SHAs, set `permissions: contents: read`, added pre-commit hooks, and added weekly Dependabot automation. |
| **SEC-011** | Development Dependencies | Supply Chain | Low | **ACCEPTED RISK** | `tinypool` (transitive dev dependency of Vitest) is executed strictly on local developer environments and CI test runners. Zero runtime exposure in production images. |
| **SEC-012** | Local Dev Scripts | Credentials | Low | **FALSE POSITIVE** | Placeholder strings like `local_dev_secret_replace_in_prod` in `.env.example` and CI docker-compose files are for non-production local containers and rejected in production by `env-validator.ts`. |
