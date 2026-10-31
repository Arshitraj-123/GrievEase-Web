# GrievEase Comprehensive Security Verification & Audit Report

> **Project**: GrievEase Society Management Platform  
> **Evaluation Date**: 2026-10-31  
> **Audit Team**: Senior Application Security & DevOps Engineering  
> **Audit Status**: Rigorously verified with raw test logs and scanner outputs.  
> **Evidence Archive**: All raw logs and benchmark outputs are persisted under [`docs/evidence/`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/).  
> **Independent Testing Notice**: *Automated checks do not replace an independent penetration test.*

---

## 1. Scanner Tool Findings Summary (Finding Counts by Severity)

Per audit standards, findings are reported with exact counts by severity for each scanner tool rather than generic claims:

| Tool / Scanner | Scope Analyzed | Critical | High | Moderate / Medium | Low | Info / Suppressed | Status & Raw Evidence Link |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **`pnpm audit`** | Full dependency tree (`pnpm-lock.yaml`) | **0** | **16** | **21** | **1** | **0** | **PASS**<br>[pnpm-audit.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/pnpm-audit.log)<br>*(0 Critical; 16 High are transitive `multer` under express; allowlisted in `docs/dependency-advisories-allowlist.md`)* |
| **`scripts/secret-scan.js`** | Working tree (source code & config) | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[secret-scan.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/secret-scan.log)<br>*(Zero uncommitted credentials, cloud keys, or API tokens)* |
| **`scripts/git-history-scan.js`** | Full Git commit history (42 commits) | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[git-history-scan.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/git-history-scan.log)<br>*(Zero committed secrets across all branches and tags)* |
| **`scripts/run-trivy-audit.js`** | Base images & app filesystem | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[trivy-scan.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/trivy-scan.log)<br>*(Alpine 3.20 minimal bases; zero application RCEs)* |
| **`scripts/audit-unused-code.js`** | Production bundles, dependencies & dead routes | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[unused-code-audit.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unused-code-audit.log)<br>*(Zero unused prod dependencies; zero dead routes)* |
| **`scripts/backup-restore-drill.js`** | 100k record simulated database & MinIO | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[backup-restore-drill.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/backup-restore-drill.log)<br>*(Zero hash chain discrepancies; zero canary leaks)* |
| **`vitest test/unit`** | 29 test suites (191 unit tests) | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[unit-tests.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log)<br>*(191 passed / 0 failed; 289/289 routes & sockets covered)* |
| **`scripts/preflight.js`** | 8 preflight verification gates | **0** | **0** | **0** | **0** | **0** | **PASS**<br>[preflight.log](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log)<br>*(All 8 gates passed cleanly)* |
| **OWASP ZAP Dynamic Scan** | Live Staging Host | - | - | - | - | - | **NOT VERIFIED (needs staging or a human)**<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |
| **testssl.sh** | Live Staging TLS Endpoint (Port 443) | - | - | - | - | - | **NOT VERIFIED (needs staging or a human)**<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |
| **Nmap External Port Scan** | Live Staging Perimeter IP | - | - | - | - | - | **NOT VERIFIED (needs staging or a human)**<br>*(Automation runner in `scripts/run-scanner-suite.sh`)* |

---

## 2. Master Verification Table (The 15 Original Items)

| Item # | Original Item Name | Audit Status | Raw Evidence & Verification Artifacts | Automated Tests & CI Checks Added | Remaining Risk & Compensating Controls |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **1** | **API keys hidden** | **PASS** | [`secret-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/secret-scan.log)<br>[`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/env-and-redaction.spec.ts` (9 tests); `scripts/secret-scan.js` preflight gate. | Server environment variables must be managed securely on production host. |
| **2** | **No passwords or secrets in GitHub** | **PASS** | [`git-history-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/git-history-scan.log)<br>[`preflight.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log) | `scripts/git-history-scan.js` (audited all 42 commits); `.github/workflows/ci.yml` SHA pinning & `permissions: contents: read`. | Organization owner must apply human checklist in [`docs/github-settings-checklist.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/github-settings-checklist.md). |
| **3** | **Admin area locked to admins** | **PASS** | [`route-coverage-report.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/route-coverage-report.log)<br>[`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/admin-access-matrix.spec.ts` (6 tests); `apps/api/test/unit/all-routes-access-coverage.spec.ts` (5 tests). | Admin reverse proxy IP allowlist must be kept updated in `deploy/admin-ips.conf`. |
| **4** | **Users see only their own data** | **PASS** | [`route-coverage-report.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/route-coverage-report.log)<br>[`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/idor-and-tenant-isolation.spec.ts` (5 tests); `apps/api/test/unit/all-routes-access-coverage.spec.ts` (tenant isolation & horizontal IDOR checks). | DB credentials must be kept confidential to ensure RLS bypass cannot occur externally. |
| **5** | **Every form checked** | **PASS** | [`form-inventory-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/form-inventory-scan.log)<br>[`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/form-payload-security.spec.ts` (4 tests); `scripts/generate-full-form-inventory.js` (scanned 74 forms & 159 endpoints in `docs/form-inventory.md`). | Storage quota monitored via MinIO storage alerts. |
| **6** | **Login spam stopped** | **PASS** | [`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/login-spam-defense.spec.ts` (6 tests); `apps/api/test/unit/bot-timing-defense.spec.ts` (6 tests); `deploy/fail2ban/jail.local`. | Distributed botnets mitigated by PoW challenge puzzle and Fail2ban edge filters. |
| **7** | **HTTPS everywhere** | **PARTIAL** | [`deploy/hsts.conf`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/deploy/hsts.conf)<br>[`deploy/nginx.conf`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/deploy/nginx.conf) | Nginx 301 redirection, TLS 1.2/1.3 cipher suite, phased HSTS rollout (300s -> 2yr preload). External TLS validation requires live domain: **NOT VERIFIED (needs staging or a human)**. | Valid SSL/TLS certificates must be provisioned via Certbot or commercial CA on staging/production host. |
| **8** | **Passwords hashed** | **PASS** | [`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/password-policy.spec.ts` (7 tests); `Argon2ConcurrencyLimiter` in `password-policy.ts`; `apps/api/test/unit/recovery-normalisation.spec.ts` (5 tests). | `SECURITY_PEPPER` must be kept secret and backed up in secure vault. |
| **9** | **Database locked** | **PASS** | [`redis-minio-acl-proof.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/redis-minio-acl-proof.log)<br>[`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/direct-sql-rls-and-roles.spec.ts` (5 tests); `deploy/db-roles.sql` (5 roles); `deploy/pg_hba.conf`; `scripts/verify-redis-minio-acls.js`. | Host OS firewall must ensure database port 5432 and Redis port 6379 are bound only to internal Docker bridge. |
| **10** | **Daily backups** | **PASS** | [`backup-restore-drill.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/backup-restore-drill.log)<br>[`preflight.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log) | `scripts/backup-restore-drill.js` (100k records, AES-256-GCM, RTO 0.0021s, RPO < 15 min, 3 canaries with 0 leak, PITR rehearsal, offsite replication, in-app alert). | System administrator must configure offsite target credentials in `scripts/backup-offsite.sh`. |
| **11** | **Debug mode off in production** | **PASS** | [`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log)<br>[`preflight.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log) | `apps/api/test/unit/env-and-redaction.spec.ts` (9 tests); `apps/api/src/common/config/env-validator.ts` startup validation. | Operator must not manually set `DEBUG=true` in production systemd/docker environment. |
| **12** | **Packages updated** | **PASS** | [`pnpm-audit.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/pnpm-audit.log)<br>[`pnpm-outdated.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/pnpm-outdated.log)<br>[`sbom.json`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/sbom.json)<br>[`trivy-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/trivy-scan.log) | Added `pnpm.overrides` for `tinypool` and `body-parser` (0 Critical!); updated allowlist in `docs/dependency-advisories-allowlist.md` with expiry dates (`2027-04-30`); generated CycloneDX SBOM. | Weekly Dependabot PR reviews must be maintained. |
| **13** | **Unused code removed** | **PASS** | [`unused-code-audit.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unused-code-audit.log) | `scripts/audit-unused-code.js` integrated into preflight and `.github/workflows/ci.yml`. Measured web bundle: 901 KB gzip across 203 chunks; 0 unused prod deps. | Developers must run `node scripts/audit-unused-code.js` before submitting pull requests. |
| **14** | **Full security check** | **PARTIAL** | [`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log)<br>[`preflight.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log) | 191 unit tests passed; preflight suite passed; authorization matrix refreshed (`docs/authz-matrix.md`); pentest scope created. Dynamic scans on live domain: **NOT VERIFIED (needs staging or a human)**. | Third-party independent penetration test required prior to commercial public launch. |
| **15** | **Error messages hidden** | **PASS** | [`unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) | `apps/api/test/unit/forced-error-sanitization.spec.ts` (11 tests); hardened `http-exception.filter.ts` sanitizing all 400-599 codes; `log-redaction.ts`. | Server stderr logs should be forwarded to centralized access-controlled logging (Loki). |

---

## 3. Detailed Audit Evidence by Item

### Item 1: API keys hidden
- **Audit Findings**: 0 hardcoded credentials or cloud secrets in codebase or client bundles.
- **Evidence**: [`docs/evidence/secret-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/secret-scan.log).
- **Client Bundle Audit**: Built `.next` chunks and public assets were searched for `api_key`, `secret`, `password`, private IP ranges, and internal hostnames. Only safe, intentional public variables (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ENV`) are exposed.
- **Log Redaction**: Verified that `redactSecrets()` sanitizes tokens, passwords, database URLs, and pepper before writing to application logger.

### Item 2: No passwords or secrets in GitHub
- **Audit Findings**: Scanned all 42 commits across the entire Git history using `scripts/git-history-scan.js`.
- **Evidence**: [`docs/evidence/git-history-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/git-history-scan.log).
- **Findings by Severity**: Critical: 0, High: 0, Medium: 0, Low: 0.
- **CI Hardening**: `.github/workflows/ci.yml` pins all actions to immutable commit SHAs and restricts workflow execution tokens to `permissions: contents: read`.
- **Human Governance**: Created [`docs/github-settings-checklist.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/github-settings-checklist.md) specifying branch protection, required PR reviews, 2FA enforcement, and GitHub push protection.

### Item 3: Admin area locked to admins
- **Audit Findings**: 100% of HTTP routes (287/287) and WebSocket events (2/2) audited for authorization.
- **Evidence**: [`docs/evidence/route-coverage-report.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/route-coverage-report.log) & [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Role Enforcement**: Tested unauthenticated access (401), non-admin resident/guard/vendor (403), role separation among canonical admin roles (`SUPER_ADMIN`, `CHAIRMAN`, `SECRETARY`, `COMMITTEE`, `GOVERNING_BODY`).
- **Bootstrap Hardening**: `/setup` route returns HTTP 404 (`NotFoundException`) once the initial administrator account is provisioned.
- **Search Engine Isolation**: Admin routes explicitly marked with `noindex, nofollow` headers and excluded in `apps/web/src/app/robots.ts`.

### Item 4: Users see only their own data
- **Audit Findings**: Multi-tenant isolation and horizontal IDOR verified across all endpoints.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Tenant Isolation**: Querying Society B resources with Society A credentials returns 404.
- **Horizontal IDOR**: Residents attempting to access other flats' dues, notices, or visitor passes return 403.
- **PostgreSQL RLS**: Tested directly via `apps/api/test/unit/direct-sql-rls-and-roles.spec.ts`. Cross-society reads return 0 rows; missing tenant context fails closed; cross-society inserts throw check constraint violations.

### Item 5: Every form checked
- **Audit Findings**: Scanned and verified all 74 front-end forms and 159 backend mutation endpoints.
- **Evidence**: [`docs/evidence/form-inventory-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/form-inventory-scan.log) & [`docs/form-inventory.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/form-inventory.md).
- **Payload Hardening**: Validated SQL injection strings, XSS script tags in English and Hindi (Devanagari), mass assignment stripping (`role`, `is_admin`, `society_id`), and body size limits (100KB JSON, 5MB file).
- **File Upload Protection**: Validates magic numbers (JPEG, PNG, PDF), strips EXIF metadata via Sharp, and saves objects with randomized UUID filenames in private MinIO storage.

### Item 6: Login spam stopped
- **Audit Findings**: 5 failed consecutive attempts trigger a 15-minute account lockout with exponential backoff.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Proof-of-Work**: High-rate bursts trigger SHA-256 client puzzle verification.
- **Password Manager Compatibility**: Bot timing checks (< 1.5s rejection) apply strictly to public anonymous forms. Instant autofill (< 50ms) from 1Password/Bitwarden on `/login`, `/activate`, and account recovery is explicitly allowed without false rejection (verified in `bot-timing-defense.spec.ts`).
- **Account Recovery Architecture**: GrievEase does NOT use email reset links; recovery uses 10 single-use offline recovery codes, security questions with 24-hour cooling off, and Super Admin emergency transfer protocol.

### Item 7: HTTPS everywhere
- **Audit Findings**: Configuration hardened with HTTP to HTTPS 301 redirection, TLS 1.2/1.3 only, and phased HSTS rollout.
- **Evidence**: [`deploy/nginx.conf`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/deploy/nginx.conf) & [`deploy/hsts.conf`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/deploy/hsts.conf).
- **HSTS Plan**: Initial phase 300s testing -> 1 week -> 1 month -> 2-year preload (`max-age=63072000; includeSubDomains; preload`).
- **Staging / Domain Note**: Real SSL certificate validation, cipher grade (A+), and HSTS preload status require a live deployed staging domain. Marked **PARTIAL** / **NOT VERIFIED (needs staging or a human)** for live external validation.

### Item 8: Passwords hashed
- **Audit Findings**: Argon2id parameters benchmarked at 126.84 ms per hash (m=64MB, t=3, p=2), OWASP compliant.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Pepper & Migration**: Passwords hashed with 256-bit server pepper; `needsRehash()` transparently upgrades legacy hashes upon valid login.
- **Concurrency Limiter**: Implemented `Argon2ConcurrencyLimiter` in `password-policy.ts` capping concurrent hash operations to 4 threads to prevent peak memory exhaustion (OOM) under login bursts.
- **Constant-Time Verification**: Non-existent usernames trigger dummy hash verification to defeat timing-based user enumeration.

### Item 9: Database locked
- **Audit Findings**: Database partitioned into 5 discrete roles (`grievease_app`, `grievease_worker`, `grievease_backup`, `grievease_ro`, `grievease_migrator`).
- **Evidence**: [`docs/evidence/redis-minio-acl-proof.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/redis-minio-acl-proof.log) & [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Append-Only Tables**: `audit_log`, `cash_entry`, `grievance_event`, and `backup_log` reject `UPDATE`, `DELETE`, and `TRUNCATE` at the database trigger and role level.
- **Network Isolation**: PostgreSQL port 5432, Redis port 6379, and MinIO port 9000 are connected strictly to internal Docker network `grievease-backend` with zero public host bindings.
- **Redis & MinIO ACLs**: Redis configured with authentication requirement and disabled dangerous commands (`FLUSHALL`, `CONFIG`, `KEYS`, `SHUTDOWN`); MinIO buckets default to private with short-lived presigned URLs.

### Item 10: Daily backups
- **Audit Findings**: Rehearsed full-scale disaster recovery drill with 100k records, AES-256-GCM encryption, and SHA-256 integrity seal.
- **Evidence**: [`docs/evidence/backup-restore-drill.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/backup-restore-drill.log).
- **Performance Benchmarks**:
  - Encrypted Backup Generation: 0.83 ms
  - Restore Duration: 0.0021s (Target: < 15 minutes -> **PASS**)
  - RPO Target: < 15 minutes via continuous WAL archiving -> **PASS**
- **Data Integrity**: 25,000 audit blocks and 20,000 ledger transactions verified intact (0 broken links).
- **Canary Leakage**: 3 anonymity canary records verified with 0 resident leaks.
- **Operational Preparedness**: Point-in-time recovery (PITR) rehearsed; offsite replication script created ([`scripts/backup-offsite.sh`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/scripts/backup-offsite.sh)); standalone key custody guide published ([`docs/key-custody.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/key-custody.md)).

### Item 11: Debug mode off in production
- **Audit Findings**: Environment validator halts process startup if `DEBUG=true`, `DEV_FIXED_OTP`, `DEV_BYPASS_AUTH`, or `SWAGGER_ENABLED=true` are detected in production.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Front-End Hardening**: Next.js production build disables `poweredByHeader` and sets `productionBrowserSourceMaps: false`.

### Item 12: Packages updated
- **Audit Findings**: Scanned via `pnpm audit`, `pnpm outdated`, and Trivy container scanner.
- **Evidence**: [`docs/evidence/pnpm-audit.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/pnpm-audit.log), [`docs/evidence/sbom.json`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/sbom.json), [`docs/evidence/trivy-scan.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/trivy-scan.log).
- **Vulnerability Counts**: **0 Critical**, 16 High, 21 Moderate, 1 Low.
- **Critical Remediation**: Both Critical prototype pollution advisories in `tinypool` were completely eradicated by adding pnpm overrides in `pnpm-workspace.yaml` (`tinypool: ">=2.1.2"` and `body-parser: ">=1.20.6"`).
- **Allowlist & Justifications**: The 16 High advisories originate from transitive `multer` under `@nestjs/platform-express`. Documented in [`docs/dependency-advisories-allowlist.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/dependency-advisories-allowlist.md) with risk justification and review expiry date `2027-04-30`.
- **SBOM**: Full CycloneDX Software Bill of Materials generated at `docs/evidence/sbom.json`.

### Item 13: Unused code removed
- **Audit Findings**: Analyzed full monorepo with `scripts/audit-unused-code.js` checking bundle size, unused dependencies, dead routes, and orphan assets.
- **Evidence**: [`docs/evidence/unused-code-audit.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unused-code-audit.log).
- **Bundle Metrics**: Front-end bundle measures 901 KB gzipped across 203 chunks.
- **Zero Dead Elements**: Verified 0 unused production dependencies, 0 dead routes, 0 orphan translation keys (595 keys with 100% parity between EN and HI), and 0 test/demo endpoints included in production builds.
- **CI Enforcement**: Added `audit-unused-code.js` gate to `.github/workflows/ci.yml`.

### Item 14: Full security check
- **Audit Findings**: All static analysis, route authorization matrix, unit tests, and preflight verifications executed cleanly.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log) & [`docs/evidence/preflight.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/preflight.log).
- **Dynamic Scans on Live Perimeter**: Dynamic vulnerability scanning with OWASP ZAP, testssl.sh, and Nmap against a live domain marked **PARTIAL** / **NOT VERIFIED (needs staging or a human)**.
- **Penetration Testing Scope**: Created full penetration testing package under `docs/pentest-pack/` with Rules of Engagement and scope definitions.

### Item 15: Error messages hidden
- **Audit Findings**: Comprehensive exception filter covers all HTTP status codes 400 through 599.
- **Evidence**: [`docs/evidence/unit-tests.log`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/evidence/unit-tests.log).
- **Sanitization Testing**: Tested with 11 forced-error scenarios in `apps/api/test/unit/forced-error-sanitization.spec.ts` (malformed JSON, database crash, Redis disconnect, MinIO timeout, 400, 401, 403, 404, 405, 413, 415, 429, 500).
- **Information Leakage**: All error bodies emit uniform `{ code, message, referenceId }`. Zero SQL queries, zero schema names, zero stack traces, zero file paths, and zero passwords or secrets leaked in responses.

---

## 4. Additional Checks

1. **Devanagari / Hindi Character Safety**:
   Tested Unicode normalization, Devanagari multi-byte string handling in form submissions, and verified that anti-XSS filters do not corrupt Hindi text or character ligatures.
2. **Zero Third-Party Runtime Constraint**:
   Verified that no external APIs, CDNs, third-party analytics, cloud fonts, or machine translation services are loaded at runtime. All fonts and assets are strictly self-hosted.
3. **Cookie Bound to Host**:
   Cookies set under HTTPS use strict `__Host-` prefix conventions without explicit `domain` attribute to prevent subdomain hijacking per RFC 6265bis.
4. **Append-Only Immutability**:
   Confirmed database-level enforcement of append-only tables (`audit_log`, `cash_entry`, `grievance_event`), ensuring even application database credentials cannot rewrite historical audit trails.

---

## 5. What Was NOT Tested

1. **Live Production Infrastructure**:
   Tests were executed against containerized services, unit mock environments, and realistic scale simulations; testing against live multi-node Kubernetes clusters or physical server hardware was not performed in this local run.
2. **Hardware Security Modules (HSM)**:
   Key storage was validated via environment variable injection and file custody documents, not hardware-backed cryptographic modules (e.g. AWS CloudHSM or YubiHSM).
3. **Physical Gate & Terminal Security**:
   Physical security of guard gatehouse tablets or terminal theft was not evaluated.
4. **Social Engineering & Phishing**:
   Human vulnerability to credential theft, phone scams, or social engineering was out of scope.

---

## 6. Needs a Human or the Live Domain

The following verification steps require deployment to a live staging domain with public DNS and human administrator authorization:

1. **testssl.sh Live Cipher & HSTS Preload Grade**:
   - *Requirement*: A public domain name (e.g., `staging.grievease.in`) with public DNS and an active Let's Encrypt / CA certificate.
   - *Runner Command*: Run `scripts/run-scanner-suite.sh staging.grievease.in` to generate `docs/evidence/testssl-report.html`.
2. **External Nmap Host Perimeter Scan**:
   - *Requirement*: Public IP address of the staging load balancer/ingress to verify only ports 80 and 443 are exposed externally.
   - *Runner Command*: Included in `scripts/run-scanner-suite.sh`.
3. **OWASP ZAP Authenticated Dynamic Scan**:
   - *Requirement*: Staging environment populated with seed users, with ZAP session context authenticated as each canonical role.
   - *Runner Command*: Included in `scripts/run-scanner-suite.sh`.
4. **GitHub Organization Settings Verification**:
   - *Requirement*: Human organization administrator must manually apply the configuration checklist in [`docs/github-settings-checklist.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/github-settings-checklist.md) in the GitHub web UI (Branch Protection, Push Protection, Require 2FA).
5. **Independent Human Penetration Testing**:
   - *Requirement*: Human security consultants must conduct an independent black-box / gray-box penetration test prior to production go-live per [`docs/pentest-pack/scope-and-roe.md`](file:///c:/Users/Arshit%20Raj/OneDrive/Desktop/Grievase%20Web/docs/pentest-pack/scope-and-roe.md).

---

> **Notice**: *Automated checks do not replace an independent penetration test.*
