-- Migration: Add region support to existing content tables
-- This migration adds region_code column to slider_images, gallery_images, client_logos, and image_storage
-- Run with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0007_add_region_support.sql

-- Add region_code VARCHAR(5) to support ISO country codes (IN, AE, etc.)
ALTER TABLE slider_images ADD COLUMN region_code VARCHAR(5);
ALTER TABLE gallery_images ADD COLUMN region_code VARCHAR(5);
ALTER TABLE client_logos ADD COLUMN region_code VARCHAR(5);
ALTER TABLE image_storage ADD COLUMN region_code VARCHAR(5);

-- Add composite indexes for performance
CREATE INDEX IF NOT EXISTS idx_slider_region_active_order
  ON slider_images(region_code, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_gallery_region_active_order
  ON gallery_images(region_code, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_gallery_region_mobile_visible
  ON gallery_images(region_code, is_active, mobile_visible, display_order);

CREATE INDEX IF NOT EXISTS idx_logos_region_active_order
  ON client_logos(region_code, is_active, display_order);

CREATE INDEX IF NOT EXISTS idx_storage_region_category
  ON image_storage(region_code, category);
