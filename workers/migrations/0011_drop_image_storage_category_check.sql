-- Migration: Drop restrictive CHECK constraint on image_storage.category
-- The original constraint whitelisted only 5 categories which blocks new
-- section additions (motorsports, crew, etc.). Application code is the
-- authoritative source for valid categories.
-- Run with:
--   npx wrangler d1 execute agile-productions-db --remote --file=migrations/0011_drop_image_storage_category_check.sql

CREATE TABLE image_storage_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  cdn_url TEXT NOT NULL,
  cdn_url_mobile TEXT,
  category TEXT NOT NULL,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO image_storage_new (id, filename, r2_key, cdn_url, cdn_url_mobile, category, file_size, width, height, created_at)
SELECT id, filename, r2_key, cdn_url, cdn_url_mobile, category, file_size, width, height, created_at
FROM image_storage;

DROP TABLE image_storage;

ALTER TABLE image_storage_new RENAME TO image_storage;

CREATE INDEX IF NOT EXISTS idx_image_storage_category ON image_storage(category);
CREATE INDEX IF NOT EXISTS idx_image_storage_r2_key ON image_storage(r2_key);
