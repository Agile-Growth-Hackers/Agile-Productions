-- Performance Optimization: Add indexes for frequently queried columns
-- Run this with: npx wrangler d1 execute agile-productions-db --remote --file=migrations/0005_add_performance_indexes.sql

-- Index for cross-table r2_key lookups (used in delete operations to check if image is used elsewhere)
CREATE INDEX IF NOT EXISTS idx_slider_images_r2_key ON slider_images(r2_key);
CREATE INDEX IF NOT EXISTS idx_gallery_images_r2_key ON gallery_images(r2_key);
CREATE INDEX IF NOT EXISTS idx_client_logos_r2_key ON client_logos(r2_key);
CREATE INDEX IF NOT EXISTS idx_image_storage_r2_key ON image_storage(r2_key);

-- Index for category lookups in image_storage
CREATE INDEX IF NOT EXISTS idx_image_storage_category ON image_storage(category);

-- Composite index for active images ordered by display_order (most common query)
CREATE INDEX IF NOT EXISTS idx_slider_active_order ON slider_images(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_active_order ON gallery_images(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_logos_active_order ON client_logos(is_active, display_order);

-- Index for mobile visibility queries in gallery
CREATE INDEX IF NOT EXISTS idx_gallery_mobile_visible ON gallery_images(is_active, mobile_visible, display_order);

-- Index for activity logs queries (by admin, by type, by date)
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(created_at DESC);

-- Index for admin username lookup (login)
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
