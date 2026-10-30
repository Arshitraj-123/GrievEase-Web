# Runbook: Disaster Recovery & Encrypted Backup Restoration

## 1. Overview & Objective

This runbook guides the operations team through recovering a damaged, corrupted, or completely lost GrievEase production environment using self-hosted, AES-256-GCM encrypted backup archives.

- **RTO (Recovery Time Objective)**: < 30 minutes
- **RPO (Recovery Point Objective)**: < 24 hours (nightly automated snapshots)

---

## 2. Prerequisites & Required Artifacts

1. **Latest Encrypted Backup Archive**:
   - Location: `/var/backups/grievease/db-backup-YYYY-MM-DD.enc` (or cold off-site storage)
   - Accompanying SHA-256 checksum file: `db-backup-YYYY-MM-DD.enc.sha256`
2. **Decryption Key Passphrase**:
   - Obtained via dual-custody authorization (`BACKUP_ENCRYPTION_KEY` from Society Safe / Keyholders).
3. **Target Server Environment**:
   - Docker & Docker Compose installed.
   - Clean PostgreSQL 16+ instance.

---

## 3. Step-by-Step Recovery Procedure

### Step 3.1: Verify Archive Cryptographic Integrity
Prior to decryption, verify that the encrypted file has not suffered bit-rot or tampering:
```bash
# Verify SHA-256 hash
sha256sum -c db-backup-2026-10-30.enc.sha256

# Or use the GrievEase backup verification tool
pnpm backup:verify --backup=/var/backups/grievease/db-backup-2026-10-30.enc
```
If checksum verification fails, DO NOT proceed. Locate the mirror copy on off-site media.

### Step 3.2: Decrypt the PostgreSQL Archive
Decrypt using the AES-256-GCM decryption script:
```bash
node scripts/backup-verify.js \
  --file=/var/backups/grievease/db-backup-2026-10-30.enc \
  --decrypt \
  --output=/tmp/restored-dump.sql
```
*Note: Ensure `/tmp` has permissions `0700` and sufficient disk space.*

### Step 3.3: Prepare Target Database
Stop all application ingress to prevent partial writes during restoration:
```bash
# Scale down API and web workers
docker compose stop api web workers

# Connect to PostgreSQL container
docker compose exec -T postgres psql -U postgres -c "DROP DATABASE IF EXISTS grievease_prod;"
docker compose exec -T postgres psql -U postgres -c "CREATE DATABASE grievease_prod WITH OWNER grievease_app;"
```

### Step 3.4: Restore Schema and Data
Pipe the decrypted SQL dump into the fresh database:
```bash
cat /tmp/restored-dump.sql | docker compose exec -T postgres psql -U grievease_app -d grievease_prod

# Securely shred decrypted plaintext dump
shred -u /tmp/restored-dump.sql
```

### Step 3.5: Run Post-Restore Verification
Execute the cryptographic audit verification to confirm that the SHA-256 hash chain is unbroken:
```bash
docker compose run --rm api pnpm audit:verify
```
Verify that the output confirms:
```text
[OK] Society 00000000-0000-0000-0000-000000000001: 4,821 blocks verified. Chain intact.
```

### Step 3.6: Restart Application Services & Smoke Test
```bash
docker compose up -d
pnpm smoke
```
Confirm all health endpoints respond with HTTP 200 OK.

