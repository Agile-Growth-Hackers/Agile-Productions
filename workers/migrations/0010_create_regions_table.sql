-- Migration: Create regions table for multi-region support
-- This migration creates the central regions table that tracks all available regions
-- Run with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0010_create_regions_table.sql

CREATE TABLE IF NOT EXISTS regions (
  code VARCHAR(5) PRIMARY KEY,  -- ISO country code (IN, AE, US, GB, etc.)
  name VARCHAR(100) NOT NULL,    -- Full country/region name
  domain VARCHAR(255),            -- Optional custom domain (e.g., agileproductions.ae)
  route VARCHAR(50),              -- Optional route path (e.g., /en-us)
  is_active BOOLEAN DEFAULT 1,   -- Whether region is currently active
  is_default BOOLEAN DEFAULT 0,  -- Whether this is the default region
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ensure only one default region
CREATE UNIQUE INDEX IF NOT EXISTS idx_regions_default
  ON regions(is_default) WHERE is_default = 1;

-- Index for active regions lookup
CREATE INDEX IF NOT EXISTS idx_regions_active
  ON regions(is_active, is_default DESC, name);

-- Seed initial regions (India and UAE)
INSERT OR IGNORE INTO regions (code, name, domain, route, is_active, is_default) VALUES
  ('IN', 'India', 'agileproductions.in', NULL, 1, 1),
  ('AE', 'United Arab Emirates', 'agileproductions.ae', NULL, 1, 0);
