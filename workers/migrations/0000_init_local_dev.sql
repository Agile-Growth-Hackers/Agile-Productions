-- Initial schema for local development
-- This creates all the base tables needed

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  full_name TEXT,
  is_super_admin INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  profile_picture_r2_key TEXT,
  profile_picture_cdn_url TEXT,
  assigned_regions TEXT, -- JSON array of region codes
  is_test_account INTEGER DEFAULT 0,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER NOT NULL,
  admin_username TEXT,
  action_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  old_values TEXT,
  new_values TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);

-- Image storage
CREATE TABLE IF NOT EXISTS image_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  cdn_url TEXT,
  cdn_url_mobile TEXT,
  category TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  uploaded_by INTEGER,
  region_code TEXT DEFAULT 'IN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES admins(id)
);

-- Slider images
CREATE TABLE IF NOT EXISTS slider_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  object_position TEXT DEFAULT 'center center',
  is_active INTEGER DEFAULT 1,
  region_code TEXT DEFAULT 'IN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Gallery images
CREATE TABLE IF NOT EXISTS gallery_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  mobile_visible INTEGER DEFAULT 1,
  is_active INTEGER DEFAULT 1,
  region_code TEXT DEFAULT 'IN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Client logos
CREATE TABLE IF NOT EXISTS client_logos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  cdn_url_mobile TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  region_code TEXT DEFAULT 'IN',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Page content
CREATE TABLE IF NOT EXISTS page_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT NOT NULL DEFAULT 'IN',
  content_key TEXT NOT NULL,
  content_text TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region_code, content_key)
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT NOT NULL DEFAULT 'IN',
  title TEXT NOT NULL,
  description TEXT,
  icon_r2_key TEXT,
  icon_cdn_url TEXT,
  icon_cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT NOT NULL DEFAULT 'IN',
  name TEXT NOT NULL,
  position TEXT,
  bio TEXT,
  photo_r2_key TEXT,
  photo_cdn_url TEXT,
  photo_cdn_url_mobile TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Section images
CREATE TABLE IF NOT EXISTS section_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region_code TEXT NOT NULL DEFAULT 'IN',
  section_key TEXT NOT NULL,
  filename TEXT,
  r2_key TEXT,
  cdn_url TEXT,
  cdn_url_mobile TEXT,
  alt_text TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region_code, section_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin ON activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_storage_category ON image_storage(category);
CREATE INDEX IF NOT EXISTS idx_image_storage_region ON image_storage(region_code);
CREATE INDEX IF NOT EXISTS idx_slider_order ON slider_images(region_code, display_order);
CREATE INDEX IF NOT EXISTS idx_gallery_order ON gallery_images(region_code, display_order);
CREATE INDEX IF NOT EXISTS idx_logos_order ON client_logos(region_code, display_order);
CREATE INDEX IF NOT EXISTS idx_page_content_region ON page_content(region_code);
CREATE INDEX IF NOT EXISTS idx_services_region_order ON services(region_code, display_order);
CREATE INDEX IF NOT EXISTS idx_team_region_order ON team_members(region_code, display_order);
