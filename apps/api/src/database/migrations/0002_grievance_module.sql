-- ==============================================================================
-- GrievEase Phase 3 Grievance Module Migration
-- Includes:
-- 1. Governance levels, assignments, working hours, resolver leave
-- 2. Category, area tags, SLA configs, society settings
-- 3. Grievance table, locked counter, anonymous identity & reveal tables
-- 4. Grievance events with immutable trigger (no UPDATE, DELETE, TRUNCATE)
-- 5. Evidence, co-complainants, drafts, ratings, appeals, escalation log
-- 6. Row Level Security (RLS) policies for all new tables
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Category
CREATE TABLE IF NOT EXISTS category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_hi VARCHAR(100) NOT NULL,
  name_mr VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  requires_photo BOOLEAN NOT NULL DEFAULT FALSE,
  sort INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_category_society ON category(society_id, active);

-- 2. Area Tag
CREATE TABLE IF NOT EXISTS area_tag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  qr_slug VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_area_tag_slug_society UNIQUE (society_id, qr_slug)
);

CREATE INDEX IF NOT EXISTS idx_area_tag_society ON area_tag(society_id);

-- 3. SLA Config
CREATE TABLE IF NOT EXISTS sla_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  category_id UUID REFERENCES category(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL, -- NORMAL, URGENT, EMERGENCY
  level INTEGER NOT NULL,        -- 1, 2, 3, 4
  hours INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_sla_config UNIQUE (society_id, category_id, priority, level)
);

CREATE INDEX IF NOT EXISTS idx_sla_config_lookup ON sla_config(society_id, priority, level);

-- 4. Governance Level
CREATE TABLE IF NOT EXISTS governance_level (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  level INTEGER NOT NULL, -- 1=Secretary, 2=Committee, 3=Chairman, 4=Governing Body
  label VARCHAR(100) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_governance_level UNIQUE (society_id, level)
);

-- 5. Governance Assignment
CREATE TABLE IF NOT EXISTS governance_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  level INTEGER NOT NULL, -- 1-4
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  active_from TIMESTAMP NOT NULL DEFAULT NOW(),
  active_to TIMESTAMP,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_governance_assignment ON governance_assignment(society_id, level, is_primary);

-- 6. Resolver Leave
CREATE TABLE IF NOT EXISTS resolver_leave (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  from_at TIMESTAMP NOT NULL,
  to_at TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resolver_leave ON resolver_leave(user_id, from_at, to_at);

-- 7. Working Hours
CREATE TABLE IF NOT EXISTS working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL, -- 0=Sunday, 1=Monday ... 6=Saturday
  start_time VARCHAR(5) NOT NULL DEFAULT '09:00',
  end_time VARCHAR(5) NOT NULL DEFAULT '18:00',
  enabled BOOLEAN NOT NULL DEFAULT FALSE, -- default disabled = 24x7
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_working_hours_day UNIQUE (society_id, weekday)
);

-- 8. Society Setting (Key/Value)
CREATE TABLE IF NOT EXISTS society_setting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_society_setting_key UNIQUE (society_id, key)
);

-- 9. Grievance Locked Counter (GR-YYYY-NNNN)
CREATE TABLE IF NOT EXISTS grievance_counter (
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (society_id, year)
);

-- 10. Grievance Core Entity
CREATE TABLE IF NOT EXISTS grievance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  public_id VARCHAR(50) NOT NULL,
  category_id UUID NOT NULL REFERENCES category(id),
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, URGENT, EMERGENCY
  area_text VARCHAR(255),
  area_tag_id UUID REFERENCES area_tag(id) ON DELETE SET NULL,
  occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  current_level INTEGER NOT NULL DEFAULT 1,
  assigned_to UUID REFERENCES app_user(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMP NOT NULL,
  level_entered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  submitter_user_id UUID REFERENCES app_user(id) ON DELETE SET NULL, -- NULL when anonymous
  submitter_blind_index VARCHAR(64), -- HMAC blind index for anonymous resident retrieval
  flat_id UUID REFERENCES flat(id) ON DELETE SET NULL, -- NULL when anonymous
  tracking_code_hash VARCHAR(64) NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT FALSE,
  flag_reason TEXT,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  closure_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_grievance_public_id UNIQUE (society_id, public_id)
);

CREATE INDEX IF NOT EXISTS idx_grievance_status ON grievance(society_id, status);
CREATE INDEX IF NOT EXISTS idx_grievance_level ON grievance(society_id, current_level);
CREATE INDEX IF NOT EXISTS idx_grievance_assigned ON grievance(assigned_to);
CREATE INDEX IF NOT EXISTS idx_grievance_submitter ON grievance(society_id, submitter_user_id);
CREATE INDEX IF NOT EXISTS idx_grievance_blind_index ON grievance(society_id, submitter_blind_index);
CREATE INDEX IF NOT EXISTS idx_grievance_tracking_hash ON grievance(tracking_code_hash);
CREATE INDEX IF NOT EXISTS idx_grievance_trgm_title ON grievance USING gin (title gin_trgm_ops);

-- 11. Anonymous Identity (Separated & Protected)
CREATE TABLE IF NOT EXISTS anonymous_identity (
  grievance_id UUID PRIMARY KEY REFERENCES grievance(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  encrypted_submitter TEXT NOT NULL, -- AES-256-GCM payload with IV & authTag
  key_version VARCHAR(20) NOT NULL DEFAULT 'v1',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 12. Identity Reveal Audit
CREATE TABLE IF NOT EXISTS identity_reveal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  revealed_by UUID NOT NULL REFERENCES app_user(id),
  reason TEXT NOT NULL,
  approved_notice_sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Grievance Event (Timeline)
CREATE TABLE IF NOT EXISTS grievance_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  actor_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  actor_role VARCHAR(50),
  visibility VARCHAR(20) NOT NULL DEFAULT 'RESIDENT', -- RESIDENT | INTERNAL
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_grievance_event_seq UNIQUE (grievance_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_grievance_event ON grievance_event(grievance_id, seq);

-- 14. Immutable Trigger for Grievance Event
CREATE OR REPLACE FUNCTION prevent_grievance_event_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'grievance_event is append-only: UPDATE, DELETE and TRUNCATE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_grievance_event_modification ON grievance_event;
CREATE TRIGGER trg_prevent_grievance_event_modification
BEFORE UPDATE OR DELETE ON grievance_event
FOR EACH ROW
EXECUTE FUNCTION prevent_grievance_event_modification();

DROP TRIGGER IF EXISTS trg_prevent_grievance_event_truncate ON grievance_event;
CREATE TRIGGER trg_prevent_grievance_event_truncate
BEFORE TRUNCATE ON grievance_event
EXECUTE FUNCTION prevent_grievance_event_modification();

-- 15. Evidence
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  uploader_id UUID REFERENCES app_user(id) ON DELETE SET NULL, -- NULL for anonymous
  storage_key VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  scan_status VARCHAR(30) NOT NULL DEFAULT 'CLEAN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_grievance ON evidence(grievance_id);

-- 16. Co-Complainant
CREATE TABLE IF NOT EXISTS co_complainant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_co_complainant UNIQUE (grievance_id, user_id)
);

-- 17. Grievance Draft
CREATE TABLE IF NOT EXISTS grievance_draft (
  user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 18. Rating
CREATE TABLE IF NOT EXISTS rating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment VARCHAR(200),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rating_grievance UNIQUE (grievance_id)
);

-- 19. Appeal
CREATE TABLE IF NOT EXISTS appeal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appeal_grievance ON appeal(grievance_id);

-- 20. Escalation Log
CREATE TABLE IF NOT EXISTS escalation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  grievance_id UUID NOT NULL REFERENCES grievance(id) ON DELETE CASCADE,
  from_level INTEGER NOT NULL,
  to_level INTEGER NOT NULL,
  reason VARCHAR(30) NOT NULL, -- AUTO_SLA | MANUAL | LEAVE | VACANT | EMERGENCY | APPEAL
  actor_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_log_grievance ON escalation_log(grievance_id, created_at);

-- 21. Job Run (Worker Monitoring)
CREATE TABLE IF NOT EXISTS job_run (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMP,
  processed INTEGER NOT NULL DEFAULT 0,
  errors INTEGER NOT NULL DEFAULT 0,
  details JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_job_run_name ON job_run(name, started_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR PHASE 3 TABLES
-- ==============================================================================
ALTER TABLE category ENABLE ROW LEVEL SECURITY;
ALTER TABLE area_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_level ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolver_leave ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_identity ENABLE ROW LEVEL SECURITY;
ALTER TABLE identity_reveal ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE co_complainant ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_draft ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating ENABLE ROW LEVEL SECURITY;
ALTER TABLE appeal ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS category_tenant_policy ON category;
CREATE POLICY category_tenant_policy ON category FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS area_tag_tenant_policy ON area_tag;
CREATE POLICY area_tag_tenant_policy ON area_tag FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS sla_config_tenant_policy ON sla_config;
CREATE POLICY sla_config_tenant_policy ON sla_config FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS governance_level_tenant_policy ON governance_level;
CREATE POLICY governance_level_tenant_policy ON governance_level FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS governance_assignment_tenant_policy ON governance_assignment;
CREATE POLICY governance_assignment_tenant_policy ON governance_assignment FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS resolver_leave_tenant_policy ON resolver_leave;
CREATE POLICY resolver_leave_tenant_policy ON resolver_leave FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS working_hours_tenant_policy ON working_hours;
CREATE POLICY working_hours_tenant_policy ON working_hours FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS society_setting_tenant_policy ON society_setting;
CREATE POLICY society_setting_tenant_policy ON society_setting FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS grievance_counter_tenant_policy ON grievance_counter;
CREATE POLICY grievance_counter_tenant_policy ON grievance_counter FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS grievance_tenant_policy ON grievance;
CREATE POLICY grievance_tenant_policy ON grievance FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS anonymous_identity_tenant_policy ON anonymous_identity;
CREATE POLICY anonymous_identity_tenant_policy ON anonymous_identity FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS identity_reveal_tenant_policy ON identity_reveal;
CREATE POLICY identity_reveal_tenant_policy ON identity_reveal FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS grievance_event_tenant_policy ON grievance_event;
CREATE POLICY grievance_event_tenant_policy ON grievance_event FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS evidence_tenant_policy ON evidence;
CREATE POLICY evidence_tenant_policy ON evidence FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS co_complainant_tenant_policy ON co_complainant;
CREATE POLICY co_complainant_tenant_policy ON co_complainant FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS grievance_draft_tenant_policy ON grievance_draft;
CREATE POLICY grievance_draft_tenant_policy ON grievance_draft FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS rating_tenant_policy ON rating;
CREATE POLICY rating_tenant_policy ON rating FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS appeal_tenant_policy ON appeal;
CREATE POLICY appeal_tenant_policy ON appeal FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS escalation_log_tenant_policy ON escalation_log;
CREATE POLICY escalation_log_tenant_policy ON escalation_log FOR ALL USING (check_tenant_access(society_id));
