import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors.js';
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import storageRoutes from './routes/storage.js';
import sliderRoutes from './routes/slider.js';
import galleryRoutes from './routes/gallery.js';
import logosRoutes from './routes/logos.js';
import usageRoutes from './routes/usage.js';

const app = new Hono();

// Apply CORS to all routes
app.use('*', corsMiddleware);

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

// Protected admin routes
app.use('/api/admin/*', authMiddleware);
app.route('/api/admin/storage', storageRoutes);
app.route('/api/admin/slider', sliderRoutes);
app.route('/api/admin/gallery', galleryRoutes);
app.route('/api/admin/logos', logosRoutes);
app.route('/api/admin/usage', usageRoutes);

// Health check
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'Agile Productions API' });
});

export default app;
