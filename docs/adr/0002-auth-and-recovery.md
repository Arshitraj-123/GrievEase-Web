# ADR 0002: Offline-First Authentication & Account Recovery Architecture

## Context and Problem Statement
GrievEase is deployed in private residential infrastructure where external SaaS identity providers, SMS gateways, cloud OTP vendors, and third-party CAPTCHAs are strictly disallowed by client policy. Key operational realities:
- No public self-registration: Accounts represent vetted residential tenancies and staff.
- No third-party phone/SMS OTP: SMS is costly, vulnerable to SIM-swap attacks, and introduces third-party dependency.
- High security for administrative tiers: Resident grievance records, committee votes, and financial logs require strict non-repudiation.
- Resilient recovery for residents without administrative bottlenecks, yet protected against social engineering.

## Decision

### 1. Account Provisioning & Activation
- Users are created in bulk via spreadsheet import or individually by the Super Admin in `INVITED` status.
- A 10-character activation code drawn from a non-ambiguous alphabet (`[2-9A-HJ-NP-Z]`, eliminating `0`, `O`, `1`, `I`, `L`) is generated, printed onto a confidential physical credential slip (or PDF with QR), and stored hashed (Argon2id/SHA-256).
- Activation requires:
  1. Username / Member ID.
  2. Activation code.
  3. Verification detail present in the imported sheet (e.g. flat number or date of birth).
  4. Setting a new password meeting strict Argon2id complexity checks.
  5. Setting up account recovery (10 backup recovery codes + 3 custom security questions for residents; mandatory TOTP for admins).

### 2. Multi-Tier Authentication & Brute-Force Defense
- **Argon2id Hashing**: Time cost 3, memory cost 64MB, parallelism 2.
- **Constant-Time Verification**: Unknown usernames execute a dummy Argon2id hash check to prevent timing-based user enumeration.
- **Self-Hosted Proof-of-Work (PoW)**:
  - After 3 consecutive login failures, the API returns a challenge `{ nonce, difficulty }`.
  - The client must compute a counter such that `SHA-256(nonce + counter)` starts with `difficulty` zero characters.
  - Computed inside a client Web Worker to prevent UI freezing.
  - Rate-limiting enforces a 15-minute lockout with exponential backoff after 5 failures.

### 3. Role-Segregated Recovery Paths
- **Admin Roles (`SECRETARY`, `COMMITTEE`, `CHAIRMAN`, `GOVERNING_BODY`, `SUPER_ADMIN`)**:
  - Mandatory offline TOTP (RFC 6238 via `otplib`) + 10 hashed backup codes.
  - Admin accounts are strictly barred from using security questions or resident recovery codes.
  - Admin recovery requires face-to-face verification and Super Admin reset.
- **Resident Roles (`RESIDENT`, `GUARD`, `VENDOR`)**:
  - **Path A (Recovery Codes)**: 10 single-use codes provided once at activation. Immediate reset, code burned, remaining codes regenerated.
  - **Path B (Custom Security Questions)**:
    - User authors 3 custom questions and answers.
    - Answers are normalized (trimmed, lowercase, punctuation removed), minimum 6 chars, rejected if matching personal details.
    - Argon2id hashed with per-answer salt + server pepper.
    - Starting recovery returns deterministic fake questions for unknown users to eliminate enumeration.
    - Answering all 3 correctly generates a device-bound reset ticket and triggers a mandatory 24-hour cooling-off window (`RECOVERY_DELAY_HOURS`).
    - During cooling-off, in-app alerts are broadcast to all existing sessions, and the request appears on `/admin/recovery-requests` where an admin can cancel fraudulent requests or accelerate it after in-person verification.

### 4. Super Admin Handover and Break-Glass
- **Planned Handover**: Super Admin nominates an active member -> Nominee accepts and enrols TOTP -> Super Admin confirms with step-up -> Role swapped atomically, previous sessions invalidated.
- **Break-Glass (CLI)**: `pnpm admin:emergency-transfer` executed on server shell with two recorded Governing Body witnesses, ensuring operational continuity if an admin is incapacitated.
