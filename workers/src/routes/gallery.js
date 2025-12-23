import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';

const gallery = new Hono();

// Get all gallery images
gallery.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

// Get mobile-visible gallery images
gallery.get('/mobile', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE is_active = 1 AND mobile_visible = 1 ORDER BY display_order LIMIT 10'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

// Add gallery image
gallery.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    let r2Key, cdnUrl, filename, mobileVisible;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      filename = body.filename;
      // Convert boolean to integer (D1 expects 0 or 1, not true/false)
      mobileVisible = body.mobile_visible !== undefined ? (body.mobile_visible ? 1 : 0) : 1;

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Uploading new file
      const formData = await c.req.formData();
      const file = formData.get('image');

      if (!file) {
        return c.json({ error: 'Image required' }, 400);
      }

      filename = file.name;
      r2Key = generateUniqueKey('gallery', filename);
      cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
      mobileVisible = 1;
    } else {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    // Get next display order
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM gallery_images'
    ).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    await db.prepare(
      'INSERT INTO gallery_images (filename, r2_key, cdn_url, display_order, mobile_visible) VALUES (?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, nextOrder, mobileVisible).run();

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, category) VALUES (?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, 'gallery').run();

    return c.json({ success: true, cdnUrl, r2Key });
  } catch (error) {
    console.error('Add gallery image error:', error);
    return c.json({ error: 'Failed to add image' }, 500);
  }
});

// Update gallery image
gallery.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const contentType = c.req.header('content-type') || '';
    console.log('Gallery update - ID:', id, 'Content-Type:', contentType);
    const db = c.env.DB;
    let r2Key, cdnUrl, filename;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      console.log('Handling JSON update from storage');
      // Updating from existing storage
      const body = await c.req.json();
      console.log('Request body:', JSON.stringify(body));
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      filename = body.filename;

      // Allow null or empty values for clearing the image
      if ((r2Key === null || r2Key === '') && (cdnUrl === null || cdnUrl === '') && (filename === null || filename === '')) {
        console.log('Clearing image from position');
        await db.prepare(
          'UPDATE gallery_images SET filename = NULL, r2_key = NULL, cdn_url = NULL WHERE id = ?'
        ).bind(id).run();
        console.log('Gallery cleared successfully');
        return c.json({ success: true, cleared: true });
      }

      if (!r2Key || !cdnUrl || !filename) {
        console.log('Missing required fields:', { r2Key, cdnUrl, filename });
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }

      console.log('Updating database with:', { filename, r2Key, cdnUrl, id });
      // Update database (don't delete old R2 file since it might be in use elsewhere)
      await db.prepare(
        'UPDATE gallery_images SET filename = ?, r2_key = ?, cdn_url = ? WHERE id = ?'
      ).bind(filename, r2Key, cdnUrl, id).run();

      console.log('Gallery update successful');
      return c.json({ success: true, cdnUrl });
    } else if (contentType.includes('multipart/form-data')) {
      console.log('Handling FormData upload');
      // Uploading new file
      const formData = await c.req.formData();
      const file = formData.get('image');

      if (!file) {
        return c.json({ error: 'Image required' }, 400);
      }

      // Get old image
      const { results } = await db.prepare(
        'SELECT * FROM gallery_images WHERE id = ?'
      ).bind(id).all();

      if (results.length > 0) {
        console.log('Deleting old image and uploading new one');
        // Delete old image from R2
        await deleteFromR2(c.env.BUCKET, results[0].r2_key);

        // Upload new image
        r2Key = generateUniqueKey('gallery', file.name || `upload-${Date.now()}.webp`);
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
        filename = file.name || `upload-${Date.now()}.webp`;

        // Update database
        await db.prepare(
          'UPDATE gallery_images SET filename = ?, r2_key = ?, cdn_url = ? WHERE id = ?'
        ).bind(filename, r2Key, cdnUrl, id).run();

        console.log('Gallery update successful');
        return c.json({ success: true, cdnUrl });
      }
    }

    console.log('Invalid request - no matching content type handler');
    return c.json({ error: 'Invalid content type or missing data' }, 400);
  } catch (error) {
    console.error('Gallery update error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return c.json({ error: `Update failed: ${error.message}` }, 500);
  }
});

// Toggle mobile visibility
gallery.put('/:id/mobile-visibility', async (c) => {
  try {
    const id = c.req.param('id');
    const { visible } = await c.req.json();
    const db = c.env.DB;

    await db.prepare(
      'UPDATE gallery_images SET mobile_visible = ? WHERE id = ?'
    ).bind(visible ? 1 : 0, id).run();

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Update failed' }, 500);
  }
});

// Delete gallery image
gallery.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Image not found' }, 404);
    }

    const image = results[0];

    // Check if image is used elsewhere
    const { results: sliderResults } = await db.prepare(
      'SELECT id FROM slider_images WHERE r2_key = ?'
    ).bind(image.r2_key).all();
    const { results: logoResults } = await db.prepare(
      'SELECT id FROM client_logos WHERE r2_key = ?'
    ).bind(image.r2_key).all();
    const isUsedElsewhere = sliderResults.length > 0 || logoResults.length > 0;

    // Delete from gallery_images
    await db.prepare('DELETE FROM gallery_images WHERE id = ?').bind(id).run();

    // Only delete from R2 and image_storage if not used elsewhere
    if (!isUsedElsewhere) {
      await deleteFromR2(c.env.BUCKET, image.r2_key);
      await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(image.r2_key).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete gallery error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default gallery;
