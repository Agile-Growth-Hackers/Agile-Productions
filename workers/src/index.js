import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import { requireSuperAdmin } from './middleware/rbac.js';
import { publicRateLimit, adminRateLimit } from './middleware/rate-limit.js';
import { activityLoggerMiddleware } from './utils/activity-logger.js';
import { isMobileDevice, transformForDevice } from './utils/device-detection.js';
import { securityHeadersMiddleware } from './middleware/security-headers.js';
import { httpsEnforcementMiddleware } from './middleware/https-enforcement.js';
import { requestSizeLimitMiddleware } from './middleware/request-size-limit.js';
import { sentryInitMiddleware } from './middleware/sentry-init.js';
import { csrfProtection } from './middleware/csrf.js';
import { regionMiddleware } from './middleware/region.js';
import authRoutes from './routes/auth.js';
import storageRoutes from './routes/storage.js';
import sliderRoutes from './routes/slider.js';
import galleryRoutes from './routes/gallery.js';
import logosRoutes from './routes/logos.js';
import usageRoutes from './routes/usage.js';
import usersRoutes from './routes/users.js';
import activityLogsRoutes from './routes/activity-logs.js';
import profileRoutes from './routes/profile.js';
import regionRoutes from './routes/regions.js';
import pageContentRoutes from './routes/page-content.js';
import servicesRoutes from './routes/services.js';
import teamRoutes from './routes/team.js';
import sectionImagesRoutes from './routes/section-images.js';

const app = new Hono();

// Initialize Sentry error tracking (must be first to access env)
app.use('*', sentryInitMiddleware);

// Apply HTTPS enforcement (redirects HTTP to HTTPS)
app.use('*', httpsEnforcementMiddleware);

// Apply security headers to all routes
app.use('*', securityHeadersMiddleware);

// Apply CORS to all routes
app.use('*', corsMiddleware);

// Apply region detection to all routes (must be after CORS to access Origin header)
app.use('*', regionMiddleware);

// Apply request size limits to all routes
app.use('*', requestSizeLimitMiddleware);

// Apply rate limiting to public API routes
app.use('/api/slider', publicRateLimit);
app.use('/api/gallery*', publicRateLimit);
app.use('/api/logos', publicRateLimit);

// API Version header
app.use('/api/*', (c, next) => {
  c.header('X-API-Version', 'v1');
  return next();
});

// Public routes - no authentication required
// v1 API (versioned) - with region filtering
app.get('/api/v1/slider', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);
    const { results } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, object_position, display_order FROM slider_images WHERE is_active = 1 AND (region_code = ? OR region_code IS NULL) ORDER BY display_order'
    ).bind(region).all();
    const transformedResults = transformForDevice(results, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

// Legacy route (backwards compatibility) - with region filtering
app.get('/api/slider', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);

    // First, check if region-specific slides exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, object_position, display_order FROM slider_images WHERE is_active = 1 AND region_code = ? ORDER BY display_order'
    ).bind(region).all();

    // If region-specific slides exist, return only those
    if (regionSpecific.length > 0) {
      const transformedResults = transformForDevice(regionSpecific, isMobile);
      return c.json(transformedResults);
    }

    // Otherwise, fallback to shared (NULL) slides
    const { results: shared } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, object_position, display_order FROM slider_images WHERE is_active = 1 AND region_code IS NULL ORDER BY display_order'
    ).all();
    const transformedResults = transformForDevice(shared, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

// v1 Gallery endpoint - with region filtering
app.get('/api/v1/gallery', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);

    // First, check if region-specific images exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code = ? ORDER BY display_order'
    ).bind(region).all();

    // If region-specific images exist, return only those
    if (regionSpecific.length > 0) {
      const transformedResults = transformForDevice(regionSpecific, isMobile);
      return c.json(transformedResults);
    }

    // Otherwise, fallback to shared (NULL) images
    const { results: shared } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code IS NULL ORDER BY display_order'
    ).all();
    const transformedResults = transformForDevice(shared, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

// Legacy gallery route - with region filtering
app.get('/api/gallery', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);

    // First, check if region-specific images exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code = ? ORDER BY display_order'
    ).bind(region).all();

    // If region-specific images exist, return only those
    if (regionSpecific.length > 0) {
      const transformedResults = transformForDevice(regionSpecific, isMobile);
      return c.json(transformedResults);
    }

    // Otherwise, fallback to shared (NULL) images
    const { results: shared } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code IS NULL ORDER BY display_order'
    ).all();
    const transformedResults = transformForDevice(shared, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.get('/api/gallery/mobile', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = true; // This endpoint is specifically for mobile

    // First, check if region-specific images exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code = ? AND mobile_visible = 1 ORDER BY display_order LIMIT 10'
    ).bind(region).all();

    // If region-specific images exist, return only those
    if (regionSpecific.length > 0) {
      const transformedResults = transformForDevice(regionSpecific, isMobile);
      return c.json(transformedResults);
    }

    // Otherwise, fallback to shared (NULL) images
    const { results: shared } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, display_order FROM gallery_images WHERE is_active = 1 AND region_code IS NULL AND mobile_visible = 1 ORDER BY display_order LIMIT 10'
    ).all();
    const transformedResults = transformForDevice(shared, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.get('/api/logos', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);

    // First, check if region-specific logos exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, alt_text, display_order FROM client_logos WHERE is_active = 1 AND region_code = ? ORDER BY display_order'
    ).bind(region).all();

    // If region-specific logos exist, return only those
    if (regionSpecific.length > 0) {
      const transformedResults = transformForDevice(regionSpecific, isMobile);
      return c.json(transformedResults);
    }

    // Otherwise, fallback to shared (NULL) logos
    const { results: shared } = await db.prepare(
      'SELECT id, cdn_url, cdn_url_mobile, alt_text, display_order FROM client_logos WHERE is_active = 1 AND region_code IS NULL ORDER BY display_order'
    ).all();
    const transformedResults = transformForDevice(shared, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch logos' }, 500);
  }
});

// New public content endpoints - region-filtered
app.get('/api/page-content', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const { results } = await db.prepare(
      'SELECT content_key, content_text FROM page_content WHERE region_code = ? AND is_active = 1'
    ).bind(region).all();

    // Transform to object: { hero_tagline: "...", about_text: "...", ... }
    const content = results.reduce((acc, row) => {
      acc[row.content_key] = row.content_text;
      return acc;
    }, {});

    return c.json(content);
  } catch (error) {
    return c.json({ error: 'Failed to fetch page content' }, 500);
  }
});

app.get('/api/services', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);
    const { results } = await db.prepare(
      'SELECT id, title, description, icon_cdn_url, icon_cdn_url_mobile, display_order ' +
      'FROM services WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();

    const transformedResults = transformForDevice(results, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch services' }, 500);
  }
});

app.get('/api/team', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);
    const { results } = await db.prepare(
      'SELECT id, name, position, bio, photo_cdn_url, photo_cdn_url_mobile, display_order ' +
      'FROM team_members WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();

    const transformedResults = transformForDevice(results, isMobile);
    return c.json(transformedResults);
  } catch (error) {
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

app.get('/api/section-images', async (c) => {
  try {
    const db = c.env.DB;
    const region = c.get('region');
    const isMobile = isMobileDevice(c.req.raw);
    const { results } = await db.prepare(
      'SELECT section_key, cdn_url, cdn_url_mobile, alt_text FROM section_images ' +
      'WHERE region_code = ? AND is_active = 1'
    ).bind(region).all();

    // Transform to object: { about_background: { url: "...", alt: "..." }, ... }
    const images = results.reduce((acc, row) => {
      acc[row.section_key] = {
        url: isMobile && row.cdn_url_mobile ? row.cdn_url_mobile : row.cdn_url,
        alt: row.alt_text
      };
      return acc;
    }, {});

    return c.json(images);
  } catch (error) {
    return c.json({ error: 'Failed to fetch section images' }, 500);
  }
});

// Auth routes (login doesn't need auth middleware)
app.route('/api/auth', authRoutes);

// Protected admin routes - apply auth, CSRF, rate limiting, and activity logging middleware
app.use('/api/admin/*', authMiddleware); // Checks JWT validity and isActive from token
app.use('/api/admin/*', csrfProtection); // CSRF protection for state-changing requests
app.use('/api/admin/*', adminRateLimit); // Rate limit: 300 req/min per user
app.use('/api/admin/*', activityLoggerMiddleware); // Adds logging helper

// Super admin only routes (apply before registering routes)
app.use('/api/admin/users/*', requireSuperAdmin);
app.use('/api/admin/activity-logs/*', requireSuperAdmin);

// Register v1 admin routes
app.route('/api/v1/admin/users', usersRoutes);
app.route('/api/v1/admin/activity-logs', activityLogsRoutes);
app.route('/api/v1/admin/profile', profileRoutes);
app.route('/api/v1/admin/storage', storageRoutes);
app.route('/api/v1/admin/slider', sliderRoutes);
app.route('/api/v1/admin/gallery', galleryRoutes);
app.route('/api/v1/admin/logos', logosRoutes);
app.route('/api/v1/admin/usage', usageRoutes);
app.route('/api/v1/admin/page-content', pageContentRoutes);
app.route('/api/v1/admin/services', servicesRoutes);
app.route('/api/v1/admin/team', teamRoutes);
app.route('/api/v1/admin/section-images', sectionImagesRoutes);
app.route('/api/v1/admin/regions', regionRoutes);

// Legacy admin routes (backwards compatibility)
app.route('/api/admin/users', usersRoutes);
app.route('/api/admin/activity-logs', activityLogsRoutes);
app.route('/api/admin/profile', profileRoutes);
app.route('/api/admin/storage', storageRoutes);
app.route('/api/admin/slider', sliderRoutes);
app.route('/api/admin/gallery', galleryRoutes);
app.route('/api/admin/logos', logosRoutes);
app.route('/api/admin/usage', usageRoutes);
app.route('/api/admin/page-content', pageContentRoutes);
app.route('/api/admin/services', servicesRoutes);
app.route('/api/admin/team', teamRoutes);
app.route('/api/admin/section-images', sectionImagesRoutes);
app.route('/api/admin/regions', regionRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Agile Productions API' });
});

// Comprehensive health check endpoint
app.get('/health', async (c) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check database connectivity
  try {
    await c.env.DB.prepare('SELECT 1').first();
    health.checks.database = { status: 'healthy' };
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = { status: 'unhealthy', error: error.message };
  }

  // Check R2 bucket access
  try {
    await c.env.BUCKET.head('test-health-check');
    health.checks.storage = { status: 'healthy' };
  } catch (error) {
    // Head might fail if object doesn't exist, which is ok
    if (error.message && error.message.includes('Not Found')) {
      health.checks.storage = { status: 'healthy' };
    } else {
      health.status = 'degraded';
      health.checks.storage = { status: 'degraded', error: error.message };
    }
  }

  // Check TinyPNG API key presence (not connectivity)
  health.checks.tinypng = {
    status: c.env.TINYPNG_API_KEY ? 'configured' : 'not_configured'
  };

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
  return c.json(health, statusCode);
});

// Scheduled cleanup of old activity logs (runs daily at 2 AM UTC)
export async function scheduled(event, env, ctx) {
  try {
    const db = env.DB;

    // Delete activity logs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const result = await db.prepare(
      'DELETE FROM activity_logs WHERE created_at < ?'
    ).bind(thirtyDaysAgo).run();

    console.log(`Cleaned up ${result.meta.changes} activity logs older than 30 days`);
  } catch (error) {
    console.error('Activity log cleanup failed:', error);
  }
}

export default app;
