-- ==============================================================================
-- GrievEase Phase 7 Migration: Amenity Booking + Maintenance Billing (Cash)
-- Includes:
--   A. Flat attribute extensions (area_sqft, flat_type, parking_slots, occupancy)
--   B. Amenity booking tables (amenity, amenity_blackout, amenity_closure,
--      booking, booking_event, slot_counter)
--   C. Maintenance billing tables (bill_head, bill_cycle, bill, bill_line,
--      late_fee_rule, receipt_counter, bill_number_counter,
--      ledger_entry [append-only hash-chained], payment, payment_allocation,
--      cash_session, adjustment_request, payment_dispute)
--   D. Composite indexes
--   E. Row-Level Security (RLS) policies
--   F. Append-only triggers for ledger_entry
-- ==============================================================================

-- ==============================================================================
-- (A) FLAT ATTRIBUTE EXTENSIONS
-- ==============================================================================

ALTER TABLE flat ADD COLUMN IF NOT EXISTS area_sqft NUMERIC(10,2);
ALTER TABLE flat ADD COLUMN IF NOT EXISTS flat_type VARCHAR(50);
ALTER TABLE flat ADD COLUMN IF NOT EXISTS parking_slots INTEGER NOT NULL DEFAULT 0;
ALTER TABLE flat ADD COLUMN IF NOT EXISTS occupancy VARCHAR(20) NOT NULL DEFAULT 'OWNER_OCCUPIED';

-- ==============================================================================
-- (B) AMENITY BOOKING TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS amenity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- CLUBHOUSE|GYM|POOL|HALL|COURT|OTHER
  name_en VARCHAR(100) NOT NULL,
  name_hi VARCHAR(100) NOT NULL,
  name_mr VARCHAR(100) NOT NULL,
  description_en TEXT,
  description_hi TEXT,
  description_mr TEXT,
  photo_keys TEXT[] NOT NULL DEFAULT '{}',
  rules_en TEXT,
  rules_hi TEXT,
  rules_mr TEXT,
  capacity_total INTEGER NOT NULL DEFAULT 1,
  mode VARCHAR(10) NOT NULL DEFAULT 'EXCLUSIVE', -- EXCLUSIVE|CAPACITY
  -- open_hours: JSON {0:{open:"09:00",close:"21:00",enabled:true}, ...6}
  open_hours JSONB,
  slot_minutes INTEGER NOT NULL DEFAULT 60,
  min_slots INTEGER NOT NULL DEFAULT 1,
  max_slots INTEGER NOT NULL DEFAULT 4,
  advance_days_max INTEGER NOT NULL DEFAULT 30,
  min_notice_hours INTEGER NOT NULL DEFAULT 2,
  max_bookings_per_flat_per_week INTEGER NOT NULL DEFAULT 2,
  max_guests INTEGER NOT NULL DEFAULT 20,
  fee_mode VARCHAR(15) NOT NULL DEFAULT 'NONE', -- NONE|PER_SLOT|PER_BOOKING
  fee_paise BIGINT NOT NULL DEFAULT 0,
  deposit_paise BIGINT NOT NULL DEFAULT 0,
  fee_collection VARCHAR(25) NOT NULL DEFAULT 'COLLECT_BEFORE_CONFIRM', -- COLLECT_BEFORE_CONFIRM|ADD_TO_NEXT_BILL
  hold_hours INTEGER NOT NULL DEFAULT 24,
  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  cancellation_free_hours INTEGER NOT NULL DEFAULT 24,
  cancellation_fee_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenity_blackout (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenity(id) ON DELETE CASCADE,
  from_at TIMESTAMP NOT NULL,
  to_at TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS amenity_closure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenity(id) ON DELETE CASCADE,
  from_at TIMESTAMP NOT NULL,
  to_at TIMESTAMP NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Install btree_gist extension for EXCLUDE constraint (if not already installed)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES amenity(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  -- during is a TSTZRANGE representing the booking time window
  during TSTZRANGE NOT NULL,
  slot_count INTEGER NOT NULL DEFAULT 1,
  people_count INTEGER NOT NULL DEFAULT 1,
  guests_count INTEGER NOT NULL DEFAULT 0,
  purpose VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED', -- PENDING_APPROVAL|AWAITING_PAYMENT|CONFIRMED|CANCELLED|REJECTED|COMPLETED|NO_SHOW|EXPIRED
  hold_expires_at TIMESTAMP,
  fee_paise BIGINT NOT NULL DEFAULT 0,
  deposit_paise BIGINT NOT NULL DEFAULT 0,
  payment_id UUID, -- FK added after payment table
  ledger_ref UUID, -- FK to ledger_entry
  cancelled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  cancel_reason TEXT,
  pass_token_hash VARCHAR(64),
  checked_in_at TIMESTAMP,
  override_dues BOOLEAN NOT NULL DEFAULT FALSE,
  override_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- EXCLUSIVE double-booking prevention: PostgreSQL range exclusion constraint
-- Only active bookings (PENDING_APPROVAL, AWAITING_PAYMENT, CONFIRMED) are included
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'booking_exclusive_no_overlap'
  ) THEN
    ALTER TABLE booking ADD CONSTRAINT booking_exclusive_no_overlap
      EXCLUDE USING gist (
        amenity_id WITH =,
        during WITH &&
      )
      WHERE (status IN ('PENDING_APPROVAL', 'AWAITING_PAYMENT', 'CONFIRMED'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS booking_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES app_user(id) ON DELETE SET NULL,
  actor_role VARCHAR(50),
  event_type VARCHAR(50) NOT NULL, -- CREATED|APPROVED|REJECTED|CONFIRMED|CANCELLED|PAYMENT_RECORDED|CHECKED_IN|NO_SHOW|EXPIRED|HOLD_EXTENDED
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Slot counter for CAPACITY-mode amenities (row-locked per slot)
CREATE TABLE IF NOT EXISTS slot_counter (
  amenity_id UUID NOT NULL REFERENCES amenity(id) ON DELETE CASCADE,
  slot_start TIMESTAMP NOT NULL,
  booked_people INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (amenity_id, slot_start)
);

-- ==============================================================================
-- (C) MAINTENANCE BILLING TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS bill_head (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name_en VARCHAR(100) NOT NULL,
  name_hi VARCHAR(100) NOT NULL,
  name_mr VARCHAR(100) NOT NULL,
  calc_method VARCHAR(20) NOT NULL, -- FIXED_PER_FLAT|PER_SQFT|BY_FLAT_TYPE|PER_PARKING_SLOT|MANUAL
  rate_paise BIGINT NOT NULL DEFAULT 0,
  -- rate_table: JSON map e.g. {"STUDIO":10000,"1BHK":15000,"2BHK":20000}
  rate_table JSONB,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bill_cycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'DRAFT', -- DRAFT|PREVIEWED|ISSUED|CLOSED
  generated_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  issued_at TIMESTAMP,
  head_ids UUID[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (society_id, period_start)
);

-- Gapless bill number counter (locked row per society per financial year)
CREATE TABLE IF NOT EXISTS bill_number_counter (
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  fy_label VARCHAR(10) NOT NULL, -- e.g. "2026-27"
  last_seq INTEGER NOT NULL DEFAULT 0,
  locked_at TIMESTAMP,
  PRIMARY KEY (society_id, fy_label)
);

CREATE TABLE IF NOT EXISTS bill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  cycle_id UUID NOT NULL REFERENCES bill_cycle(id) ON DELETE CASCADE,
  bill_no VARCHAR(30) NOT NULL,
  subtotal_paise BIGINT NOT NULL DEFAULT 0,
  tax_paise BIGINT NOT NULL DEFAULT 0,
  adjustments_paise BIGINT NOT NULL DEFAULT 0,
  total_paise BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED', -- ISSUED|PARTIALLY_PAID|PAID|OVERDUE|CANCELLED
  due_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (cycle_id, flat_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_bill_no_per_society ON bill (society_id, bill_no);

CREATE TABLE IF NOT EXISTS bill_line (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bill(id) ON DELETE CASCADE,
  head_id UUID REFERENCES bill_head(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  qty NUMERIC(10,3) NOT NULL DEFAULT 1,
  rate_paise BIGINT NOT NULL,
  amount_paise BIGINT NOT NULL,
  tax_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  tax_paise BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS late_fee_rule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL, -- FLAT|PERCENT_PER_MONTH|PERCENT_PER_DAY
  value_paise BIGINT, -- for FLAT type
  percent NUMERIC(5,2), -- for PERCENT types
  grace_days INTEGER NOT NULL DEFAULT 0,
  cap_paise BIGINT, -- optional cap
  applies_to VARCHAR(20) NOT NULL DEFAULT 'ALL', -- ALL|BILL_TOTAL|PRINCIPAL
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Append-only per-flat hash-chained ledger
CREATE TABLE IF NOT EXISTS ledger_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  seq BIGINT NOT NULL,
  entry_type VARCHAR(20) NOT NULL,
  direction VARCHAR(6) NOT NULL, -- DEBIT|CREDIT
  amount_paise BIGINT NOT NULL,
  ref_type VARCHAR(30) NOT NULL, -- 'bill'|'payment'|'late_fee'|'adjustment'|'amenity_booking'
  ref_id UUID,
  reverses_entry_id UUID REFERENCES ledger_entry(id) ON DELETE RESTRICT,
  narration VARCHAR(500) NOT NULL,
  created_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  prev_hash VARCHAR(64) NOT NULL,
  hash VARCHAR(64) NOT NULL,
  UNIQUE (society_id, flat_id, seq)
);

-- Append-only triggers for ledger_entry (same pattern as audit_log)
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'ledger_entry is append-only: UPDATE, DELETE and TRUNCATE operations are strictly forbidden.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_ledger_modification ON ledger_entry;
CREATE TRIGGER trg_prevent_ledger_modification
BEFORE UPDATE OR DELETE ON ledger_entry
FOR EACH ROW
EXECUTE FUNCTION prevent_ledger_modification();

DROP TRIGGER IF EXISTS trg_prevent_ledger_truncate ON ledger_entry;
CREATE TRIGGER trg_prevent_ledger_truncate
BEFORE TRUNCATE ON ledger_entry
EXECUTE FUNCTION prevent_ledger_modification();

-- Gapless receipt number counter (locked row per society per financial year)
CREATE TABLE IF NOT EXISTS receipt_counter (
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  fy_label VARCHAR(10) NOT NULL, -- e.g. "2026-27"
  last_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (society_id, fy_label)
);

CREATE TABLE IF NOT EXISTS payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  receipt_no VARCHAR(30) NOT NULL,
  mode VARCHAR(20) NOT NULL DEFAULT 'CASH',
  amount_paise BIGINT NOT NULL,
  received_on DATE NOT NULL,
  received_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  received_from_name VARCHAR(100) NOT NULL,
  allocation_strategy VARCHAR(20) NOT NULL DEFAULT 'OLDEST_FIRST',
  note VARCHAR(255),
  status VARCHAR(10) NOT NULL DEFAULT 'RECORDED', -- RECORDED|VOIDED
  voided_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  void_reason TEXT,
  void_approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  session_id UUID, -- FK to cash_session
  idempotency_key VARCHAR(64),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_receipt_no_per_society ON payment (society_id, receipt_no);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_payment_idempotency ON payment (society_id, idempotency_key) WHERE status = 'RECORDED';

CREATE TABLE IF NOT EXISTS payment_allocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES bill(id) ON DELETE SET NULL,
  amount_paise BIGINT NOT NULL,
  kind VARCHAR(20) NOT NULL DEFAULT 'BILL' -- BILL|LATE_FEE|ADVANCE
);

CREATE TABLE IF NOT EXISTS cash_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  collector_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opened_at TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMP,
  expected_paise BIGINT,
  counted_paise BIGINT,
  variance_paise BIGINT,
  variance_note TEXT,
  deposited_paise BIGINT,
  deposit_ref VARCHAR(100),
  deposit_on DATE,
  deposit_slip_key TEXT,
  status VARCHAR(15) NOT NULL DEFAULT 'OPEN', -- OPEN|CLOSED|RECONCILED
  reconciled_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  reconciled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- FK from payment to cash_session
ALTER TABLE payment ADD COLUMN IF NOT EXISTS session_id_fk UUID REFERENCES cash_session(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS adjustment_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  type VARCHAR(15) NOT NULL, -- WAIVER|CREDIT_NOTE|REFUND|VOID|BILL_CANCEL
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  bill_id UUID REFERENCES bill(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payment(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  status VARCHAR(10) NOT NULL DEFAULT 'PENDING', -- PENDING|APPROVED|REJECTED
  approved_by UUID REFERENCES app_user(id) ON DELETE SET NULL,
  decided_at TIMESTAMP,
  decision_note TEXT,
  sole_approver_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_dispute (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  flat_id UUID NOT NULL REFERENCES flat(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payment(id) ON DELETE SET NULL,
  kind VARCHAR(25) NOT NULL, -- ENTRY_WRONG|PAID_NOT_RECORDED
  claim_amount_paise BIGINT,
  claim_date DATE,
  note TEXT NOT NULL,
  attachment_keys TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(15) NOT NULL DEFAULT 'OPEN', -- OPEN|UNDER_REVIEW|RESOLVED|REJECTED
  assigned_to UUID REFERENCES app_user(id) ON DELETE SET NULL,
  outcome_note TEXT,
  created_by UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Society settings rows for Phase 7 (will be upserted by the API on first load)
-- These are stored in the existing society_setting table (key/value pattern from Phase 5)

-- ==============================================================================
-- (D) COMPOSITE INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_amenity_society_active ON amenity(society_id, active);
CREATE INDEX IF NOT EXISTS idx_amenity_blackout_amenity ON amenity_blackout(amenity_id, from_at, to_at);
CREATE INDEX IF NOT EXISTS idx_amenity_closure_amenity ON amenity_closure(amenity_id, from_at, to_at);
CREATE INDEX IF NOT EXISTS idx_booking_amenity_status ON booking(amenity_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_flat ON booking(society_id, flat_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_society_status ON booking(society_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_hold_expires ON booking(hold_expires_at) WHERE status = 'AWAITING_PAYMENT';
CREATE INDEX IF NOT EXISTS idx_booking_event_booking ON booking_event(booking_id);
CREATE INDEX IF NOT EXISTS idx_slot_counter_amenity ON slot_counter(amenity_id, slot_start);

CREATE INDEX IF NOT EXISTS idx_bill_flat ON bill(society_id, flat_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_cycle ON bill(cycle_id, status);
CREATE INDEX IF NOT EXISTS idx_bill_overdue ON bill(society_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_ledger_flat_seq ON ledger_entry(society_id, flat_id, seq);
CREATE INDEX IF NOT EXISTS idx_payment_flat ON payment(society_id, flat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_payment_session ON payment(session_id_fk);
CREATE INDEX IF NOT EXISTS idx_cash_session_collector ON cash_session(society_id, collector_id, date);
CREATE INDEX IF NOT EXISTS idx_cash_session_open ON cash_session(society_id, status) WHERE status = 'OPEN';
CREATE INDEX IF NOT EXISTS idx_adjustment_request_society ON adjustment_request(society_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_dispute_society ON payment_dispute(society_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_dispute_flat ON payment_dispute(society_id, flat_id);

-- ==============================================================================
-- (E) ROW LEVEL SECURITY POLICIES
-- ==============================================================================

ALTER TABLE amenity ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_blackout ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenity_closure ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_head ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_cycle ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_fee_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_number_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocation ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_session ENABLE ROW LEVEL SECURITY;
ALTER TABLE adjustment_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_dispute ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amenity_tenant_isolation') THEN
    CREATE POLICY amenity_tenant_isolation ON amenity USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amenity_blackout_tenant_isolation') THEN
    CREATE POLICY amenity_blackout_tenant_isolation ON amenity_blackout USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'amenity_closure_tenant_isolation') THEN
    CREATE POLICY amenity_closure_tenant_isolation ON amenity_closure USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'booking_tenant_isolation') THEN
    CREATE POLICY booking_tenant_isolation ON booking USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'booking_event_tenant_isolation') THEN
    CREATE POLICY booking_event_tenant_isolation ON booking_event USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bill_head_tenant_isolation') THEN
    CREATE POLICY bill_head_tenant_isolation ON bill_head USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bill_cycle_tenant_isolation') THEN
    CREATE POLICY bill_cycle_tenant_isolation ON bill_cycle USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bill_tenant_isolation') THEN
    CREATE POLICY bill_tenant_isolation ON bill USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'late_fee_rule_tenant_isolation') THEN
    CREATE POLICY late_fee_rule_tenant_isolation ON late_fee_rule USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'ledger_entry_tenant_isolation') THEN
    CREATE POLICY ledger_entry_tenant_isolation ON ledger_entry USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'receipt_counter_tenant_isolation') THEN
    CREATE POLICY receipt_counter_tenant_isolation ON receipt_counter USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'bill_number_counter_tenant_isolation') THEN
    CREATE POLICY bill_number_counter_tenant_isolation ON bill_number_counter USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payment_tenant_isolation') THEN
    CREATE POLICY payment_tenant_isolation ON payment USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'cash_session_tenant_isolation') THEN
    CREATE POLICY cash_session_tenant_isolation ON cash_session USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'adjustment_request_tenant_isolation') THEN
    CREATE POLICY adjustment_request_tenant_isolation ON adjustment_request USING (check_tenant_access(society_id));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'payment_dispute_tenant_isolation') THEN
    CREATE POLICY payment_dispute_tenant_isolation ON payment_dispute USING (check_tenant_access(society_id));
  END IF;
END $$;
