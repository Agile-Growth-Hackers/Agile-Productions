import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';

const slider = new Hono();

// Get all slider images
slider.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT * FROM slider_images WHERE is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

// Add new slider image
slider.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    let r2Key, cdnUrl, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      filename = body.filename;
      objectPosition = body.object_position || 'center center';

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Uploading new file
      const formData = await c.req.formData();
      const file = formData.get('image');
      objectPosition = formData.get('object_position') || 'center center';

      if (!file) {
        return c.json({ error: 'Image required' }, 400);
      }

      filename = file.name;
      r2Key = generateUniqueKey('slider', filename);
      cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
    } else {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    // Get next display order
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM slider_images'
    ).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    // Insert into database
    await db.prepare(
      'INSERT INTO slider_images (filename, r2_key, cdn_url, display_order, object_position) VALUES (?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, nextOrder, objectPosition).run();

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, category) VALUES (?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, 'slider').run();

    return c.json({ success: true, cdnUrl, r2Key });
  } catch (error) {
    console.error('Add slide error:', error);
    return c.json({ error: 'Failed to add slide' }, 500);
  }
});

// Update slider image
slider.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    let r2Key, cdnUrl, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Updating from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      filename = body.filename;
      objectPosition = body.object_position || 'center center';

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }

      // Update database (don't delete old R2 file since it might be in use elsewhere)
      await db.prepare(
        'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, object_position = ? WHERE id = ?'
      ).bind(filename, r2Key, cdnUrl, objectPosition, id).run();

      return c.json({ success: true, cdnUrl });
    } else if (contentType.includes('multipart/form-data')) {
      // Uploading new file
      const formData = await c.req.formData();
      const file = formData.get('image');
      objectPosition = formData.get('object_position') || 'center center';

      if (!file) {
        return c.json({ error: 'Image required' }, 400);
      }

      // Get old image
      const { results } = await db.prepare(
        'SELECT * FROM slider_images WHERE id = ?'
      ).bind(id).all();

      if (results.length > 0) {
        // Delete old image from R2
        await deleteFromR2(c.env.BUCKET, results[0].r2_key);

        // Upload new image
        r2Key = generateUniqueKey('slider', file.name);
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
        filename = file.name;

        // Update database
        await db.prepare(
          'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, object_position = ? WHERE id = ?'
        ).bind(filename, r2Key, cdnUrl, objectPosition, id).run();

        return c.json({ success: true, cdnUrl });
      }
    }

    return c.json({ error: 'Invalid content type or missing data' }, 400);
  } catch (error) {
    console.error('Slider update error:', error);
    return c.json({ error: 'Update failed' }, 500);
  }
});

// Delete slider image
slider.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    // Get slide info
    const { results } = await db.prepare(
      'SELECT * FROM slider_images WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Slide not found' }, 404);
    }

    const slide = results[0];

    // Check if image is used elsewhere
    const { results: galleryResults } = await db.prepare(
      'SELECT id FROM gallery_images WHERE r2_key = ?'
    ).bind(slide.r2_key).all();
    const { results: logoResults } = await db.prepare(
      'SELECT id FROM client_logos WHERE r2_key = ?'
    ).bind(slide.r2_key).all();
    const isUsedElsewhere = galleryResults.length > 0 || logoResults.length > 0;

    // Delete from slider_images
    await db.prepare('DELETE FROM slider_images WHERE id = ?').bind(id).run();

    // Only delete from R2 and image_storage if not used elsewhere
    if (!isUsedElsewhere) {
      await deleteFromR2(c.env.BUCKET, slide.r2_key);
      await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(slide.r2_key).run();
    }

    // Renumber remaining slides
    await db.prepare(
      'UPDATE slider_images SET display_order = display_order - 1 WHERE display_order > ?'
    ).bind(slide.display_order).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete slide error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

// Reorder slides
slider.post('/reorder', async (c) => {
  try {
    const { order } = await c.req.json();
    const db = c.env.DB;

    // Update display order for each slide
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE slider_images SET display_order = ? WHERE id = ?'
      ).bind(i + 1, order[i]).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Reorder failed' }, 500);
  }
});

export default slider;
