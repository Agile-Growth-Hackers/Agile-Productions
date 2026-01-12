-- Migration: Create new content management tables
-- This migration creates tables for page content, services, team members, and section images
-- Run with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0009_create_content_tables.sql

-- Text content table (hero tagline, about, footer, etc.)
CREATE TABLE IF NOT EXISTS page_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  content_key VARCHAR(50) NOT NULL, -- 'hero_tagline', 'about_text', 'footer_text', etc.
  content_text TEXT, -- Rich text content
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_page_content_region_key
  ON page_content(region_code, content_key);

-- Services table (region-specific services)
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  icon_r2_key VARCHAR(255), -- R2 key for service icon/image
  icon_cdn_url TEXT,
  icon_cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_services_region_active_order
  ON services(region_code, is_active, display_order);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(100), -- Job title/role
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

-- Section images table (about background, general assets)
CREATE TABLE IF NOT EXISTS section_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code VARCHAR(5) NOT NULL,
  section_key VARCHAR(50) NOT NULL, -- 'about_background', 'general_asset_1', etc.
  filename VARCHAR(255),
  r2_key VARCHAR(255),
  cdn_url TEXT,
  cdn_url_mobile TEXT,
  alt_text VARCHAR(255),
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_section_images_region_key
  ON section_images(region_code, section_key);
