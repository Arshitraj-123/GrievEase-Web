#!/usr/bin/env bash
set -euo pipefail

# Encrypted PostgreSQL Backup Restore Script
if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_encrypted_backup_file>"
  exit 1
fi

BACKUP_FILE="$1"
PASSPHRASE="${BACKUP_PASSPHRASE:-${DB_PASSWORD:-local_dev_secret_replace_in_prod}}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[INFO] Decrypting and restoring backup from ${BACKUP_FILE}..."

openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -pass "pass:${PASSPHRASE}" -in "${BACKUP_FILE}" | \
  PGPASSWORD="${DB_PASSWORD:-local_dev_secret_replace_in_prod}" psql \
  -h "${DB_HOST:-localhost}" \
  -p "${DB_PORT:-5432}" \
  -U "${DB_USER:-grievease_user}" \
  -d "${DB_NAME:-grievease_db}"

echo "[INFO] Database restored successfully from ${BACKUP_FILE}"
