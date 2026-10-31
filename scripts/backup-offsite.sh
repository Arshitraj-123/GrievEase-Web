#!/bin/sh
set -e

# GrievEase Offsite Backup Synchronization Script
# Replicates encrypted backup files to secondary disaster recovery target
# Uses rsync over SSH or encrypted local mount with strict permissions (0600)

BACKUP_DIR="${BACKUP_DIR:-./backups}"
OFFSITE_TARGET="${OFFSITE_TARGET:-/mnt/grievease_offsite_vault}"

echo "🚀 Starting GrievEase offsite backup sync..."
if [ ! -d "$BACKUP_DIR" ]; then
  echo "❌ Error: Backup directory $BACKUP_DIR does not exist."
  exit 1
fi

mkdir -p "$OFFSITE_TARGET"

# Sync all .enc.sql and .sha256 files
rsync -avz --include='*.enc.sql' --include='*.sha256' --exclude='*' "$BACKUP_DIR/" "$OFFSITE_TARGET/"

# Enforce strict least-privilege permissions on offsite files
chmod 0600 "$OFFSITE_TARGET"/* 2>/dev/null || true

echo "✅ Offsite replication completed successfully to $OFFSITE_TARGET."
