# Runbook: Secret Key Rotation Procedures

## 1. Overview & Cadence

This runbook outlines standard operating procedures for rotating cryptographic keys, peppers, and infrastructure passwords in GrievEase.

| Secret Target | Cadence | Procedure Type |
| :--- | :--- | :--- |
| `JWT_SECRET` | Every 90 Days | **Zero-Downtime Dual-Key Rotation** |
| `BACKUP_ENCRYPTION_KEY` | Every 180 Days | **Versioned Snapshot Transition** |
| `DB_PASSWORD` | Every 180 Days | **Brief Maintenance Window** |
| `REDIS_PASSWORD` | Every 180 Days | **Rolling Restart** |

---

## 2. Zero-Downtime JWT Secret Rotation

### Step 2.1: Generate New Cryptographic Secret
Generate a 256-bit hexadecimal key:
```bash
NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "Generated: ${NEW_JWT_SECRET}"
```

### Step 2.2: Update Production Environment with Dual-Keys
Edit `/etc/grievease/.env.secrets` (or Docker secrets):
```env
# Shift current active key to previous key
JWT_SECRET_PREV="<OLD_ACTIVE_KEY>"

# Set newly generated key as active
JWT_SECRET="<NEW_JWT_SECRET>"
```

### Step 2.3: Reload API Workers
Execute a rolling reload so existing in-flight requests are not interrupted:
```bash
docker compose exec api pm2 reload all
# Or if running multiple container replicas:
docker compose up -d --no-deps --scale api=2 --no-recreate api
```

### Step 2.4: Verification
1. Existing resident sessions continue functioning (verified via `JWT_SECRET_PREV`).
2. New logins receive tokens signed by `JWT_SECRET`.
3. Monitor logs for any unexpected 401 Unauthorized spikes:
   ```bash
   docker compose logs --tail=100 -f api | grep "Unauthorized"
   ```

### Step 2.5: Purge Legacy Key (After 15 Minutes)
Access tokens expire in 15 minutes. Once 15 minutes have elapsed:
1. Remove `JWT_SECRET_PREV` from `.env.secrets`.
2. Re-trigger zero-downtime worker reload.

---

## 3. Backup Encryption Key Rotation

1. Generate new 32-byte encryption passphrase.
2. Label key identifier: e.g. `KEY-2026-H2`.
3. Deposit one copy in the Society Physical Safe (dual custody).
4. Update `BACKUP_ENCRYPTION_KEY` in environment.
5. Trigger manual backup run to test new key:
   ```bash
   node scripts/backup-verify.js --generate --test
   ```
6. Retain previous key identifier in key inventory for reading historic archives.

---

## 4. Emergency Key Breach Protocol

If a server compromise or unauthorized dump is suspected:
1. **Immediate Revocation**:
   - Flush all Redis refresh tokens immediately:
     ```bash
     docker compose exec redis redis-cli -a "$REDIS_PASSWORD" FLUSHDB
     ```
   - Immediately replace `JWT_SECRET` (do not set `JWT_SECRET_PREV`). This immediately invalidates all active sessions across all devices.
2. **Database Credential Reset**:
   - Change PostgreSQL password and update application connection strings.
   - Restart the entire stack.
3. **Audit**:
   - Run `pnpm audit:verify` to check for tamper events.
   - Review `/admin/audit/sensitive-access` logs.

