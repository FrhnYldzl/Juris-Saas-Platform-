-- Pazarlama · İçerik Stüdyosu için ContentItem metrik + SEO alanları.

ALTER TABLE "content_items"
  ADD COLUMN "body"             TEXT,
  ADD COLUMN "content_type"     TEXT,
  ADD COLUMN "read_minutes"     INTEGER,
  ADD COLUMN "view_count"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lead_count"       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "engagement_pct"   INTEGER,
  ADD COLUMN "seo_rank"         INTEGER,
  ADD COLUMN "backlinks"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "meta_title"       TEXT,
  ADD COLUMN "meta_description" TEXT,
  ADD COLUMN "keywords"         TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "ai_assisted"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "draft_version"    INTEGER;
