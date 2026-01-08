@echo off
SET CLOUDFLARE_ACCOUNT_ID=a80eabbb536a884ecd8ba3dc123bee10

echo Seeding page content for IN region...

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'hero_title', 'HOME OF^<br /^>VISUAL CONTENT^<br /^>BUILT TO RACE.');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'about_title', 'About Us');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'about_tagline', 'We Are Speed Chasers, Storytellers, And Visual Engineers For The Fast Lane.');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'about_paragraph_1', 'Born at the crossroads of horsepower and creativity, we live and breathe motorsports. From roaring circuits to adrenaline-fueled rallies, we capture the speed, drama, and soul of every event—frame by frame.');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'about_paragraph_2', 'We don''t just film; we engineer visual experiences that put you in the driver''s seat. Whether it''s a high-octane race weekend, a slick automotive ad, or brand-defining motorsport content, we deliver cinematic storytelling built for the fast lane.');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'footer_phone', '+91 86086 86286');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'footer_email', 'hello@agilegrowthhackers.in');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'footer_address', '213, 2nd Floor, Ramnashree Arcade, MG Road, Bangalore - 560001');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('IN', 'footer_copyright', 'Copyright @ AgileGrowthHackers2025');"

echo Seeding page content for AE region...

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'hero_title', 'HOME OF^<br /^>VISUAL CONTENT^<br /^>BUILT TO RACE.');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'about_title', 'About Us');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'footer_phone', '+971 XX XXX XXXX');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'footer_email', 'hello@agileproductions.ae');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'footer_address', 'Dubai, United Arab Emirates');"

call npx wrangler d1 execute agile-productions-db --remote --command "INSERT OR IGNORE INTO page_content (region_code, content_key, content_text) VALUES ('AE', 'footer_copyright', 'Copyright @ Agile Productions 2025');"

echo Done!
