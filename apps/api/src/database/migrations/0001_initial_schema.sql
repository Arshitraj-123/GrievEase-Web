-- ==============================================================================
-- GrievEase Phase 2 Initial Schema Migration
-- Includes:
-- 1. All entity tables with foreign keys and indexes
-- 2. Partial unique index for one active SUPER_ADMIN
-- 3. Row Level Security (RLS) policies for tenant isolation
-- 4. Immutable append-only triggers for audit_log rejecting UPDATE, DELETE, TRUNCATE
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Society
CREATE TABLE IF NOT EXISTS society (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Wing
CREATE TABLE IF NOT EXISTS wing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(20) NOT NULL,
  total_floors INTEGER NOT NULL DEFAULT 1,
  flats_per_floor INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Flat
CREATE TABLE IF NOT EXISTS flat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  wing_id UUID NOT NULL REFERENCES wing(id) ON DELETE CASCADE,
  flat_number VARCHAR(20) NOT NULL,
  floor INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. App User
CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID REFERENCES flat(id) ON DELETE SET NULL,
  member_id VARCHAR(50) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  role VARCHAR(50) NOT NULL DEFAULT 'RESIDENT',
  status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
  password_hash TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at TIMESTAMP,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  directory_visible BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_member_id_per_society ON app_user(society_id, member_id);

-- Enforce at most ONE active SUPER_ADMIN across the entire system
CREATE UNIQUE INDEX IF NOT EXISTS one_active_super_admin ON app_user (role)
WHERE role = 'SUPER_ADMIN' AND status = 'ACTIVE';

-- 5. Activation Code
CREATE TABLE IF NOT EXISTS activation_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  verify_detail_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed_at TIMESTAMP,
  issued_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Recovery Code (10 per user)
CREATE TABLE IF NOT EXISTS recovery_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. Security Question (3 per user)
CREATE TABLE IF NOT EXISTS security_question (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  ordinal INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Password Reset Ticket
CREATE TABLE IF NOT EXISTS password_reset_ticket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  ticket_hash TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  eligible_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  device_fingerprint TEXT,
  ip TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. TOTP Secret
CREATE TABLE IF NOT EXISTS totp_secret (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  enabled_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. TOTP Backup Code
CREATE TABLE IF NOT EXISTS totp_backup_code (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 11. Device Session
CREATE TABLE IF NOT EXISTS device_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  family_id UUID NOT NULL,
  device_label TEXT,
  ip TEXT,
  user_agent TEXT,
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Import Batch
CREATE TABLE IF NOT EXISTS import_batch (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  file_sha256 VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PREVIEW',
  counts JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Import Row
CREATE TABLE IF NOT EXISTS import_row (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES import_batch(id) ON DELETE CASCADE,
  row_no INTEGER NOT NULL,
  raw JSONB NOT NULL,
  errors JSONB,
  created_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL
);

-- 14. Super Admin Transfer
CREATE TABLE IF NOT EXISTS super_admin_transfer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 15. Bootstrap State
CREATE TABLE IF NOT EXISTS bootstrap_state (
  id INTEGER PRIMARY KEY DEFAULT 1,
  setup_token_hash TEXT,
  setup_token_expires_at TIMESTAMP,
  setup_completed_at TIMESTAMP
);

-- 16. Audit Log (Cryptographically hash chained)
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  seq BIGINT NOT NULL,
  actor_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  before JSONB,
  after JSONB,
  ip VARCHAR(50),
  device VARCHAR(255),
  prev_hash VARCHAR(64) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_society_seq ON audit_log(society_id, seq);

-- 17. In-App Notification
CREATE TABLE IF NOT EXISTS in_app_notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_user(id) ON DELETE CASCADE,
  target_role VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'INFO',
  link VARCHAR(255),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- IMMUTABLE AUDIT LOG DATABASE TRIGGERS
-- Rejects UPDATE, DELETE, and TRUNCATE at database level
-- ==============================================================================
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only: UPDATE, DELETE and TRUNCATE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON audit_log;
CREATE TRIGGER trg_prevent_audit_log_modification
BEFORE UPDATE OR DELETE ON audit_log
FOR EACH ROW
EXECUTE FUNCTION prevent_audit_log_modification();

DROP TRIGGER IF EXISTS trg_prevent_audit_log_truncate ON audit_log;
CREATE TRIGGER trg_prevent_audit_log_truncate
BEFORE TRUNCATE ON audit_log
EXECUTE FUNCTION prevent_audit_log_modification();

-- ==============================================================================
-- POSTGRESQL ROW-LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation based on current_setting('app.current_society')
-- ==============================================================================
ALTER TABLE society ENABLE ROW LEVEL SECURITY;
ALTER TABLE wing ENABLE ROW LEVEL SECURITY;
ALTER TABLE flat ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_question ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_ticket ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_secret ENABLE ROW LEVEL SECURITY;
ALTER TABLE totp_backup_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_row ENABLE ROW LEVEL SECURITY;
ALTER TABLE super_admin_transfer ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notification ENABLE ROW LEVEL SECURITY;

-- Helper function to check if bypass or matching society
CREATE OR REPLACE FUNCTION check_tenant_access(record_society_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF current_setting('app.is_super_admin', true) = 'true' THEN
    RETURN TRUE;
  END IF;
  IF current_setting('app.current_society', true) IS NULL OR current_setting('app.current_society', true) = '' THEN
    RETURN FALSE;
  END IF;
  RETURN record_society_id = current_setting('app.current_society', true)::uuid;
END;
$$ LANGUAGE plpgsql;

DROP POLICY IF EXISTS society_tenant_policy ON society;
CREATE POLICY society_tenant_policy ON society
FOR ALL USING (check_tenant_access(id));

DROP POLICY IF EXISTS wing_tenant_policy ON wing;
CREATE POLICY wing_tenant_policy ON wing
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS flat_tenant_policy ON flat;
CREATE POLICY flat_tenant_policy ON flat
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS user_tenant_policy ON app_user;
CREATE POLICY user_tenant_policy ON app_user
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS import_batch_tenant_policy ON import_batch;
CREATE POLICY import_batch_tenant_policy ON import_batch
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS audit_log_tenant_policy ON audit_log;
CREATE POLICY audit_log_tenant_policy ON audit_log
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS notification_tenant_policy ON in_app_notification;
CREATE POLICY notification_tenant_policy ON in_app_notification
FOR ALL USING (check_tenant_access(society_id));
