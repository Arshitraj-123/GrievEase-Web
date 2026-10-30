-- 0008_remove_marathi_archive.sql
-- GrievEase Migration: Archive all Marathi content to legacy_marathi_content,
-- migrate 'mr' users to 'hi', and drop *_mr columns across all tables.

-- 1. Create Non-Exposed Archival Table
CREATE TABLE IF NOT EXISTS legacy_marathi_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table VARCHAR(100) NOT NULL,
  record_id VARCHAR(100) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  content TEXT,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protect archival table from public exposure via RLS (No policy granted to app users)
ALTER TABLE legacy_marathi_content ENABLE ROW LEVEL SECURITY;

-- 2. Safely Archive Existing Marathi Content Prior to Column Removal
DO $$
BEGIN
  -- Category names
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'category' AND column_name = 'name_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'category', id::text, 'name_mr', name_mr FROM category WHERE name_mr IS NOT NULL AND name_mr <> '';
  END IF;

  -- Notice Categories
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notice_category' AND column_name = 'name_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'notice_category', id::text, 'name_mr', name_mr FROM notice_category WHERE name_mr IS NOT NULL AND name_mr <> '';
  END IF;

  -- Poll Options
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'poll_option' AND column_name = 'label_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'poll_option', id::text, 'label_mr', label_mr FROM poll_option WHERE label_mr IS NOT NULL AND label_mr <> '';
  END IF;

  -- Amenities
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amenity' AND column_name = 'name_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'amenity', id::text, 'name_mr', name_mr FROM amenity WHERE name_mr IS NOT NULL AND name_mr <> '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amenity' AND column_name = 'description_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'amenity', id::text, 'description_mr', description_mr FROM amenity WHERE description_mr IS NOT NULL AND description_mr <> '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'amenity' AND column_name = 'rules_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'amenity', id::text, 'rules_mr', rules_mr FROM amenity WHERE rules_mr IS NOT NULL AND rules_mr <> '';
  END IF;

  -- Billing Heads
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'billing_head' AND column_name = 'name_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'billing_head', id::text, 'name_mr', name_mr FROM billing_head WHERE name_mr IS NOT NULL AND name_mr <> '';
  END IF;

  -- CMS FAQs
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_faq' AND column_name = 'question_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'cms_faq', id::text, 'question_mr', question_mr FROM cms_faq WHERE question_mr IS NOT NULL AND question_mr <> '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cms_faq' AND column_name = 'answer_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'cms_faq', id::text, 'answer_mr', answer_mr FROM cms_faq WHERE answer_mr IS NOT NULL AND answer_mr <> '';
  END IF;

  -- Site Settings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_setting' AND column_name = 'value_mr') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'site_setting', key || ':' || COALESCE(society_id::text, 'global'), 'value_mr', value_mr FROM site_setting WHERE value_mr IS NOT NULL AND value_mr <> '';
  END IF;

  -- Notice Translations with lang = 'mr'
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notice_translation') THEN
    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'notice_translation', id::text, 'title', title FROM notice_translation WHERE lang = 'mr';

    INSERT INTO legacy_marathi_content (source_table, record_id, field_name, content)
    SELECT 'notice_translation', id::text, 'body', body FROM notice_translation WHERE lang = 'mr';
  END IF;
END $$;

-- 3. Migrate Users with 'mr' to 'hi'
UPDATE app_user SET language = 'hi' WHERE language = 'mr';

-- Delete 'mr' rows from notice translations
DELETE FROM notice_translation WHERE lang = 'mr';

-- 4. Drop Marathi Columns
ALTER TABLE category DROP COLUMN IF EXISTS name_mr;
ALTER TABLE notice_category DROP COLUMN IF EXISTS name_mr;
ALTER TABLE poll_option DROP COLUMN IF EXISTS label_mr;
ALTER TABLE amenity DROP COLUMN IF EXISTS name_mr;
ALTER TABLE amenity DROP COLUMN IF EXISTS description_mr;
ALTER TABLE amenity DROP COLUMN IF EXISTS rules_mr;
ALTER TABLE billing_head DROP COLUMN IF EXISTS name_mr;
ALTER TABLE cms_faq DROP COLUMN IF EXISTS question_mr;
ALTER TABLE cms_faq DROP COLUMN IF EXISTS answer_mr;
ALTER TABLE site_setting DROP COLUMN IF EXISTS value_mr;

-- 5. Add Check Constraints Restricting Language to 'en' or 'hi'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_app_user_language') THEN
    ALTER TABLE app_user ADD CONSTRAINT chk_app_user_language CHECK (language IN ('en', 'hi'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_notice_translation_lang') THEN
    ALTER TABLE notice_translation ADD CONSTRAINT chk_notice_translation_lang CHECK (lang IN ('en', 'hi'));
  END IF;
END $$;

