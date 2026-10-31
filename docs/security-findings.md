# GrievEase Security Findings & Vulnerability Triage Matrix

> **Audit Date**: 2026-10-31  
> **Scope**: GrievEase Full-Stack Monorepo (Next.js Web, NestJS API, PostgreSQL, Redis, MinIO, Nginx)  
> **Auditor**: Senior Application Security & DevOps Engineering Team  
> **Evidence Archive**: `docs/evidence/`  
> **Rule Compliance**: Raw tool outputs attached; counts reported by severity per scanner tool.

---

## 1. Scanner Tool Findings Summary (Counts by Severity)

Every scanner tool execution has its raw, unedited stdout/JSON log archived in `docs/evidence/`. Per security audit policy, counts are categorized strictly by severity:

| Scanner / Audit Tool | Target Analyzed | Critical | High | Moderate / Med | Low | Info / Suppressed | Status & Raw Evidence |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`pnpm audit`** | Dependency lockfile (`pnpm-lock.yaml`) | **0** | **16** | **21** | **1** | **0** | `docs/evidence/pnpm-audit.log`<br>*(0 Critical; 16 High are transitive `multer` under express; allowlisted until Express 5 upstream release)* |
| **`scripts/secret-scan.js`** | Working tree (source code & config) | **0** | **0** | **0** | **0** | **0** | `docs/evidence/secret-scan.log`<br>*(Zero uncommitted credentials or tokens)* |
| **`scripts/git-history-scan.js`** | Full Git commit history (42 commits) | **0** | **0** | **0** | **0** | **0** | `docs/evidence/git-history-scan.log`<br>*(Zero leaked credentials across all branches/tags)* |
| **`scripts/run-trivy-audit.js`** | Base images & app filesystem | **0** | **0** | **0** | **0** | **0** | `docs/evidence/trivy-scan.log`<br>*(Alpine 3.20 hardened bases; zero RCEs)* |
| **`scripts/audit-unused-code.js`** | Production bundles, dependencies & dead routes | **0** | **0** | **0** | **0** | **0** | `docs/evidence/unused-code-audit.log`<br>*(Zero unused prod dependencies; zero dead routes)* |
| **`scripts/backup-restore-drill.js`** | 100k record simulated database & MinIO | **0** | **0** | **0** | **0** | **0** | `docs/evidence/backup-restore-drill.log`<br>*(Zero hash chain discrepancies; zero canary leaks)* |
| **`vitest test/unit`** | 29 test suites (191 unit tests) | **0** | **0** | **0** | **0** | **0** | `docs/evidence/unit-tests.log`<br>*(191 passed / 0 failed; 289/289 routes & sockets covered)* |
| **OWASP ZAP Dynamic Scan** | Live Staging Host | - | - | - | - | - | `NOT VERIFIED (needs staging or a human)`<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |
| **testssl.sh** | Live Staging TLS Endpoint (Port 443) | - | - | - | - | - | `NOT VERIFIED (needs staging or a human)`<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |
| **Nmap External Port Scan** | Live Staging Perimeter IP | - | - | - | - | - | `NOT VERIFIED (needs staging or a human)`<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |

---

## 2. Vulnerability Triage & Remediation Log

| Finding ID | Component | Category | Severity | Status | Resolution Summary & Raw Evidence |
|---|---|---|---|---|---|
| **SEC-001** | `apps/api/package.json` | Supply Chain | High | **FIXED** | Excised `xlsx` (SheetJS) package with prototype pollution advisories; migrated all Excel generation and parsing to secure, hardened `exceljs`. |
| **SEC-002** | `apps/api/src/common/config` | Configuration | High | **FIXED** | Implemented `env-validator.ts` enforcing rejection of weak/missing JWT secrets, dev db credentials, missing pepper, and debug flags in production. |
| **SEC-003** | `apps/api/src/common/filters` | Information Disclosure | High | **FIXED** | Implemented `log-redaction.ts` and hardened `http-exception.filter.ts` preventing database credentials, bearer tokens, or stack traces from appearing in logs or error bodies (verified by 11 unit tests in `forced-error-sanitization.spec.ts`). |
| **SEC-004** | `apps/api/src/common/utils` | Cryptography | Medium | **FIXED** | Added OWASP Argon2id password hashing parameters (m=64MB, t=3, p=2), server-side pepper integration, `Argon2ConcurrencyLimiter` to cap memory usage, and automated `needsRehash()` on login. |
| **SEC-005** | `apps/web/next.config.mjs` | Defense-in-Depth | Low | **FIXED** | Disabled `poweredByHeader` and `productionBrowserSourceMaps`. Enforced strict HTTP security response headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`). |
| **SEC-006** | `deploy/nginx.conf` | Network Security | High | **FIXED** | Configured TLS 1.2/1.3 only, phased HSTS rollout (`deploy/hsts.conf`), strict CSP, Nginx edge rate-limiting zones, and IP allowlisting for admin routes. |
| **SEC-007** | `deploy/db-roles.sql` | Least Privilege | High | **FIXED** | Implemented 5 distinct database roles (`grievease_app`, `grievease_worker`, `grievease_backup`, `grievease_ro`, `grievease_migrator`), RLS on all society tables, append-only constraints on `audit_log` & `cash_entry`, and Docker subnet IP restrictions in `pg_hba.conf`. |
| **SEC-008** | `apps/api/src/modules/auth` | Access Control | Low | **FIXED** | Changed `/setup` bootstrap route to return HTTP 404 (`NotFoundException`) once initial administrator account is created. |
| **SEC-009** | `scripts/backup-restore-drill.js`| Disaster Recovery | High | **FIXED** | Rehearsed 100k-record realistic scale backup/restore drill with AES-256-GCM encryption, RTO 0.0021s, RPO < 15 min, PITR rehearsal, offsite replication (`scripts/backup-offsite.sh`), and standalone key custody (`docs/key-custody.md`). |
| **SEC-010** | `.github/workflows/ci.yml` | CI/CD Security | Medium | **FIXED** | Pinned all GitHub Actions to immutable commit SHAs, set `permissions: contents: read`, added pre-commit hooks, dead code gates, and weekly Dependabot automation. |
| **SEC-011** | Supply Chain Overrides | Prototype Pollution | Critical | **FIXED** | Added `pnpm.overrides` in `pnpm-workspace.yaml` pinning `tinypool: ">=2.1.2"` and `body-parser: ">=1.20.6"`. Eradicated both Critical prototype pollution advisories. |
| **SEC-012** | Local Dev Scripts | Credentials | Low | **FALSE POSITIVE** | Placeholder strings like `local_dev_secret_replace_in_prod` in `.env.example` and CI docker-compose files are for non-production local containers and rejected in production by `env-validator.ts`. |
| **SEC-013** | Transitive `multer` Advisories| DoS Vulnerability | High | **ALLOWLISTED** | Transitive dependency of `@nestjs/platform-express` (`multer@1.4.5-lts.1`). Documented with risk assessment and scheduled upstream upgrade date in `docs/dependency-advisories-allowlist.md`. |
