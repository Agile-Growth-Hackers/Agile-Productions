-- 0013: Reconcile live services/team_members schema with application code.
--
-- The live `services` and `team_members` tables predated 0009, whose
-- `CREATE TABLE IF NOT EXISTS` was therefore a no-op. The public endpoints
-- (`/api/services`, `/api/team`) and the admin write paths query columns
-- (icon_cdn_url[_mobile], icon_r2_key, position, photo_cdn_url[_mobile],
-- photo_r2_key) that the live tables never had, causing HTTP 500s.
--
-- Both tables are empty in production, so dropping and recreating them to
-- match 0009 is lossless and fully reconciles the schema.

DROP TABLE IF EXISTS services;
CREATE TABLE services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_r2_key VARCHAR(255),
  icon_cdn_url TEXT,
  icon_cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_services_region_active_order
  ON services(region_code, is_active, display_order);

DROP TABLE IF EXISTS team_members;
CREATE TABLE team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100),
  bio TEXT,
  photo_r2_key VARCHAR(255),
  photo_cdn_url TEXT,
  photo_cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_team_region_active_order
  ON team_members(region_code, is_active, display_order);
