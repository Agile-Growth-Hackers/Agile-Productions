-- Add is_test_account flag to admins table
-- This allows us to hide test accounts from the dashboard and protect them from deletion
-- Run with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0006_add_test_account_flag.sql

-- Add column
ALTER TABLE admins ADD COLUMN is_test_account BOOLEAN DEFAULT 0;

-- Mark existing test accounts
UPDATE admins SET is_test_account = 1 WHERE username IN ('test-admin', 'test-superadmin');

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_admins_test_account ON admins(is_test_account);
