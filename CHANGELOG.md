# GrievEase Changelog

All notable changes to the GrievEase platform are documented in this file.

The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0-phase8] - 2026-10-30 - Phase 8: Final Production Release

### Added
- **Vendor Portal**:
  - Service contractor dashboard (`/vendor`) with New, Active, and Completed job tabs.
  - Contractor task management (`/vendor/tasks/[id]`) with accept/decline workflows and visit scheduling.
  - Automatic visitor gate pass generation (`type: VENDOR`) linked to task visit windows.
  - Mandatory AFTER photo proof upload with EXIF metadata stripping and Sharp re-encoding.
  - Resident confirmation prompt ("Fixed" / "Not fixed" rating 1-5) on grievance timeline.
  - "Not fixed" reopening workflow alerting resolver and updating grievance status.
  - Strict privacy allow-list: resident name, phone, and anonymous status are never exposed to contractors.
  - Optional per-task resident contact number sharing toggle (`share my number for this task`).
  - Admin vendor directory (`/admin/vendors`) and standalone task creation (`/admin/vendor-tasks`).
  - Vendor Performance Scorecards with sample-size rule (<5 completed jobs displays "not enough data").
- **Content, Support and Messages**:
  - Self-hosted CMS for Multilingual FAQs (`/admin/cms`) with full EN, HI, MR parity.
  - Resident testimonials submission (`/testimonials`) with mandatory statutory consent.
  - Public testimonial reel unlocking only upon meeting the strict ≥3 approved review threshold.
  - Public contact inquiry form (`/contact`) with Proof-of-Work (PoW) SHA-256 challenge, honeypot spam traps, and IP hashing (zero email dispatch, local reference `CR-...`).
  - Admin contact request triage desk (`/admin/contact-requests`).
  - Resident-to-office chat messaging (`/app/messages`) with persistent red Emergency SOS banner.
  - Admin support desk (`/admin/support`).
  - Automated claims audit script (`scripts/claims-audit.js`) scanning copy for forbidden runtime promises.
  - Cookie consent banner (`CookieBanner.tsx`) strictly declaring essential session-only cookies.
- **Security Hardening**:
  - Comprehensive STRIDE threat model (`docs/threat-model.md`) covering all 8 functional modules.
  - OWASP ASVS v4.0 Level 2 verification checklist (`docs/asvs-l2-checklist.md`).
  - Granular Role-Based Access Control matrix (`docs/authz-matrix.md`) mapping all routes across 9 personas.
  - Key custody and secrets management policy (`docs/key-custody.md`).
  - Penetration testing pack (`docs/pentest-pack/`): scope, rules of engagement, test accounts, vulnerability reporting template, and exploit test vectors.
  - Least-privilege PostgreSQL roles configuration (`deploy/db-roles.sql`).
- **Backups, Monitoring & Operations**:
  - Self-hosted AES-256-GCM encrypted backup generation and verification tool (`scripts/backup-verify.js`, `pnpm backup:verify`).
  - Self-hosted Prometheus scraper config (`deploy/monitoring/prometheus.yml`).
  - Loki log aggregation & Promtail shipping configs (`deploy/monitoring/loki-config.yml`, `deploy/monitoring/promtail-config.yml`).
  - Pre-configured Grafana observability dashboard (`deploy/monitoring/grafana-dashboard.json`).
  - System operations and health monitoring dashboard (`/admin/system`).
  - Background jobs and BullMQ workers inventory (`docs/jobs.md`).
  - Disaster recovery and backup restoration runbook (`docs/runbooks/dr-recovery.md`).
  - Secret key rotation runbook (`docs/runbooks/key-rotation.md`).
  - Audit log hash chain break investigation runbook (`docs/runbooks/audit-investigation.md`).
  - Super Admin sole-approver governance review runbook (`docs/runbooks/sole-approver-audit.md`).
  - k6 load testing suite (`tests/load/k6-load-test.js`).
- **Privacy & Data Requests (DPDP Act 2023)**:
  - Versioned statutory consent modal (`PrivacyConsentModal.tsx`) enforcing version `2026.1`.
  - Self-service "Download My Data" export generating comprehensive structured JSON (`/app/settings/privacy`).
  - Public statutory deletion request workflow (`/data-deletion`) requiring in-person committee verification.
  - Admin privacy requests desk (`/admin/privacy-requests`).
  - Cryptographic account pseudonymisation without ledger row deletion, preserving mathematical audit log hash chains and double-entry ledger balance integrity.
  - DPDP statutory retention matrix (`docs/retention-matrix.md`).
  - Sensitive access audit logging (`/admin/audit/sensitive-access`).
- **Release Readiness & Multilingual Documentation**:
  - Comprehensive user manuals in English, Hindi, and Marathi in `docs/guides/`:
    - Super Admin Manual (`super-admin-guide.md`)
    - Secretary Operations Manual (`secretary-guide.md`)
    - Managing Committee Guide (`committee-guide.md`)
    - Resident User Guides (`resident-guide.en.md`, `resident-guide.hi.md`, `resident-guide.mr.md`)
    - Guard Console Manuals (`guard-guide.en.md`, `guard-guide.hi.md`, `guard-guide.mr.md`)
    - Vendor Partner Guides (`vendor-guide.en.md`, `vendor-guide.hi.md`, `vendor-guide.mr.md`)
  - End-to-end UAT test scenarios pack (`docs/uat/`) covering Phases 1 through 8.
  - Production Docker Compose deployment setup (`docker-compose.prod.yml`).
  - Next.js production build verified cleanly across all 152 routes (`pnpm --filter @grievease/web build`).
  - Automated preflight runner (`pnpm preflight`) verifying all 6 compliance checks.
  - 142 passing automated tests in Vitest across all unit and integration suites.

### Changed
- Feature flag `VENDORS` turned `ON` in `ShellLayout.tsx`.
- `visitor_pass.flat_id` made nullable in migration `0007` to support common-area vendor contractor passes.
- Expanded `VisitorPassType` contract schema to include `'VENDOR'`.
- Synchronized i18n dictionaries across English, Hindi, and Marathi (595 distinct keys, 100% parity).

---

## [0.7.0-phase7] - 2026-10-25 - Phase 7: Amenity Booking & Cash Maintenance Billing
- Amenity booking with PostgreSQL GiST exclusion lock (`mode: EXCLUSIVE`) and row lock (`mode: CAPACITY`).
- Cash maintenance billing with append-only double-entry ledger (`society_ledger`).
- Maker-checker separation of duties for debt waivers, bill voids, credit notes, and bill generation.
- Printed cash receipts with Indian digit grouping (`1,23,456.00`) and amount in words.

---

## [0.6.0-phase6] - 2026-10-18 - Phase 6: PWA, Real-Time Sockets & Multilingual Parity
- Progressive Web App (PWA) manifest and service worker.
- Mobile-first responsive layouts tested down to 360px viewport.
- Self-hosted Socket.io real-time event distribution.
- Full EN, HI, MR internationalization engine.

