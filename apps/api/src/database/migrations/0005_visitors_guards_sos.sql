-- ==============================================================================
-- GrievEase Phase 6 Migration: Visitors, Deliveries, Guard Console & SOS Emergency
-- Includes:
-- 1. Visitors and Deliveries (gate, gate_device, visitor_pass, visit_log,
--    approval_request, blocklist, frequent_visitor, delivery_expected, delivery_log)
-- 2. Guard Console and Management (guard_profile, shift_template, shift,
--    guard_attendance, checkpoint, patrol_log, incident_log, shift_handover)
-- 3. SOS Emergency (sos_alert, sos_response, sos_responder, sos_setting)
-- 4. RLS policies and performance composite indexes
-- ==============================================================================

-- ==============================================================================
-- (A) GATES AND GATE DEVICES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS gate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gate_device (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES gate(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  last_seen_at TIMESTAMP,
  registered_by UUID REFERENCES app_user(id),
  revoked_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- (B) VISITORS AND DELIVERIES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS visitor_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES app_user(id),
  type VARCHAR(30) NOT NULL, -- ONE_TIME | RECURRING | GROUP | VEHICLE_ONLY
  visitor_name VARCHAR(150) NOT NULL,
  visitor_phone_encrypted TEXT,
  purpose VARCHAR(200) NOT NULL,
  guests_count INTEGER NOT NULL DEFAULT 1,
  vehicle_no VARCHAR(50),
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  recurrence JSONB, -- { days: [1,2,3], startTime: "10:00", endTime: "18:00" }
  max_entries INTEGER NOT NULL DEFAULT 1,
  entries_used INTEGER NOT NULL DEFAULT 0,
  code_hash VARCHAR(64) NOT NULL,
  pass_code VARCHAR(10), -- 6-digit gate code (stored hashed in code_hash, plain visible to host/guest)
  token_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | USED | EXPIRED | CANCELLED
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  pass_id UUID REFERENCES visitor_pass(id) ON DELETE SET NULL,
  visitor_name VARCHAR(150) NOT NULL,
  visitor_phone_encrypted TEXT,
  purpose VARCHAR(200) NOT NULL,
  vehicle_no VARCHAR(50),
  guests_count INTEGER NOT NULL DEFAULT 1,
  source VARCHAR(30) NOT NULL, -- PREAPPROVED | WALKIN | DELIVERY | CAB | STAFF | OVERRIDE
  decision_by_user_id UUID REFERENCES app_user(id),
  decision VARCHAR(30) NOT NULL DEFAULT 'APPROVED', -- APPROVED | DENIED | TIMEOUT_DEFAULT | GUARD_OVERRIDE
  decided_at TIMESTAMP,
  in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  out_at TIMESTAMP,
  guard_in_id UUID REFERENCES app_user(id),
  guard_out_id UUID REFERENCES app_user(id),
  gate_id UUID REFERENCES gate(id),
  photo_key TEXT,
  notes TEXT,
  overstay_alerted_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  visit_log_id UUID NOT NULL REFERENCES visit_log(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | APPROVED | DENIED | EXPIRED
  responded_by UUID REFERENCES app_user(id),
  responded_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID REFERENCES flat(id) ON DELETE CASCADE, -- NULL = society-wide
  person_hash VARCHAR(64), -- phone blind index
  name VARCHAR(150),
  vehicle_no VARCHAR(50),
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES app_user(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS frequent_visitor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  phone_encrypted TEXT,
  label VARCHAR(100) NOT NULL, -- "Parents", "Driver", "Sibling"
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_expected (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  company VARCHAR(50) NOT NULL, -- Amazon, Flipkart, Swiggy, Zomato, Other
  reference VARCHAR(100),
  window_from TIMESTAMP NOT NULL,
  window_to TIMESTAMP NOT NULL,
  rule VARCHAR(30) NOT NULL DEFAULT 'ALLOW_IN', -- ALLOW_IN | LEAVE_AT_GATE | ASK_ME
  status VARCHAR(30) NOT NULL DEFAULT 'EXPECTED', -- EXPECTED | ARRIVED | HANDED_OVER | LEFT_AT_GATE | DENIED | CANCELLED
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  expected_id UUID REFERENCES delivery_expected(id) ON DELETE SET NULL,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  company VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100),
  arrived_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  outcome VARCHAR(30) NOT NULL, -- HANDED_OVER | LEFT_AT_GATE | DENIED
  guard_id UUID REFERENCES app_user(id),
  note TEXT,
  collected_at TIMESTAMP
);

-- ==============================================================================
-- (C) GUARD MANAGEMENT AND CONSOLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS guard_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE UNIQUE,
  employee_code VARCHAR(50) NOT NULL,
  agency VARCHAR(150),
  id_proof_key TEXT,
  photo_key TEXT,
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone_encrypted TEXT,
  pin_hash VARCHAR(64),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | SUSPENDED
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- "06:00"
  end_time VARCHAR(10) NOT NULL,   -- "14:00"
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  guard_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  gate_id UUID REFERENCES gate(id) ON DELETE SET NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED | ACTIVE | COMPLETED | MISSED
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guard_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  guard_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shift(id) ON DELETE SET NULL,
  check_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  check_out_at TIMESTAMP,
  device_id UUID REFERENCES gate_device(id),
  method VARCHAR(30) NOT NULL DEFAULT 'MANUAL', -- MANUAL | DEVICE_LOGIN
  supersedes_id UUID REFERENCES guard_attendance(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS checkpoint (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  qr_slug VARCHAR(100) NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patrol_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  guard_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  checkpoint_id UUID NOT NULL REFERENCES checkpoint(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  shift_id UUID REFERENCES shift(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS incident_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  guard_id UUID NOT NULL REFERENCES app_user(id),
  type VARCHAR(50) NOT NULL, -- suspicious_person | vehicle | fire_hazard | fight | damage | medical | other
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH | CRITICAL
  description TEXT NOT NULL,
  photo_keys TEXT[],
  gate_id UUID REFERENCES gate(id),
  status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN | REVIEWED | CLOSED
  reviewed_by UUID REFERENCES app_user(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shift_handover (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  from_shift_id UUID REFERENCES shift(id) ON DELETE SET NULL,
  to_shift_id UUID REFERENCES shift(id) ON DELETE SET NULL,
  from_guard_id UUID NOT NULL REFERENCES app_user(id),
  to_guard_id UUID REFERENCES app_user(id),
  notes TEXT NOT NULL,
  acknowledged_by UUID REFERENCES app_user(id),
  acknowledged_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- (D) SOS EMERGENCY
-- ==============================================================================

CREATE TABLE IF NOT EXISTS sos_alert (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  raised_by_guard_id UUID REFERENCES app_user(id),
  type VARCHAR(30) NOT NULL DEFAULT 'OTHER', -- MEDICAL | FIRE | THEFT | OTHER | GUARD_DISTRESS
  note VARCHAR(200),
  location_mode VARCHAR(20) NOT NULL DEFAULT 'FLAT_ONLY', -- FLAT_ONLY | SHARED
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  accuracy DOUBLE PRECISION,
  status VARCHAR(30) NOT NULL DEFAULT 'RAISED', -- RAISED | ACKNOWLEDGED | RESPONDING | RESOLVED | FALSE_ALARM | CANCELLED
  raised_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cancel_window_ends_at TIMESTAMP NOT NULL,
  acknowledged_by UUID REFERENCES app_user(id),
  acknowledged_at TIMESTAMP,
  resolved_by UUID REFERENCES app_user(id),
  resolved_at TIMESTAMP,
  outcome_note TEXT,
  is_drill BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_tier INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_response (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES sos_alert(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(30) NOT NULL, -- ACK | ON_THE_WAY | ARRIVED | NOTE
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_responder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  priority_tier INTEGER NOT NULL DEFAULT 1, -- 1 | 2 | 3
  types TEXT[], -- ['MEDICAL', 'FIRE', 'THEFT', 'OTHER']
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sos_setting (
  society_id UUID PRIMARY KEY REFERENCES society(id) ON DELETE CASCADE,
  cancel_window_seconds INTEGER NOT NULL DEFAULT 5,
  ack_timeout_seconds INTEGER NOT NULL DEFAULT 60,
  tier2_timeout_seconds INTEGER NOT NULL DEFAULT 120,
  repeat_sound BOOLEAN NOT NULL DEFAULT TRUE,
  drills_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  gate_offline_alert_minutes INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- (E) COMPOSITE INDEXES & PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_visitor_pass_society_status ON visitor_pass(society_id, status);
CREATE INDEX IF NOT EXISTS idx_visitor_pass_code_hash ON visitor_pass(society_id, code_hash);
CREATE INDEX IF NOT EXISTS idx_visitor_pass_flat ON visitor_pass(society_id, flat_id);
CREATE INDEX IF NOT EXISTS idx_visit_log_society_in_at ON visit_log(society_id, in_at);
CREATE INDEX IF NOT EXISTS idx_visit_log_flat ON visit_log(society_id, flat_id);
CREATE INDEX IF NOT EXISTS idx_visit_log_out_at ON visit_log(society_id, out_at);
CREATE INDEX IF NOT EXISTS idx_approval_request_visit ON approval_request(society_id, visit_log_id);
CREATE INDEX IF NOT EXISTS idx_approval_request_flat ON approval_request(society_id, flat_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_expected_flat ON delivery_expected(society_id, flat_id, status);
CREATE INDEX IF NOT EXISTS idx_delivery_log_flat ON delivery_log(society_id, flat_id);
CREATE INDEX IF NOT EXISTS idx_shift_guard_starts ON shift(society_id, guard_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_guard_attendance_guard ON guard_attendance(society_id, guard_id);
CREATE INDEX IF NOT EXISTS idx_incident_log_society_status ON incident_log(society_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_alert_society_status ON sos_alert(society_id, status);
CREATE INDEX IF NOT EXISTS idx_sos_alert_flat ON sos_alert(society_id, flat_id);
CREATE INDEX IF NOT EXISTS idx_sos_response_alert ON sos_response(society_id, alert_id);

-- ==============================================================================
-- (F) ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE gate ENABLE ROW LEVEL SECURITY;
ALTER TABLE gate_device ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_pass ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE frequent_visitor ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_expected ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_handover ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alert ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_response ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_responder ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_setting ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- gate
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gate_tenant_isolation') THEN
    CREATE POLICY gate_tenant_isolation ON gate USING (check_tenant_access(society_id));
  END IF;

  -- gate_device
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'gate_device_tenant_isolation') THEN
    CREATE POLICY gate_device_tenant_isolation ON gate_device USING (check_tenant_access(society_id));
  END IF;

  -- visitor_pass
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'visitor_pass_tenant_isolation') THEN
    CREATE POLICY visitor_pass_tenant_isolation ON visitor_pass USING (check_tenant_access(society_id));
  END IF;

  -- visit_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'visit_log_tenant_isolation') THEN
    CREATE POLICY visit_log_tenant_isolation ON visit_log USING (check_tenant_access(society_id));
  END IF;

  -- approval_request
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'approval_request_tenant_isolation') THEN
    CREATE POLICY approval_request_tenant_isolation ON approval_request USING (check_tenant_access(society_id));
  END IF;

  -- blocklist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'blocklist_tenant_isolation') THEN
    CREATE POLICY blocklist_tenant_isolation ON blocklist USING (check_tenant_access(society_id));
  END IF;

  -- frequent_visitor
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'frequent_visitor_tenant_isolation') THEN
    CREATE POLICY frequent_visitor_tenant_isolation ON frequent_visitor USING (check_tenant_access(society_id));
  END IF;

  -- delivery_expected
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_expected_tenant_isolation') THEN
    CREATE POLICY delivery_expected_tenant_isolation ON delivery_expected USING (check_tenant_access(society_id));
  END IF;

  -- delivery_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delivery_log_tenant_isolation') THEN
    CREATE POLICY delivery_log_tenant_isolation ON delivery_log USING (check_tenant_access(society_id));
  END IF;

  -- guard_profile
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guard_profile_tenant_isolation') THEN
    CREATE POLICY guard_profile_tenant_isolation ON guard_profile USING (check_tenant_access(society_id));
  END IF;

  -- shift_template
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shift_template_tenant_isolation') THEN
    CREATE POLICY shift_template_tenant_isolation ON shift_template USING (check_tenant_access(society_id));
  END IF;

  -- shift
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shift_tenant_isolation') THEN
    CREATE POLICY shift_tenant_isolation ON shift USING (check_tenant_access(society_id));
  END IF;

  -- guard_attendance
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'guard_attendance_tenant_isolation') THEN
    CREATE POLICY guard_attendance_tenant_isolation ON guard_attendance USING (check_tenant_access(society_id));
  END IF;

  -- checkpoint
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'checkpoint_tenant_isolation') THEN
    CREATE POLICY checkpoint_tenant_isolation ON checkpoint USING (check_tenant_access(society_id));
  END IF;

  -- patrol_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'patrol_log_tenant_isolation') THEN
    CREATE POLICY patrol_log_tenant_isolation ON patrol_log USING (check_tenant_access(society_id));
  END IF;

  -- incident_log
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'incident_log_tenant_isolation') THEN
    CREATE POLICY incident_log_tenant_isolation ON incident_log USING (check_tenant_access(society_id));
  END IF;

  -- shift_handover
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'shift_handover_tenant_isolation') THEN
    CREATE POLICY shift_handover_tenant_isolation ON shift_handover USING (check_tenant_access(society_id));
  END IF;

  -- sos_alert
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_alert_tenant_isolation') THEN
    CREATE POLICY sos_alert_tenant_isolation ON sos_alert USING (check_tenant_access(society_id));
  END IF;

  -- sos_response
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_response_tenant_isolation') THEN
    CREATE POLICY sos_response_tenant_isolation ON sos_response USING (check_tenant_access(society_id));
  END IF;

  -- sos_responder
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_responder_tenant_isolation') THEN
    CREATE POLICY sos_responder_tenant_isolation ON sos_responder USING (check_tenant_access(society_id));
  END IF;

  -- sos_setting
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'sos_setting_tenant_isolation') THEN
    CREATE POLICY sos_setting_tenant_isolation ON sos_setting USING (check_tenant_access(society_id));
  END IF;
END $$;
