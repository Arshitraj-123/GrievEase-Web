# GrievEase Security Architecture & Model

## 1. Security Principles & Threat Posture

GrievEase operates under a strict **Zero-Trust, Zero-Third-Party** architecture:
- **No Third-Party Dependencies**: No SMS providers, external email gateways, SaaS identity vendors, cloud CAPTCHAs, or external CDNs.
- **Air-Gapped / Self-Hosted Readiness**: All cryptographic operations, challenges, and notifications operate strictly on the client-owned infrastructure.
- **Defence-in-Depth**: Security is enforced at the network, HTTP, application module, and database engine layers.

---

## 2. Authentication & Identity Architecture

### 2.1 Password Security
- **Hashing Algorithm**: Argon2id (`memoryCost: 65536` [64 MB], `timeCost: 3`, `parallelism: 2`).
- **Complexity Requirements**:
  - Minimum 10 characters for Residents, Guards, and Vendors.
  - Minimum 12 characters for Admin roles (`SECRETARY`, `COMMITTEE`, `CHAIRMAN`, `GOVERNING_BODY`, `SUPER_ADMIN`).
  - Evaluated against a local offline blacklist of top 100,000 common passwords.
  - Reject passwords containing username, mobile number, flat number, or dictionary words.
- **Timing Attack Mitigation**:
  - `POST /api/v1/auth/login` executes a dummy Argon2id hash computation when a username is not found, guaranteeing identical execution times for valid vs. invalid usernames.
  - Uniform generic error: `Invalid credentials`.

### 2.2 Proof-of-Work (PoW) Rate Defense
- After 3 consecutive login failures for an IP or account, the API mandates a PoW challenge (`GET /api/v1/auth/challenge`).
- The server generates a random 32-byte hexadecimal nonce and assigns a difficulty parameter (e.g. 4 leading zeros).
- The client solves `SHA-256(nonce + solution)` in a dedicated Web Worker and submits `challengeSolution`.
- Nonces expire in 2 minutes and can only be consumed once.
- 5 consecutive failures triggers an exponential 15-minute account lockout and emits an admin alert.

### 2.3 Session Lifecycle & Token Management
- **Access Token**: Short-lived (15 minutes) signed JSON Web Token (JWT).
- **Refresh Token**: Stored as a cryptographically secure random token in an `httpOnly`, `Secure`, `SameSite=Lax` cookie. Prefixed with `__Host-` when running over HTTPS.
- **Automatic Token Rotation**: Every refresh generates a new refresh token and invalidates the previous one.
- **Token Reuse Detection**: If a revoked or already-used refresh token is presented, the entire session family (`family_id`) is immediately terminated.
- **Inactivity Timeout**: Sessions inactive for >15 minutes are invalidated server-side.
- **Concurrency Cap**: Maximum 5 concurrent sessions per user account.
- **CSRF Defense**: Double-submit cookie token paired with `X-CSRF-Token` header.

### 2.4 Multi-Factor Authentication (Admin Roles)
- Admins MUST enrol in Time-Based One-Time Password (TOTP) based on RFC 6238 via offline QR/secret generation (`otplib`).
- 10 emergency TOTP backup codes are generated and stored Argon2id-hashed.
- No session is issued to an administrative user without successful TOTP validation.
- Admin accounts are strictly disallowed from using security questions or resident recovery codes.

### 2.5 Step-Up Authentication
- Operations carrying elevated risk require an active 5-minute step-up claim (`POST /api/v1/auth/step-up`):
  - Committing bulk spreadsheet imports
  - Role modifications and Super Admin transfer
  - Reissuing activation codes or resetting credentials
  - Generating and downloading credential slips

---

## 3. Account Provisioning & Activation

1. Accounts are created in `INVITED` state solely by the Super Admin.
2. A 10-character code is selected from unambiguous characters: `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (avoiding 0, O, 1, I, L).
3. The plain-text code is printed once onto a confidential physical credential slip (or PDF with QR) and stored as a one-way hash with a 7-day expiration.
4. The user completes `/activate` by supplying `username`, `activationCode`, and `verifyDetail` (Flat Number or Date of Birth).
5. 5 incorrect activation attempts lock the activation token permanently.

---

## 4. Multi-Tenant Isolation & Row-Level Security (RLS)

- Every business entity stores `society_id`.
- PostgreSQL Row-Level Security (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`) enforces isolation at the database engine level.
- Database connections run within a transaction where session parameters are set:
  ```sql
  SET LOCAL app.current_society = '00000000-0000-0000-0000-000000000000';
  SET LOCAL app.current_user = '00000000-0000-0000-0000-000000000000';
  ```
- Any query attempting to read or modify data belonging to another society is rejected by PostgreSQL, preventing Insecure Direct Object References (IDOR).

---

## 5. Tamper-Proof Cryptographic Audit Trail

- The `audit_log` table stores:
  - Sequence number (`seq`) per society
  - Actor ID, Actor Role, Timestamp, Action, Entity Type, Entity ID
  - Before/After state snapshots
  - IP Address and Device fingerprint
  - `prev_hash` and `hash = SHA-256(prev_hash + canonical_json_of_entry)`
- **Database-Level Immutability**:
  - PostgreSQL trigger `audit_log_immutable_trigger` intercepts `UPDATE`, `DELETE`, and `TRUNCATE` operations, throwing an immediate exception.
- **Verification**:
  - `pnpm audit:verify --society=<id>` traverses the entire chain from genesis (`prev_hash = '0'.repeat(64)`) to verify mathematical integrity.
  - A scheduled task or CLI exports the latest hash daily for offline custody (e.g., recorded in committee meeting minutes).

---

## 6. Super Admin Governance & Break-Glass Protocol

### 6.1 Constraint
- A PostgreSQL partial unique index enforces that at most ONE active `SUPER_ADMIN` can exist in the system:
  ```sql
  CREATE UNIQUE INDEX one_active_super_admin ON app_user (role)
  WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE';
  ```

### 6.2 Planned Resignation / Handover
1. Super Admin nominates an active member on `/admin/super-admin-transfer`.
2. Nominee accepts the nomination in their own authenticated session and configures TOTP.
3. Current Super Admin confirms with step-up credentials (password + TOTP).
4. An atomic database transaction swaps roles, terminates all existing sessions of the outgoing admin, and invalidates old backup codes.

### 6.3 Emergency Break-Glass (Server Shell)
In the event of sudden absence or complete lockout of the Super Admin:
- Execution requires direct server shell access:
  ```bash
  pnpm admin:emergency-transfer --new-admin-id=<member_id> --witness1="Secretary Name" --witness2="Chairman Name"
  ```
- The command verifies that the nominee is an active member, reassigns the `SUPER_ADMIN` role, terminates previous sessions, enforces TOTP re-enrolment, and appends a tamper-proof entry to the audit log recording the identity of both witnesses.
- A high-visibility banner is shown to all administrators at their next login.

---

## 7. Network and Deployment Hardening

- **Headers**: Helmet with strict Content Security Policy (`default-src 'self'`).
- **CORS**: Strict origin whitelist configured via `CORS_ORIGINS`.
- **Cookies**: `HttpOnly`, `SameSite=Lax`, `Secure`, and `__Host-` prefix on HTTPS.
- **PII Redaction**: Application logger redacts passwords, tokens, activation codes, security answers, and TOTP secrets from console and file logs.
