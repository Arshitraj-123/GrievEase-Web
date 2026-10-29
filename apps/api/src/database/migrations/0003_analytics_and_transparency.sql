-- ==============================================================================
-- GrievEase Phase 4 Analytics & Transparency Migration
-- Includes:
-- 1. Pre-aggregation tables with society_id and Row Level Security (RLS)
-- 2. Performance indexes for sub-300ms queries at scale
-- 3. Society slug and timezone columns
-- 4. Default society settings for analytics and privacy
-- ==============================================================================

-- 1. Extend Society with Slug & Timezone
ALTER TABLE society ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE;
ALTER TABLE society ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata';

-- Backfill slug from code if null
UPDATE society SET slug = LOWER(code) WHERE slug IS NULL;

-- 2. Pre-Aggregation Table: grievance_daily_agg
CREATE TABLE IF NOT EXISTS grievance_daily_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  priority VARCHAR(20) NOT NULL,
  level INTEGER NOT NULL,
  submitted INTEGER NOT NULL DEFAULT 0,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  resolved INTEGER NOT NULL DEFAULT 0,
  closed INTEGER NOT NULL DEFAULT 0,
  escalated INTEGER NOT NULL DEFAULT 0,
  reopened INTEGER NOT NULL DEFAULT 0,
  appeals INTEGER NOT NULL DEFAULT 0,
  resolution_minutes_sum BIGINT NOT NULL DEFAULT 0,
  resolution_count INTEGER NOT NULL DEFAULT 0,
  ack_minutes_sum BIGINT NOT NULL DEFAULT 0,
  ack_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_grievance_daily_agg UNIQUE (society_id, date, category_id, priority, level)
);

-- 3. Pre-Aggregation Table: level_time_agg
CREATE TABLE IF NOT EXISTS level_time_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  level INTEGER NOT NULL,
  minutes_sum BIGINT NOT NULL DEFAULT 0,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_level_time_agg UNIQUE (society_id, date, level)
);

-- 4. Pre-Aggregation Table: resolver_daily_agg
CREATE TABLE IF NOT EXISTS resolver_daily_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  assigned INTEGER NOT NULL DEFAULT 0,
  acknowledged INTEGER NOT NULL DEFAULT 0,
  resolved INTEGER NOT NULL DEFAULT 0,
  breaches_while_assigned INTEGER NOT NULL DEFAULT 0,
  reopened INTEGER NOT NULL DEFAULT 0,
  ack_minutes_sum BIGINT NOT NULL DEFAULT 0,
  resolution_minutes_sum BIGINT NOT NULL DEFAULT 0,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  open_load_end_of_day INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_resolver_daily_agg UNIQUE (society_id, date, user_id, level)
);

-- 5. Pre-Aggregation Table: rating_daily_agg
CREATE TABLE IF NOT EXISTS rating_daily_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  rating_1_count INTEGER NOT NULL DEFAULT 0,
  rating_2_count INTEGER NOT NULL DEFAULT 0,
  rating_3_count INTEGER NOT NULL DEFAULT 0,
  rating_4_count INTEGER NOT NULL DEFAULT 0,
  rating_5_count INTEGER NOT NULL DEFAULT 0,
  rating_sum INTEGER NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_rating_daily_agg UNIQUE (society_id, date, category_id)
);

-- 6. Pre-Aggregation Table: wing_daily_agg (Named grievances only; flat_id IS NOT NULL)
CREATE TABLE IF NOT EXISTS wing_daily_agg (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES society(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wing_id UUID NOT NULL REFERENCES wing(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  submitted INTEGER NOT NULL DEFAULT 0,
  resolved INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_wing_daily_agg UNIQUE (society_id, date, wing_id, category_id)
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & EXPLAIN OPTIMIZATION
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_grievance_daily_agg_society_date ON grievance_daily_agg(society_id, date);
CREATE INDEX IF NOT EXISTS idx_grievance_daily_agg_cat_date ON grievance_daily_agg(society_id, category_id, date);
CREATE INDEX IF NOT EXISTS idx_grievance_daily_agg_level_date ON grievance_daily_agg(society_id, level, date);

CREATE INDEX IF NOT EXISTS idx_level_time_agg_society_date ON level_time_agg(society_id, date, level);

CREATE INDEX IF NOT EXISTS idx_resolver_daily_agg_user_date ON resolver_daily_agg(society_id, user_id, date);
CREATE INDEX IF NOT EXISTS idx_resolver_daily_agg_level_date ON resolver_daily_agg(society_id, level, date);

CREATE INDEX IF NOT EXISTS idx_rating_daily_agg_cat_date ON rating_daily_agg(society_id, category_id, date);

CREATE INDEX IF NOT EXISTS idx_wing_daily_agg_lookup ON wing_daily_agg(society_id, wing_id, category_id, date);

-- Index on raw tables for rapid aggregate computation
CREATE INDEX IF NOT EXISTS idx_grievance_society_created_at ON grievance(society_id, created_at);
CREATE INDEX IF NOT EXISTS idx_grievance_society_resolved_at ON grievance(society_id, resolved_at) WHERE resolved_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievance_society_status_level ON grievance(society_id, status, current_level);
CREATE INDEX IF NOT EXISTS idx_grievance_event_type_created ON grievance_event(grievance_id, event_type, created_at);
CREATE INDEX IF NOT EXISTS idx_rating_society_created ON rating(society_id, created_at);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE grievance_daily_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_time_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolver_daily_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_daily_agg ENABLE ROW LEVEL SECURITY;
ALTER TABLE wing_daily_agg ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS grievance_daily_agg_tenant_policy ON grievance_daily_agg;
CREATE POLICY grievance_daily_agg_tenant_policy ON grievance_daily_agg FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS level_time_agg_tenant_policy ON level_time_agg;
CREATE POLICY level_time_agg_tenant_policy ON level_time_agg FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS resolver_daily_agg_tenant_policy ON resolver_daily_agg;
CREATE POLICY resolver_daily_agg_tenant_policy ON resolver_daily_agg FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS rating_daily_agg_tenant_policy ON rating_daily_agg;
CREATE POLICY rating_daily_agg_tenant_policy ON rating_daily_agg FOR ALL USING (check_tenant_access(society_id));

DROP POLICY IF EXISTS wing_daily_agg_tenant_policy ON wing_daily_agg;
CREATE POLICY wing_daily_agg_tenant_policy ON wing_daily_agg FOR ALL USING (check_tenant_access(society_id));

-- ==============================================================================
-- DEFAULT SOCIETY SETTINGS FOR PHASE 4 ANALYTICS
-- ==============================================================================
INSERT INTO society_setting (society_id, key, value)
SELECT s.id, v.key, v.value
FROM society s
CROSS JOIN (VALUES
  ('public_dashboard_visibility', 'RESIDENTS_ONLY'),
  ('public_dashboard_enabled', 'true'),
  ('min_cell_size', '5'),
  ('perf_threshold_excellent', '90'),
  ('perf_threshold_on_track', '75')
) AS v(key, value)
ON CONFLICT (society_id, key) DO NOTHING;
