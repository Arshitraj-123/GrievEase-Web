-- ==============================================================================
-- GrievEase Phase 5 Community Modules Migration
-- Includes:
-- 1. Noticeboard & Polls (notice, notice_category, notice_translation, notice_audience,
--    notice_attachment, notice_version, notice_read, poll, poll_option, poll_voter_roll, poll_ballot)
-- 2. Directory & Emergency Contacts (directory_preference, office_bearer, emergency_contact,
--    service_provider, service_provider_review)
-- 3. Domestic Staff Management (domestic_staff, staff_flat_link, staff_pass,
--    staff_attendance, staff_review)
-- 4. RLS policies and performance composite indexes
-- ==============================================================================

-- ==============================================================================
-- (A) NOTICEBOARD AND POLLS
-- ==============================================================================

-- 1. Notice Categories (Seed: General, Maintenance, Meeting/AGM, Water/Power shutoff, Event, Rules, Emergency)
CREATE TABLE IF NOT EXISTS notice_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_hi VARCHAR(100) NOT NULL,
  name_mr VARCHAR(100) NOT NULL,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, name_en)
);

-- 2. Notices
CREATE TABLE IF NOT EXISTS notice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES notice_category(id),
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL, -- Sanitised rich text (bold, lists, links only)
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT | SCHEDULED | PUBLISHED | ARCHIVED
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL | IMPORTANT | EMERGENCY
  pinned BOOLEAN NOT NULL DEFAULT FALSE,
  pin_order INTEGER DEFAULT 0,
  audience_type VARCHAR(20) NOT NULL DEFAULT 'ALL', -- ALL | WINGS | ROLES
  publish_at TIMESTAMP,
  expires_at TIMESTAMP,
  requires_ack BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES app_user(id),
  published_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Notice Translations (EN required, HI/MR optional, users see their language with EN fallback)
CREATE TABLE IF NOT EXISTS notice_translation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  lang VARCHAR(10) NOT NULL, -- 'en' | 'hi' | 'mr'
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(notice_id, lang)
);

-- 4. Notice Audience (Targeted wings or roles when audience_type is not ALL)
CREATE TABLE IF NOT EXISTS notice_audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  wing_id UUID REFERENCES wing(id) ON DELETE CASCADE,
  role VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 5. Notice Attachments (PDF/JPG/PNG/WEBP, 10MB limit, scanned, signed URLs only)
CREATE TABLE IF NOT EXISTS notice_attachment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  storage_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  sha256 VARCHAR(64) NOT NULL,
  scan_status VARCHAR(20) NOT NULL DEFAULT 'CLEAN', -- CLEAN | INFECTED | PENDING
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Notice Version (Append-only audit of published edits)
CREATE TABLE IF NOT EXISTS notice_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  version_num INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES app_user(id),
  reason TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. Notice Read Receipts & Acknowledgements
CREATE TABLE IF NOT EXISTS notice_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID NOT NULL REFERENCES notice(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  read_at TIMESTAMP NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMP,
  UNIQUE(notice_id, user_id)
);

-- 8. Polls
CREATE TABLE IF NOT EXISTS poll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  notice_id UUID REFERENCES notice(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL DEFAULT 'SINGLE', -- SINGLE | MULTIPLE
  max_choices INTEGER NOT NULL DEFAULT 1,
  eligibility VARCHAR(30) NOT NULL DEFAULT 'ALL_RESIDENTS', -- ALL_RESIDENTS | OWNERS_ONLY | ROLES
  vote_unit VARCHAR(20) NOT NULL DEFAULT 'PER_USER', -- PER_USER | PER_FLAT
  ballot VARCHAR(20) NOT NULL DEFAULT 'SECRET', -- SECRET | OPEN
  results_visibility VARCHAR(30) NOT NULL DEFAULT 'AFTER_VOTE', -- AFTER_VOTE | AFTER_CLOSE | ADMIN_ONLY
  quorum_percent NUMERIC(5,2),
  opens_at TIMESTAMP NOT NULL,
  closes_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT | OPEN | CLOSED | CANCELLED
  result_snapshot JSONB,
  result_hash TEXT,
  created_by UUID NOT NULL REFERENCES app_user(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 9. Poll Options
CREATE TABLE IF NOT EXISTS poll_option (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
  label_en VARCHAR(200) NOT NULL,
  label_hi VARCHAR(200),
  label_mr VARCHAR(200),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 10. Poll Voter Roll (Records voter_ref and timestamp only; separate from ballots)
CREATE TABLE IF NOT EXISTS poll_voter_roll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
  voter_ref VARCHAR(100) NOT NULL, -- user_id or flat_id
  voted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(poll_id, voter_ref)
);

-- 11. Poll Ballot (NO voter reference for SECRET ballots! Stored in cast_bucket rounded to hour)
CREATE TABLE IF NOT EXISTS poll_ballot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES poll(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_option(id) ON DELETE CASCADE,
  cast_bucket TIMESTAMP NOT NULL, -- rounded to hour
  voter_name VARCHAR(100) -- NULL for SECRET ballots; populated ONLY when ballot is OPEN
);

-- ==============================================================================
-- (B) DIRECTORY AND EMERGENCY CONTACTS
-- ==============================================================================

-- 12. Directory Preferences (Strict opt-in: default visible false, all fields false)
CREATE TABLE IF NOT EXISTS directory_preference (
  user_id UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  visible BOOLEAN NOT NULL DEFAULT FALSE,
  show_name BOOLEAN NOT NULL DEFAULT FALSE,
  show_flat BOOLEAN NOT NULL DEFAULT FALSE,
  show_mobile BOOLEAN NOT NULL DEFAULT FALSE,
  show_email BOOLEAN NOT NULL DEFAULT FALSE,
  show_photo BOOLEAN NOT NULL DEFAULT FALSE,
  show_resident_type BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 13. Office Bearers
CREATE TABLE IF NOT EXISTS office_bearer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  public_to_residents BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(society_id, user_id)
);

-- 14. Emergency Contacts (security, ambulance, fire, police, water_board, electricity_board, lift_service, other)
CREATE TABLE IF NOT EXISTS emergency_contact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 15. Service Providers
CREATE TABLE IF NOT EXISTS service_provider (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  area VARCHAR(150),
  notes TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 16. Service Provider Reviews
CREATE TABLE IF NOT EXISTS service_provider_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES service_provider(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(provider_id, user_id)
);

-- ==============================================================================
-- (C) DOMESTIC STAFF MANAGEMENT
-- ==============================================================================

-- 17. Domestic Staff (Phone blind index HMAC for duplicates, encrypted phone & ID proof at rest)
CREATE TABLE IF NOT EXISTS domestic_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  staff_type VARCHAR(50) NOT NULL, -- maid | cook | driver | nanny | gardener | other
  phone_blind_index VARCHAR(64) NOT NULL, -- HMAC-SHA256
  phone_encrypted TEXT NOT NULL, -- AES-256-GCM
  photo_key VARCHAR(500),
  id_proof_key TEXT, -- Encrypted at rest (AES-256-GCM)
  id_proof_type VARCHAR(50), -- Enum label only: AADHAAR | PAN | VOTER_ID | PASSPORT | DRIVING_LICENSE
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING | VERIFIED | REJECTED | SUSPENDED | BLOCKED
  verified_by UUID REFERENCES app_user(id),
  verified_at TIMESTAMP,
  block_reason TEXT,
  created_by UUID REFERENCES app_user(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 18. Staff Flat Link
CREATE TABLE IF NOT EXISTS staff_flat_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES domestic_staff(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES app_user(id),
  schedule JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of { day: 'MONDAY'|..., startTime: '08:00', endTime: '12:00' }
  entry_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  active_to DATE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(staff_id, flat_id)
);

-- 19. Staff Pass (Signed token HMAC over staff_id + serial + society)
CREATE TABLE IF NOT EXISTS staff_pass (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES domestic_staff(id) ON DELETE CASCADE,
  serial VARCHAR(50) NOT NULL UNIQUE,
  token_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | REVOKED | EXPIRED
  valid_from TIMESTAMP NOT NULL DEFAULT NOW(),
  valid_to TIMESTAMP NOT NULL,
  issued_by UUID NOT NULL REFERENCES app_user(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 20. Staff Attendance (Append-only: corrections create a new row superseding the old one)
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES domestic_staff(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  in_at TIMESTAMP,
  out_at TIMESTAMP,
  source VARCHAR(20) NOT NULL DEFAULT 'MANUAL', -- MANUAL | GUARD_SCAN
  marked_by UUID NOT NULL REFERENCES app_user(id),
  note TEXT,
  supersedes_id UUID REFERENCES staff_attendance(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 21. Staff Reviews (One review per user per staff)
CREATE TABLE IF NOT EXISTS staff_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES domestic_staff(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(staff_id, user_id)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & LOOKUPS
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_notice_society_status ON notice (society_id, status);
CREATE INDEX IF NOT EXISTS idx_notice_publish_at ON notice (publish_at) WHERE status = 'SCHEDULED';
CREATE INDEX IF NOT EXISTS idx_notice_expires_at ON notice (expires_at) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_notice_pinned ON notice (society_id, pinned, pin_order) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_poll_society_status ON poll (society_id, status);
CREATE INDEX IF NOT EXISTS idx_poll_closes_at ON poll (closes_at) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_poll_ballot_poll ON poll_ballot (poll_id, option_id);
CREATE INDEX IF NOT EXISTS idx_domestic_staff_phone_blind ON domestic_staff (society_id, phone_blind_index);
CREATE INDEX IF NOT EXISTS idx_domestic_staff_status ON domestic_staff (society_id, status);
CREATE INDEX IF NOT EXISTS idx_staff_flat_link_flat ON staff_flat_link (flat_id, entry_allowed);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_lookup ON staff_attendance (staff_id, flat_id, date);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-tenant isolation based on check_tenant_access(society_id)
-- ==============================================================================

ALTER TABLE notice_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE notice ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_bearer ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_provider ENABLE ROW LEVEL SECURITY;
ALTER TABLE domestic_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notice_category_tenant_policy ON notice_category;
CREATE POLICY notice_category_tenant_policy ON notice_category
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS notice_tenant_policy ON notice;
CREATE POLICY notice_tenant_policy ON notice
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS poll_tenant_policy ON poll;
CREATE POLICY poll_tenant_policy ON poll
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS office_bearer_tenant_policy ON office_bearer;
CREATE POLICY office_bearer_tenant_policy ON office_bearer
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS emergency_contact_tenant_policy ON emergency_contact;
CREATE POLICY emergency_contact_tenant_policy ON emergency_contact
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS service_provider_tenant_policy ON service_provider;
CREATE POLICY service_provider_tenant_policy ON service_provider
FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS domestic_staff_tenant_policy ON domestic_staff;
CREATE POLICY domestic_staff_tenant_policy ON domestic_staff
FOR ALL USING (check_tenant_access(society_id));

-- ==============================================================================
-- DEFAULT SOCIETY SETTINGS FOR PHASE 5
-- ==============================================================================

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'notices_enabled', 'true' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'polls_enabled', 'true' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'directory_enabled', 'true' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'emergency_contacts_enabled', 'true' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'staff_enabled', 'true' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'max_pinned_notices', '3' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'staff_id_proof_mode', 'IMAGE_ONLY' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;

INSERT INTO society_setting (society_id, setting_key, setting_value)
SELECT id, 'staff_id_retention_days', '30' FROM society
ON CONFLICT (society_id, setting_key) DO NOTHING;
