-- Migration: Add region assignment to admins table
-- This migration adds assigned_regions column to admins table for region-based access control
-- Run with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0008_add_admin_regions.sql

-- Add assigned_regions column (JSON array stored as TEXT)
-- NULL for super admins (access all regions), JSON array for regular admins
ALTER TABLE admins ADD COLUMN assigned_regions TEXT;

-- Backfill existing users
-- Super admins get NULL (access to all regions)
UPDATE admins SET assigned_regions = NULL WHERE is_super_admin = 1;

-- Regular admins get '["IN"]' by default (India access)
UPDATE admins SET assigned_regions = '["IN"]' WHERE is_super_admin = 0 AND assigned_regions IS NULL;

-- Create index for faster region lookup
CREATE INDEX IF NOT EXISTS idx_admins_regions ON admins(assigned_regions);
