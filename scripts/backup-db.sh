#!/usr/bin/env bash
set -euo pipefail

# Nightly Encrypted PostgreSQL Backup Script
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/grievease_backup_${TIMESTAMP}.sql.enc"
PASSPHRASE="${BACKUP_PASSPHRASE:-${DB_PASSWORD:-local_dev_secret_replace_in_prod}}"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup at ${TIMESTAMP}..."

# Export and encrypt using OpenSSL AES-256-CBC with salt
PGPASSWORD="${DB_PASSWORD:-local_dev_secret_replace_in_prod}" pg_dump \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-grievease_user}" \
  -d "${DB_NAME:-grievease_db}" \
  --clean --if-exists --no-owner | \
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -pass "pass:${PASSPHRASE}" -out "${BACKUP_FILE}"

echo "[INFO] Encrypted backup completed: ${BACKUP_FILE}"
