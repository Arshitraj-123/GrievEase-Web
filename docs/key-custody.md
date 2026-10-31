# GrievEase Disaster Recovery & Key Custody Protocol

> **Classification**: Strictly Confidential (Society Secretary & Chairman Custody Only)  
> **Purpose**: Standalone disaster recovery procedure allowing complete database restoration using only offsite backup archives and this document, independent of any running application server.

---

## 1. Key Segregation Architecture
GrievEase maintains strict cryptographic isolation between application secrets and backup encryption keys:

| Secret Identifier | Environment Variable | Storage Location | Purpose |
|---|---|---|---|
| **App Master Key** | `ENCRYPTION_KEY` | Server environment (`.env`) | Field-level PII encryption (phone numbers, vendor contact details). |
| **Security Pepper** | `SECURITY_PEPPER` | Server environment (`.env`) | Argon2id password hash seasoning. |
| **Backup Encryption Key** | `BACKUP_ENCRYPTION_KEY` | Offline Key Custody Safe | AES-256-GCM encryption of PostgreSQL dumps and WAL segments. |

> **Critical Rule**: The `BACKUP_ENCRYPTION_KEY` must **NEVER** be stored in the database, nor in Git, and must be held offline by at least two designated trustees (Society Secretary and Chairman) in physical split envelopes or a secure password vault.

---

## 2. Emergency Standalone Decryption Procedure
In the event of total server loss, an engineer with access to the raw encrypted backup (`grievease_backup_*.enc.sql`) and the `BACKUP_ENCRYPTION_KEY` can restore the entire database on a fresh Linux/PostgreSQL machine using standard Node.js or OpenSSL:

```bash
# Decryption using GrievEase Standalone CLI
BACKUP_ENCRYPTION_KEY="<KEY_FROM_CUSTODY_SAFE>" node scripts/restore-db.js /path/to/backup.enc.sql
```

### Manual Decryption via OpenSSL (AES-256-GCM)
The archive package layout is:
- Bytes 0-12: 12-byte initialization vector (IV)
- Bytes 12-28: 16-byte GCM authentication tag
- Bytes 28+: AES-256-GCM ciphertext

```bash
# Extract IV, Tag, and Ciphertext
dd if=backup.enc.sql of=iv.bin bs=1 count=12
dd if=backup.enc.sql of=tag.bin bs=1 skip=12 count=16
dd if=backup.enc.sql of=cipher.bin bs=1 skip=28

# Decrypt using standard OpenSSL 3.0+
openssl enc -d -aes-256-gcm \
  -in cipher.bin -out restored_db.sql \
  -K $(echo -n "$BACKUP_ENCRYPTION_KEY" | sha256sum | awk '{print $1}') \
  -iv $(xxd -p -c 12 iv.bin) \
  -tag $(xxd -p -c 16 tag.bin)

# Stream into fresh PostgreSQL database
psql -U postgres -d grievease_prod -f restored_db.sql
```

---

## 3. Recovery Time & Point Objectives (RTO / RPO)
- **Recovery Point Objective (RPO)**: **< 24 Hours** (via daily automated full encrypted backup) and **< 15 Minutes** (with WAL archiving enabled).
- **Recovery Time Objective (RTO)**: **< 15 Minutes** for full 100k-record database reconstitution.

---

## 4. Offsite Replication Schedule
- Primary backup is taken daily at **02:00 IST** via local cron (`scripts/backup-db.sh`).
- Secondary offsite replica is pushed at **02:30 IST** to an isolated offsite target via `scripts/backup-offsite.sh`.
- Retention: 30 daily backups, 12 monthly archives, permanently archived annual financial audits.
