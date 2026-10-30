# GrievEase Cryptographic Key Custody & Secrets Management Policy

## 1. Scope & Objective

GrievEase operates under a strict **Zero-Third-Party Runtime** constraint. Without reliance on commercial cloud key management services (e.g. AWS KMS, HashiCorp Vault cloud), all cryptographic secrets, master keys, and salts are managed via self-hosted, air-gapped ready protocols.

This policy mandates the classification, custody, lifecycle, and emergency rotation procedures for all secrets in the ecosystem.

---

## 2. Secrets Inventory & Classification

| Secret Name | Purpose & Algorithm | Storage Location | Sensitivity | Rotation Cadence | Custodian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `JWT_SECRET` | Access token HMAC-SHA256 signing | Environment (`/etc/grievease/.env.secrets`) | **HIGH** | 90 Days (or on compromise) | Lead System Administrator |
| `JWT_SECRET_PREV` | Grace-period token verification for zero-downtime rotation | Environment | **HIGH** | Overwritten upon next rotation | Lead System Administrator |
| `REFRESH_SECRET` | Refresh token hashing pepper | Environment | **CRITICAL** | 180 Days | Lead System Administrator |
| `ANONYMITY_SECRET_SALT` | Resident ID masking for anonymous grievances | Environment + DB Society Salt | **CRITICAL** | Society Lifetime (Rotating breaks anonymous lookup) | Super Admin + Chairman |
| `BACKUP_ENCRYPTION_KEY` | AES-256-GCM payload encryption for `pg_dump` backups | Encrypted off-site storage / Environment | **CRITICAL** | 180 Days | Dual Custody: Secretary & Chairman |
| `DB_PASSWORD` | PostgreSQL superuser & application connection | Docker secrets / isolated environment | **CRITICAL** | 180 Days | Database Administrator |
| `REDIS_PASSWORD` | Redis cluster / cache authentication | Docker secrets / isolated environment | **HIGH** | 180 Days | System Administrator |
| `MINIO_ROOT_PASSWORD` | Object storage administrative credentials | Docker secrets / isolated environment | **CRITICAL** | 180 Days | Storage Administrator |
| `CSRF_SECRET` | Double-submit cookie anti-CSRF token signing | Environment | **MEDIUM** | On restart / 90 Days | Application Process |

---

## 3. Custody & Multi-Party Governance

### 3.1 Dual-Control (Maker-Checker) Custody
1. **Critical Secrets (`BACKUP_ENCRYPTION_KEY`, Master Database Encryption)**:
   - Must never reside solely with one individual.
   - Generated via Shamir's Secret Sharing (2-of-3 threshold):
     - **Share 1**: Super Admin / System Engineer
     - **Share 2**: Society Secretary
     - **Share 3**: Society Chairman (stored in physical sealed envelope inside society vault)
2. **Reconstitution**:
   - Any disaster recovery decryption requires physical or authenticated presence of at least 2 keyholders.

### 3.2 Offline Vault Storage
- A physical, water-resistant, fireproof tamper-evident envelope containing:
  1. The base `BACKUP_ENCRYPTION_KEY` passphrase
  2. The Emergency Break-Glass Super Admin recovery credential
  3. The genesis block hash of the society `audit_log`
- Deposited in the Society Bank Locker / Secure Physical Safe. Inspected annually during the Annual General Meeting (AGM).

---

## 4. Key Lifecycle & Rotation Procedures

### 4.1 Zero-Downtime JWT Secret Rotation
To rotate `JWT_SECRET` without forcibly disconnecting thousands of active residents:
1. Generate new 64-byte high-entropy hex secret:
   ```bash
   node -e "console.log(crypto.randomBytes(32).toString('hex'))"
   ```
2. Update the environment:
   ```env
   JWT_SECRET_PREV="<current_JWT_SECRET>"
   JWT_SECRET="<newly_generated_secret>"
   ```
3. Restart the API cluster with zero-downtime rolling restart (`pnpm pm2 reload` or Docker rolling update).
4. The API signs all new tokens with `JWT_SECRET` but accepts incoming tokens signed by either `JWT_SECRET` or `JWT_SECRET_PREV`.
5. After 15 minutes (max access token TTL), remove `JWT_SECRET_PREV`.

### 4.2 Backup Encryption Key Rotation
When rotating `BACKUP_ENCRYPTION_KEY`:
1. Generate `BACKUP_ENCRYPTION_KEY_NEW`.
2. Existing backups are NOT rewritten retroactively; their manifest stores `key_id: "2026-Q1"`.
3. The key archive maintains historical decryption keys in the Society Vault.
4. Future nightly backups run with `BACKUP_ENCRYPTION_KEY_NEW`.

### 4.3 Emergency Key Revocation (Compromise Protocol)
If a server breach, unauthorized dump, or administrator departure occurs:
1. **Immediate Execution**:
   - Invalidate all active Redis refresh token families:
     ```redis
     EVAL "return redis.call('del', unpack(redis.call('keys', 'refresh:*')))" 0
     ```
   - Rotate `JWT_SECRET` immediately without `JWT_SECRET_PREV` (forces re-login across all clients).
   - Rotate database credentials and restart application containers.
2. **Post-Mortem**:
   - Execute `pnpm audit:verify` to confirm audit hash chain continuity.
   - Inspect `sensitive_access_log` for unauthorized queries.
   - Publish incident report to the Governing Body within 24 hours under DPDP regulations.

