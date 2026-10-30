# OWASP ASVS v4.0 Level 2 Verification Checklist

This document benchmarks the GrievEase architecture, code, and operational controls against the **OWASP Application Security Verification Standard (ASVS) 4.0 Level 2** (Applications that handle sensitive transactions, financial operations, PII, and healthcare/housing governance data).

---

## V1: Architecture, Design and Threat Modeling Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1.1.1** | Secure Software Development Lifecycle is followed with defined security objectives. | Continuous preflight checks (`pnpm preflight`), i18n parity, strict TypeScript compilation, unit & integration test pipelines. | `package.json`, `scripts/preflight.js` | **VERIFIED** |
| **1.1.2** | Threat model is produced per component using STRIDE methodology. | Exhaustive threat model document covering 8 distinct functional modules, trust boundaries, and mitigations. | `docs/threat-model.md` | **VERIFIED** |
| **1.4.1** | Trust boundaries are explicitly enforced with least-privilege principles. | Multi-tenant PostgreSQL Row-Level Security (RLS) on all 28 tables; separate read/write roles; isolated context variables per request. | `apps/api/src/database/migrations/*.sql` | **VERIFIED** |
| **1.5.1** | Zero third-party runtime dependencies for security-critical services. | Air-gapped ready: self-hosted Argon2id, PoW captcha, local MinIO storage, WebSockets, no external telemetry or CDNs. | `docs/SECURITY.md`, `scripts/claims-audit.js` | **VERIFIED** |

---

## V2: Authentication Verification Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **2.1.1** | Passwords hashed with approved modern algorithm (Argon2id, bcrypt, or PBKDF2). | Passwords hashed with Argon2id (`m=65536, t=3, p=2`) with unique random salt. | `apps/api/src/modules/auth/auth.service.ts`, `test/unit/password-policy.spec.ts` | **VERIFIED** |
| **2.1.2** | Password minimum length enforced (10 for users/guards/vendors; 12 for admins). | Zod schema checks and service-level password validator reject weak or breached passwords. | `packages/contracts/src/auth.schema.ts`, `auth.service.ts` | **VERIFIED** |
| **2.1.7** | Common dictionary / breached passwords blocked offline. | Built-in offline blacklist of top 100,000 common passwords evaluated without third-party network APIs. | `apps/api/src/common/utils/password-blacklist.ts` | **VERIFIED** |
| **2.1.9** | Constant-time execution for user authentication to prevent user enumeration. | `dummyVerify()` runs full Argon2id hash computation when a username is absent. | `auth.service.ts`, `test/unit/password-policy.spec.ts` | **VERIFIED** |
| **2.2.1** | Anti-automation / rate limiting protects authentication endpoints. | Cryptographic Proof-of-Work (PoW) SHA-256 puzzle enforced after 3 failures; 5 failures locks account. | `apps/api/src/modules/auth/pow.service.ts`, `test/unit/proof-of-work.spec.ts` | **VERIFIED** |
| **2.4.1** | Multi-Factor Authentication (MFA) required for all administrative roles. | RFC 6238 TOTP enforced for `SECRETARY`, `CHAIRMAN`, `COMMITTEE`, `SUPER_ADMIN`; 10 Argon2id backup codes. | `apps/api/src/modules/auth/totp.service.ts` | **VERIFIED** |
| **2.8.1** | Step-Up authentication for sensitive administrative operations. | Step-up JWT claim (5-minute TTL) required for bulk imports, role transfers, credential slips, and key exports. | `apps/api/src/common/guards/step-up.guard.ts` | **VERIFIED** |

---

## V3: Session Management Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **3.2.1** | Session tokens possess sufficient entropy (at least 128 bits). | Refresh tokens generated using `crypto.randomBytes(32)` (256-bit entropy). | `apps/api/src/modules/auth/auth.service.ts` | **VERIFIED** |
| **3.3.1** | Session tokens sent via secure HTTP cookies. | `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, `__Host-` prefixed cookie. | `apps/web/src/app/api/auth/` BFF routes | **VERIFIED** |
| **3.3.2** | Automatic token rotation on every refresh request. | Old refresh token invalidated immediately upon presentation; single-use only. | `auth.service.ts`, `test/unit/lockout-and-rotation.spec.ts` | **VERIFIED** |
| **3.3.3** | Token reuse detection terminates the entire compromised session lineage. | When a consumed refresh token is presented, `revokeFamily(familyId)` terminates all related sessions. | `auth.service.ts`, `test/unit/lockout-and-rotation.spec.ts` | **VERIFIED** |
| **3.4.1** | Inactivity timeout enforced server-side. | Access tokens expire in 15 minutes; Redis session TTL terminates idle sessions after 15 minutes. | `auth.service.ts` | **VERIFIED** |
| **3.4.2** | Concurrent session limit enforced per account. | Maximum 5 concurrent sessions per user; oldest session revoked upon exceeding cap. | `auth.service.ts` | **VERIFIED** |

---

## V4: Access Control Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **4.1.1** | Principle of least privilege enforced on every endpoint. | NestJS `RolesGuard` + metadata permissions (`@RequirePermissions()`) check user capabilities on every route. | `apps/api/src/common/guards/roles.guard.ts` | **VERIFIED** |
| **4.1.2** | Multi-tenant isolation enforced at the data layer to prevent IDOR. | PostgreSQL Row-Level Security (RLS) dynamically filters rows based on session `app.current_society`. | `apps/api/src/database/migrations/*.sql` | **VERIFIED** |
| **4.1.3** | Maker-Checker separation of duties for financial modifications. | The creator (`created_by`) of a waiver, void, credit note, or bill generation can NEVER approve it. | `apps/api/src/modules/billing/billing.service.ts`, `test/unit/phase7-amenities-billing.spec.ts` | **VERIFIED** |
| **4.1.5** | Sole-approver safeguards for single-admin societies. | Super Admin sole approval logs explicit `SOLE_APPROVER` audit flag and broadcasts in-app notices to Governing Body. | `apps/api/src/modules/billing/billing.service.ts` | **VERIFIED** |
| **4.2.1** | Horizontal privilege escalation blocked. | Flat residents can only query their own flats, passes, dues, and complaints; vendor accounts isolated to `/vendor`. | `apps/api/src/modules/` controllers & RLS | **VERIFIED** |

---

## V5: Validation, Sanitization and Encoding
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **5.1.1** | Input validation on all incoming parameters. | Strict Zod schemas validate data types, string length, regex patterns, and reject unexpected fields. | `packages/contracts/src/*.schema.ts`, NestJS `ZodValidationPipe` | **VERIFIED** |
| **5.2.1** | SQL Injection prevention via parameterized queries. | 100% of queries use PostgreSQL parameterized bindings (`$1, $2, ...`) or typed knex query builder. Zero raw string concatenation. | `apps/api/src/` repositories & services | **VERIFIED** |
| **5.3.1** | Output encoding and Cross-Site Scripting (XSS) defense. | Next.js React JSX auto-encodes HTML entities; user markdown sanitized before rendering; Content Security Policy header set. | `apps/web/next.config.ts`, `apps/web/src/` components | **VERIFIED** |
| **5.5.1** | CSV Formula Injection defense on data exports. | All cell values beginning with `=`, `+`, `-`, `@`, `\t`, `\r` are prefixed with a single quote `'` in CSV exports. | `apps/api/src/common/utils/report-exporter.ts`, `test/unit/report-exporter.spec.ts` | **VERIFIED** |

---

## V6: Stored Cryptography Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **6.1.1** | Approved cryptographic algorithms used. | AES-256-GCM for backup dumps; SHA-256 for audit chaining and PoW; Argon2id for passwords; HMAC-SHA256 for JWTs and anonymity hashes. | `apps/api/src/common/utils/` crypto utilities | **VERIFIED** |
| **6.2.1** | Cryptographic secrets managed securely with rotation procedures. | Secrets loaded from environment; keys versioned (e.g. `KEY_V1`); key rotation runbook documented. | `docs/key-custody.md`, `docs/runbooks/key-rotation.md` | **VERIFIED** |
| **6.4.1** | Anonymity preservation for sensitive whistleblower data. | Resident identity masked with `HMAC-SHA256(resident_id + society_salt)`; canary tests verify zero PII leakage. | `apps/api/src/common/utils/anonymity.ts`, `test/unit/anonymity-leak.spec.ts` | **VERIFIED** |

---

## V7: Error Handling and Logging Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **7.1.1** | Generic error messages returned to clients. | Production exception filter strips stack traces and internal DB errors, returning standardized `RFC 7807` problem details. | `apps/api/src/common/filters/http-exception.filter.ts` | **VERIFIED** |
| **7.2.1** | Tamper-evident cryptographic audit log. | `audit_log` records actor, IP, timestamp, action, diff, and `SHA-256(prev_hash + entry)`; DB trigger prevents UPDATE/DELETE. | `apps/api/src/modules/audit/audit.service.ts`, `test/unit/audit-hash-chain.spec.ts` | **VERIFIED** |
| **7.3.1** | Sensitive data access audit logging. | All views of member rosters, audit logs, and data exports captured in `sensitive_access_log`. | `apps/api/src/modules/privacy/privacy.service.ts` | **VERIFIED** |

---

## V8: Data Protection & DPDP Act 2023
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **8.1.1** | Explicit versioned consent tracking. | `user_consent` records consent version `2026.1`, timestamp, and user IP hash prior to app usage. | `apps/web/src/components/PrivacyConsentModal.tsx`, `privacy.service.ts` | **VERIFIED** |
| **8.2.1** | Right to data portability ("Download My Data"). | Resident can export full account profile, flat history, grievances, visitor records, and bookings in structured JSON. | `apps/api/src/modules/privacy/privacy.service.ts`, `api-client.ts` | **VERIFIED** |
| **8.3.1** | Right to erasure / Anonymisation without ledger breakage. | Account anonymisation cryptographically pseudonymises PII while preserving audit trail hashes and ledger integrity. | `privacy.service.ts`, `test/unit/phase8-vendors-cms-privacy.spec.ts` | **VERIFIED** |
| **8.4.1** | In-person identity verification for statutory deletion requests. | Public deletion requests (`/data-deletion`) create verified queue requiring committee step-up authorization. | `apps/web/src/app/data-deletion/page.tsx`, `privacy.controller.ts` | **VERIFIED** |

---

## V9: Communications Security
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **9.1.1** | TLS 1.3 / 1.2 enforced on all external endpoints. | Reverse proxy terminates TLS with modern cipher suites and HSTS (`max-age=31536000; includeSubDomains; preload`). | `deploy/nginx.conf`, `next.config.ts` | **VERIFIED** |
| **9.2.1** | Internal service-to-service authentication. | NestJS <-> Redis uses password authentication; MinIO uses S3 access key and secret key over isolated Docker bridge network. | `docker-compose.yml`, `apps/api/src/database/redis.provider.ts` | **VERIFIED** |

---

## V10: Malicious Code & Supply Chain
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **10.1.1** | Software Bill of Materials (SBOM) and vulnerability scanning. | pnpm lockfile frozen (`pnpm-lock.yaml`); `pnpm audit` in CI; zero runtime external CDN scripts or fonts. | `pnpm-lock.yaml`, `package.json` | **VERIFIED** |
| **10.2.1** | Strict Subresource Integrity and Content Security Policy. | CSP blocks `unsafe-eval` and `unsafe-inline` where possible; zero third-party font/script sources allowed. | `apps/web/next.config.ts` | **VERIFIED** |

---

## V11: Business Logic Requirements
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **11.1.1** | Race conditions prevented on shared limited resources. | Amenities exclusive booking uses PostgreSQL GiST exclusion; capacity amenities use `SELECT ... FOR UPDATE` row locks. | `apps/api/src/modules/amenities/amenities.service.ts` | **VERIFIED** |
| **11.1.2** | Financial rounding consistency and precision. | Money represented strictly as integer paise (`BIGINT`); banker's rounding (round-half-up) implemented in Money utility. | `apps/api/src/common/utils/money.ts`, `test/unit/phase7-amenities-billing.spec.ts` | **VERIFIED** |
| **11.1.3** | Immutability of financial transactions. | Ledger entries (`society_ledger`) are append-only. Corrections require explicit contra/reversing entries. No in-place edits. | `apps/api/src/modules/billing/billing.service.ts` | **VERIFIED** |

---

## V12: Files and Uploaded Resources
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **12.1.1** | Image upload validation, EXIF stripping, and quarantine. | Uploaded images re-encoded (Sharp), EXIF metadata stripped, checked against magic bytes and size limits. | `apps/api/src/common/utils/image-processor.ts` | **VERIFIED** |
| **12.2.1** | Object storage isolation and pre-signed URLs. | MinIO storage keys are non-enumerable UUIDs; downloads require signed authorization or proxy streaming. | `apps/api/src/modules/storage/storage.service.ts` | **VERIFIED** |

---

## V13: API and Web Services
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **13.1.1** | Strict content-type enforcement. | API rejects non-JSON content types for mutated requests; responds with `application/json; charset=utf-8`. | NestJS middleware & controllers | **VERIFIED** |
| **13.2.1** | Anti-CSRF token verification for browser state-changing requests. | Double-submit CSRF cookie token validated against `X-CSRF-Token` header. | `apps/api/src/common/guards/csrf.guard.ts` | **VERIFIED** |

---

## V14: Configuration and Deployment Hardening
| ID | Requirement | Verification in GrievEase | Code & Test Reference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **14.1.1** | Debug and development features disabled in production. | `NODE_ENV=production` disables debug banners, swagger endpoints, and detailed stack traces. | `apps/api/src/main.ts` | **VERIFIED** |
| **14.2.1** | Secure headers configured across all web responses. | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. | `apps/web/next.config.ts`, `nginx.conf` | **VERIFIED** |

