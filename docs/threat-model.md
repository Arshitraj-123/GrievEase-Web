# GrievEase Threat Model (STRIDE Methodology)

## 1. System Overview & Scope

GrievEase is a multi-tenant, air-gapped ready web platform for residential cooperative housing societies in India. The application operates under a strict **Zero-Third-Party Runtime** constraint with cash-recorded accounting, Row-Level Security (RLS), and hash-chained append-only ledgers.

### 1.1 Trust Boundaries
- **TB-1: Public Untrusted Internet / LAN <-> Reverse Proxy (Edge/Nginx)**
  - Unauthenticated endpoints: `/activate`, `/login`, `/contact`, `/faqs`, `/testimonials`, `/data-deletion`.
- **TB-2: Browser / Client App <-> Web Server (Next.js SSR/BFF)**
  - Cookie lifecycle (`__Host-` cookies, anti-CSRF double-submit tokens).
- **TB-3: Web BFF <-> NestJS REST API / WebSocket Server**
  - Authenticated JSON RPC/REST with short-lived JWTs (15 min) and role-based access control.
- **TB-4: Application Server <-> PostgreSQL & Redis**
  - Connection pooling with session variable injection (`app.current_society`, `app.current_user`) enforcing RLS.
- **TB-5: Application Server <-> Self-Hosted MinIO Object Storage**
  - Pre-signed PUT/GET URLs with SHA-256 integrity verification, EXIF stripping, and quarantine scanning.

---

## 2. STRIDE Threat Analysis by Module

### 2.1 Module 1: Authentication, Authorization & Identity Management
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attendant or resident impersonation via credential guessing | Online brute force or password spraying against `/auth/login` | Argon2id (`m=64MB, t=3, p=2`), dummy hash timing equalisation for invalid users, proof-of-work (PoW) challenge after 3 failures, account lockout after 5 failures | High compute cost for attacker; physical security of resident devices |
| **Tampering** | Session hijacking via stolen refresh tokens | Cross-Site Scripting (XSS) or network interception | `httpOnly`, `Secure`, `SameSite=Lax`, `__Host-` prefixed cookies; cryptographic token rotation on every refresh; family ID reuse detection revokes entire lineage | Browser compromise on shared cyber-cafe terminal (addressed via 15-min inactivity timeout) |
| **Repudiation** | Administrator denies executing destructive user deletion or role promotion | Admin performs step-up action and claims it was another user | Step-up authentication required (valid 5 min); SHA-256 hash-chained `audit_log` captures actor, role, IP, user-agent, before/after diff; DB trigger prohibits log mutation | Requires safeguarding root database credentials from rogue DBA |
| **Information Disclosure** | Credential slip exposure during resident onboarding | Unauthorized staff member reads plain-text activation code printed on slip | One-time slip generation; code stored as salted Argon2id hash; activation slips automatically expire in 7 days; 5 invalid attempts locks token | Physical theft of paper slip prior to resident handover (mitigated by requiring flat verification on `/activate`) |
| **Denial of Service** | Resource exhaustion via distributed login flood | Botnet flooding Argon2id hash endpoints | IP-based rate limiting (10 req/min per IP); PoW puzzle required before hash execution once threshold is crossed | Edge rate limiting at reverse proxy layer required for massive DDoS |
| **Elevation of Privilege** | Resident manipulates role claim to access committee features | Tampering with JWT payload or parameters in REST requests | JWT signed with HMAC-SHA256 using rotating secret; NestJS `JwtGuard` and `RolesGuard` validate permissions against DB session context on every request | Key secrecy maintained in isolated environment files |

---

### 2.2 Module 2: Grievances, Escalation & Anonymity Engine
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Committee member fakes grievance resolution without performing work | Malicious resolver marks ticket RESOLVED | Append-only `grievance_event` table; resolution mandates resolution notes; resident must confirm or reject resolution | Resolver collusion with committee (audited via performance metrics) |
| **Tampering** | Resolver modifies complainant's grievance description or evidence | Direct parameter update in database or API call | Grievance table restricts UPDATE on description after submission; attachments stored in MinIO with cryptographic SHA-256 verification | None; RLS and strict service methods prevent updates |
| **Repudiation** | Escalation manager ignores SLA timeout and denies receiving notice | SLA expires without action | Automated Redis BullMQ cron job computes SLAs using working-hours calendar, auto-escalating to Chairman; emits persistent in-app notifications | Server clock skew (NTP synchronization required) |
| **Information Disclosure** | Anonymity de-anonymization of whistle-blower resident | Committee identifies resident from flat ID, user ID, or network metadata | Anonymous grievances store `anonymous_hash = HMAC(resident_id + society_salt)`; flat_id is nullified; resolver views show no profile, phone, or name; canary tests verify zero leak | De-anonymization via writing style / content clues (user warned at submission time) |
| **Denial of Service** | Grievance queue flooding | Rogue resident creates 500 frivolous grievances | Maximum 5 active open grievances per flat; resident rate limiting; auto-deduplication detection | None |
| **Elevation of Privilege** | Resident views confidential complaints submitted by other flats | IDOR attack accessing `/api/v1/grievances/:id` | RLS policy checks `flat_id = current_user.flat_id` OR `current_user.role IN ('SECRETARY','COMMITTEE','CHAIRMAN')` | Strict integration tests verify cross-flat access rejection |

---

### 2.3 Module 3: Visitors, Guard Console & SOS
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Unauthorized visitor presents forged visitor pass | Visual spoofing or QR code recreation | Passes use 12-char cryptographically random tokens; Guard Console scans and verifies token against database with real-time WebSocket confirmation | Visual glance bypass by distracted guard (Guard training required) |
| **Tampering** | Attacker alters visitor check-in timestamps | Guard attempts to cover up late entry | Check-in timestamp generated server-side `NOW()` inside transaction; `visitor_log` is append-only | Hardware time synchronization |
| **Repudiation** | Guard checks in visitor without resident pre-approval | Guard admits uninvited individual | System records `created_by` (Resident vs Guard); unannounced visitors trigger real-time resident approval prompt via WebSocket | Network offline mode at gate (Guard required to capture phone and photo) |
| **Information Disclosure** | Guard harvests resident phone numbers and visitor phone books | Guard console scraping resident data | Guard console displays only flat number and primary resident first name; resident phone numbers are strictly masked (`+91 98*** **321`) | Physical viewing of screen (anti-shoulder surfing UI) |
| **Denial of Service** | False SOS alarm flood blinding guard desk | Malicious script triggers SOS repeatedly | SOS triggers require 2-step confirm or 3-second hold; triggers audit event; maximum 1 active SOS alert per flat | Malicious child pressing button (resolved via guard inter-com verification) |
| **Elevation of Privilege** | Guard attempts to access billing or administrative modules | Guard session navigating to `/admin/*` | Role guard strictly blocks `GUARD` role from non-guard endpoints; UI shell hides all admin navigation | None |

---

### 2.4 Module 4: Amenities Booking
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Impersonating another flat to monopolize clubhouse slots | Resident books under neighbor's flat | Session resolves flat ID strictly from authenticated token; booking requires active resident tenancy | Account sharing within household |
| **Tampering** | Double booking race condition on exclusive amenities | Two residents click Book at the exact same millisecond | PostgreSQL GiST exclusion constraint (`EXCLUDE USING gist (amenity_id WITH =, during WITH &&)`) guarantees zero overlap at the DB engine level | None (100% DB enforced) |
| **Repudiation** | Resident claims they cancelled booking before cancellation deadline | Resident demands refund of deposit | `booking_event` logs exact ISO cancellation timestamp; cancellation policy window validated server-side | None |
| **Information Disclosure** | Resident snoops on neighbor's event attendee lists | Querying booking details of another flat | Non-admin users can only view occupied slot status (`OCCUPIED`), never guest names, event purpose, or attendee counts | None |
| **Denial of Service** | Bulk booking slot hoarding | Script attempts to reserve all weekend slots | Max slots per booking; max 2 active bookings per flat per week; advance booking window capped (e.g. 14 days) | None |
| **Elevation of Privilege** | Resident confirms unpaid booking without cash payment | Bypassing payment state | Cash bookings enter `AWAITING_PAYMENT` state with 24h hold timer; only `billing.collect` permission can record cash and confirm | Collusion with collector (audited via maker-checker) |

---

### 2.5 Module 5: Maintenance Billing & Cash Collection
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Unauthorized user records fictitious cash receipt | Staff member claims cash was collected | Only users with `billing.collect` role can issue receipts; printed receipt contains unique reference number, cashier user ID, and timestamp | Cash pocketing by cashier (mitigated by paper receipt requirement to resident) |
| **Tampering** | Cashier modifies past bill or receipt amount | Modifying database ledger records | Append-only double-entry ledger (`society_ledger`); DB triggers forbid UPDATE/DELETE on financial records; corrections only via reversing entries | Rogue DBA modifying raw storage files |
| **Repudiation** | Collector denies receiving cash recorded in receipt | Cash discrepancy during bank deposit | Receipt emits cryptographically verifiable receipt number; recorded cashier ID is immutable; resident possesses receipt copy | Discrepancy between drawer cash and ledger (daily cash-up reconciliation required) |
| **Information Disclosure** | Residents viewing billing status of entire building | Snooping on neighbor dues | Residents can only query their own flat ledger and bills; committee roles view aggregated or debtor lists | Notice board publication rules configured per society bylaws |
| **Denial of Service** | Bill generation lockup on 10,000 flats | Resource exhaustion during monthly bill run | Bill generation executes in batched background worker jobs with idempotency keys; transactions commit per wing | Server memory sizing |
| **Elevation of Privilege** | Maker approves their own waiver or credit note | Cashier writes off their own maintenance bill | **Maker-Checker separation**: Creator (`created_by`) can NEVER approve (`approved_by`); enforced at service and DB trigger layer; Super Admin sole approver requires `SOLE_APPROVER` audit flag and committee broadcast | Low-member societies with only one admin (governed by mandatory warning banner) |

---

### 2.6 Module 6: Vendor Portal
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Impersonation of external contractor | Rogue technician claims vendor identity | Vendors authenticate with dedicated credentials; visitor pass linked to task ID verified at gate console with QR/token | Rogue technician borrowing vendor credentials |
| **Tampering** | Contractor marks task completed without visiting or doing work | False job completion | System mandates AFTER photo upload; vendor cannot complete without after photo when `require_after_photo` is ON; resident must confirm "Fixed" | Quality of repair disputed (handled via resident "Not fixed" reopen workflow) |
| **Repudiation** | Resident denies contractor completed work | Resident disputes invoice | Task requires timestamped BEFORE and AFTER photos; task events track scheduling, arrival, start, and finish | Subjective satisfaction disputes (committee mediation) |
| **Information Disclosure** | Contractor harvests resident identity, mobile number, or complaint history | Data harvesting by third-party worker | **Strict privacy allow-list**: Vendor view exposes ONLY task title, description, flat number, wing, and photos; resident name, phone, and anonymous status NEVER exposed; phone only visible if resident explicitly enables per-task toggle | Contractor learning resident name in person during physical flat visit |
| **Denial of Service** | Vendor declines all assigned jobs disrupting maintenance | Vendor inaction | Auto-notification if vendor fails to accept/decline within `vendor_accept_hours`; SLA clock on grievance continues running | None |
| **Elevation of Privilege** | Vendor attempts to access resident grievances or directory | Vendor navigating to `/app/*` or `/admin/*` | Role guard restricts `VENDOR` role strictly to `/vendor/*` routes; API endpoints enforce vendor ID match | None |

---

### 2.7 Module 7: Content, Support & Resident Messaging
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Spammer submits automated inquiries to office | Automated bot submissions to `/contact` | Honeypot trap field (`website_url`) + client-side Proof-of-Work puzzle (SHA-256) + client IP hashing; no email dispatch (local queue only) | Distributed human captcha solvers (in-app rate limiting 5/hour) |
| **Tampering** | Public FAQ or testimonial defacement | Injecting malicious HTML/XSS into CMS | Strict Zod schema validation; HTML sanitization on all translated fields; testimonials require Committee approval before public display | Compromised admin account |
| **Repudiation** | Office manager ignores resident message and denies receipt | Resident message lost | Messages stored in persistent `conversation_message` table; delivery receipts and unread badges tracked | None |
| **Information Disclosure** | Leaking resident contact information on public testimonials | Review reel reveals resident identity | Testimonials explicitly mask flat details unless resident checked opt-in consent; minimum threshold of 3 approved testimonials required before public display | Resident regretting consent (can revoke via DPDP privacy request) |
| **Denial of Service** | Socket.io message flooding | Resident spams office chat channel | Per-socket rate limiter (max 20 messages/minute); socket disconnected on abuse | None |
| **Elevation of Privilege** | Resident reads confidential tickets of other residents | Querying `/api/v1/support/tickets/:id` | Support ticket endpoints verify `created_by = current_user.id` or user is committee member | Validated via IDOR test suite |

---

### 2.8 Module 8: DPDP Act 2023 Compliance & Data Protection
| STRIDE Category | Threat Description | Attack Vector / Scenario | System Mitigations & Controls | Residual Risk & Compensating Controls |
| :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Attacker requests data deletion of victim resident | Malicious deletion request via `/data-deletion` | Public deletion requests require in-person committee identity verification; authenticated requests require password confirmation | Physical social engineering at society office |
| **Tampering** | Data erasure breaks cryptographic audit trail or financial ledger | Anonymisation script deletes rows with foreign keys | **Pseudonymisation without row deletion**: PII fields (name, email, phone) replaced with cryptographically pseudonymous strings; audit log hashes and financial ledger remain mathematically intact | Irreversible once executed (mitigated by 30-day grace period) |
| **Repudiation** | Resident claims society processed data without consent | Legal complaint to Data Protection Board | Versioned consent tracking (`user_consent` table with version `2026.1`, timestamp, IP hash); consent cannot be updated, only re-granted with new version | None |
| **Information Disclosure** | Unauthorized staff member snoops on resident personal files | Excessive internal data access | All accesses to sensitive screens (audit logs, data exports, member rosters) recorded in `sensitive_access_log` with reason | Committee collusion (governed by Governing Body oversight) |
| **Denial of Service** | Repeated data export requests causing server CPU spike | Resident requests 100 data export dumps | Max 1 export request per 24 hours per user; exports generated asynchronously | None |
| **Elevation of Privilege** | Non-privileged user approves privacy deletion request | Rogue committee member deletes records | Only `SECRETARY` or `SUPER_ADMIN` with step-up verification can approve and commit DPDP deletion requests | Maker-checker verification required |

---

## 3. Summary of Core Cryptographic Standards
- **Password & Code Hashing**: Argon2id (`v=19, m=65536, t=3, p=2`)
- **Audit Log Chain**: SHA-256 (`hash = SHA256(prev_hash + canonical_json)`)
- **Session Tokens**: JWT signed with HMAC-SHA256 (Secret rotation every 90 days)
- **Database Backup Encryption**: AES-256-GCM with PBKDF2 (100,000 iterations)
- **Proof-of-Work Challenge**: SHA-256 (`SHA256(nonce + solution)` starting with `0000`)
- **Anonymity Masking**: HMAC-SHA256 with society-specific secret key

