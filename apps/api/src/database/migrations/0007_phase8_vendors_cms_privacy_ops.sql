-- ============================================================================
-- GrievEase Phase 8 Migration: Vendors, CMS, Privacy, and System Operations
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Vendors & Work Orders
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS vendor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone_encrypted TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- PLUMBING, ELECTRICAL, LIFT, PEST_CONTROL, PAINTING, HOUSEKEEPING, CARPENTRY, OTHER
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL, -- link to login account (role VENDOR)
    service_provider_id UUID REFERENCES service_provider(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_society ON vendor(society_id);
CREATE INDEX IF NOT EXISTS idx_vendor_user ON vendor(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_category ON vendor(category);

ALTER TABLE vendor ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_society_isolation ON vendor
    FOR ALL
    USING (society_id = current_setting('app.current_society_id', true)::uuid);

CREATE TABLE IF NOT EXISTS vendor_task (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor(id) ON DELETE RESTRICT,
    grievance_id UUID REFERENCES grievance(id) ON DELETE SET NULL,
    flat_id UUID REFERENCES flat(id) ON DELETE SET NULL,
    area_text VARCHAR(150),
    area_tag_id UUID,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, EMERGENCY
    assigned_by UUID NOT NULL REFERENCES app_user(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_visit_from TIMESTAMPTZ,
    expected_visit_to TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'ASSIGNED', 
    -- ASSIGNED, ACCEPTED, DECLINED, VISIT_SCHEDULED, IN_PROGRESS, COMPLETED, RESIDENT_CONFIRMED, DISPUTED, CANCELLED
    decline_reason TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    completion_note TEXT,
    resident_confirmation VARCHAR(20), -- CONFIRMED, NOT_FIXED, NO_RESPONSE
    resident_rating INT, -- 1 to 5
    resident_comment TEXT,
    reopen_reason TEXT,
    share_contact_with_vendor BOOLEAN NOT NULL DEFAULT FALSE,
    visitor_pass_id UUID REFERENCES visitor_pass(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_task_society ON vendor_task(society_id);
CREATE INDEX IF NOT EXISTS idx_vendor_task_vendor ON vendor_task(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_task_grievance ON vendor_task(grievance_id);
CREATE INDEX IF NOT EXISTS idx_vendor_task_status ON vendor_task(status);

ALTER TABLE vendor_task ENABLE ROW LEVEL SECURITY;
CREATE POLICY vendor_task_society_isolation ON vendor_task
    FOR ALL
    USING (society_id = current_setting('app.current_society_id', true)::uuid);

CREATE TABLE IF NOT EXISTS vendor_task_photo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES vendor_task(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL, -- BEFORE, AFTER, OTHER
    storage_key VARCHAR(255) NOT NULL,
    mime VARCHAR(50) NOT NULL,
    size INT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    scan_status VARCHAR(20) NOT NULL DEFAULT 'CLEAN',
    uploaded_by UUID NOT NULL REFERENCES app_user(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_photo_task ON vendor_task_photo(task_id);

CREATE TABLE IF NOT EXISTS vendor_task_event (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES vendor_task(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES app_user(id),
    action VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_event_task ON vendor_task_event(task_id);

-- ----------------------------------------------------------------------------
-- 2. Content, Support, Messages & CMS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cms_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES society(id) ON DELETE CASCADE, -- NULL for global/landing
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    question_en TEXT NOT NULL,
    question_hi TEXT NOT NULL,
    question_mr TEXT NOT NULL,
    answer_en TEXT NOT NULL,
    answer_hi TEXT NOT NULL,
    answer_mr TEXT NOT NULL,
    sort INT NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_testimonial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    role_or_flat_label VARCHAR(100) NOT NULL,
    quote VARCHAR(280) NOT NULL,
    stars INT NOT NULL DEFAULT 5,
    photo_key VARCHAR(255),
    consent_to_publish BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, APPROVED, HIDDEN
    moderated_by UUID REFERENCES app_user(id),
    moderated_at TIMESTAMPTZ,
    moderation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID REFERENCES society(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'GENERAL', -- GENERAL, DEMO, SOCIETY_ENQUIRY
    name VARCHAR(100) NOT NULL,
    society VARCHAR(150),
    role VARCHAR(50),
    phone_encrypted TEXT,
    email VARCHAR(150),
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, CLOSED
    assigned_to UUID REFERENCES app_user(id),
    notes TEXT,
    ip_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    flat_id UUID REFERENCES flat(id) ON DELETE SET NULL,
    opened_by UUID NOT NULL REFERENCES app_user(id),
    subject VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, CLOSED
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE conversation ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_society_isolation ON conversation
    FOR ALL
    USING (society_id = current_setting('app.current_society_id', true)::uuid);

CREATE TABLE IF NOT EXISTS conversation_message (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES app_user(id),
    sender_role VARCHAR(30) NOT NULL,
    body TEXT NOT NULL,
    attachment_keys TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_ticket (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    category VARCHAR(30) NOT NULL DEFAULT 'BUG', -- BUG, SUGGESTION, ACCOUNT, OTHER
    description TEXT NOT NULL,
    screenshot_keys TEXT[] DEFAULT '{}',
    device_info TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    assigned_to UUID REFERENCES app_user(id),
    resolution_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE support_ticket ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_ticket_society_isolation ON support_ticket
    FOR ALL
    USING (society_id = current_setting('app.current_society_id', true)::uuid);

CREATE TABLE IF NOT EXISTS site_setting (
    key VARCHAR(100) NOT NULL,
    society_id UUID REFERENCES society(id) ON DELETE CASCADE, -- NULL for global site settings
    value_en TEXT,
    value_hi TEXT,
    value_mr TEXT,
    json_value JSONB,
    updated_by UUID REFERENCES app_user(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (key, society_id)
);

-- ----------------------------------------------------------------------------
-- 3. Privacy, DPDP 2023 & Sensitive Access Logging
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS privacy_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    user_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
    type VARCHAR(30) NOT NULL, -- ACCESS, CORRECTION, DELETION, WITHDRAW_CONSENT
    requester_name VARCHAR(100) NOT NULL,
    requester_email VARCHAR(150),
    requester_phone_encrypted TEXT,
    details TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, IN_REVIEW, VERIFIED, COMPLETED, REJECTED
    verified_by UUID REFERENCES app_user(id),
    verified_at TIMESTAMPTZ,
    outcome_note TEXT,
    export_download_key VARCHAR(255),
    export_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE privacy_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY privacy_request_society_isolation ON privacy_request
    FOR ALL
    USING (society_id = current_setting('app.current_society_id', true)::uuid);

CREATE TABLE IF NOT EXISTS user_consent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    privacy_policy_version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_hash VARCHAR(64) NOT NULL,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_consent_user ON user_consent(user_id);

CREATE TABLE IF NOT EXISTS sensitive_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES app_user(id),
    actor_role VARCHAR(30) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- STAFF_ID_PROOF, VISITOR_LOOKUP, FLAT_LEDGER, IDENTITY_REVEAL, DATA_EXPORT
    target_id VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensitive_access_society ON sensitive_access_log(society_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_access_created ON sensitive_access_log(created_at DESC);

-- ----------------------------------------------------------------------------
-- 4. Operations, Backups & Job Monitoring
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS backup_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(30) NOT NULL, -- PG_DUMP, MINIO_SNAPSHOT
    file_name VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    details TEXT,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_run_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED
    processed_count INT NOT NULL DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_job_run_name ON job_run_log(job_name, started_at DESC);

