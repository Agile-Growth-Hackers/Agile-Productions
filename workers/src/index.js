import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import { requireSuperAdmin } from './middleware/rbac.js';
import { publicRateLimit, adminRateLimit } from './middleware/rate-limit.js';
import { activityLoggerMiddleware } from './utils/activity-logger.js';
import authRoutes from './routes/auth.js';
import storageRoutes from './routes/storage.js';
import sliderRoutes from './routes/slider.js';
import galleryRoutes from './routes/gallery.js';
import logosRoutes from './routes/logos.js';
import usageRoutes from './routes/usage.js';
import usersRoutes from './routes/users.js';
import activityLogsRoutes from './routes/activity-logs.js';
import profileRoutes from './routes/profile.js';

const app = new Hono();

// Apply CORS to all routes
app.use('*', corsMiddleware);

// Apply rate limiting to public API routes
app.use('/api/slider', publicRateLimit);
app.use('/api/gallery*', publicRateLimit);
app.use('/api/logos', publicRateLimit);

// Public routes - no authentication required
app.get('/api/slider', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT id, cdn_url, object_position, display_order FROM slider_images WHERE is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

app.get('/api/gallery', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT id, cdn_url, display_order FROM gallery_images WHERE is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.get('/api/gallery/mobile', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT id, cdn_url, display_order FROM gallery_images WHERE is_active = 1 AND mobile_visible = 1 ORDER BY display_order LIMIT 10'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

app.get('/api/logos', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT id, cdn_url, alt_text, display_order FROM client_logos WHERE is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch logos' }, 500);
  }
});

// Auth routes (login doesn't need auth middleware)
app.route('/api/auth', authRoutes);

// Protected admin routes - apply auth, rate limiting, and activity logging middleware
app.use('/api/admin/*', authMiddleware); // Checks JWT validity and isActive from token
app.use('/api/admin/*', adminRateLimit); // Rate limit: 300 req/min per user
app.use('/api/admin/*', activityLoggerMiddleware); // Adds logging helper

// Super admin only routes (apply before registering routes)
app.use('/api/admin/users/*', requireSuperAdmin);
app.use('/api/admin/activity-logs/*', requireSuperAdmin);

// Register all admin routes
app.route('/api/admin/users', usersRoutes);
app.route('/api/admin/activity-logs', activityLogsRoutes);
app.route('/api/admin/profile', profileRoutes);
app.route('/api/admin/storage', storageRoutes);
app.route('/api/admin/slider', sliderRoutes);
app.route('/api/admin/gallery', galleryRoutes);
app.route('/api/admin/logos', logosRoutes);
app.route('/api/admin/usage', usageRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Agile Productions API' });
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
