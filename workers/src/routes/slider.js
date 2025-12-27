import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';

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
    let r2Key, cdnUrl, cdnUrlMobile, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
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

      // Compress with TinyPNG if available
      cdnUrlMobile = null;
      if (c.env.TINYPNG_API_KEY) {
        try {
          const imageBuffer = await file.arrayBuffer();

          // Compress desktop version
          const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
          const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
          cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, desktopFile, 'image/webp');

          // Create mobile version
          const mobileDims = getMobileDimensions('slider');
          const mobileBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, mobileDims);
          const mobileR2Key = r2Key.replace(/\.webp$/, '-mobile.webp');
          const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), { type: 'image/webp' });
          cdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
        } catch (error) {
          console.error('TinyPNG failed, uploading original:', error);
          cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
        }
      } else {
        cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
      }
    } else {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    // Get next display order
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM slider_images'
    ).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    // Insert into database
    const result = await db.prepare(
      'INSERT INTO slider_images (filename, r2_key, cdn_url, cdn_url_mobile, display_order, object_position) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, nextOrder, objectPosition).run();

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, cdn_url_mobile, category) VALUES (?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, 'slider').run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_create',
        entityType: 'slider_image',
        entityId: result.meta.last_row_id,
        description: `Added new slider image: ${filename}`,
        newValues: { filename, r2Key, cdnUrl, displayOrder: nextOrder, objectPosition }
      });
    }

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
    let r2Key, cdnUrl, cdnUrlMobile, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Updating from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
      filename = body.filename;
      objectPosition = body.object_position || 'center center';

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }

      // Get old values before update
      const { results: oldData } = await db.prepare(
        'SELECT filename, r2_key, cdn_url, object_position FROM slider_images WHERE id = ?'
      ).bind(id).all();

      // Update database (don't delete old R2 file since it might be in use elsewhere)
      await db.prepare(
        'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ?, object_position = ? WHERE id = ?'
      ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, objectPosition, id).run();

      // Log activity
      const logActivity = c.get('logActivity');
      if (logActivity && oldData.length > 0) {
        await logActivity({
          actionType: 'content_update',
          entityType: 'slider_image',
          entityId: id,
          description: `Updated slider image ID ${id}`,
          oldValues: oldData[0],
          newValues: { filename, r2Key, cdnUrl, objectPosition }
        });
      }

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
        // Delete old images from R2 (both desktop and mobile)
        await deleteFromR2(c.env.BUCKET, results[0].r2_key);
        if (results[0].cdn_url_mobile) {
          const mobileKey = results[0].r2_key.replace(/\.webp$/, '-mobile.webp');
          await deleteFromR2(c.env.BUCKET, mobileKey);
        }

        // Upload new image with compression
        r2Key = generateUniqueKey('slider', file.name);
        filename = file.name;

        cdnUrlMobile = null;
        if (c.env.TINYPNG_API_KEY) {
          try {
            const imageBuffer = await file.arrayBuffer();

            // Compress desktop version
            const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
            const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
            cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, desktopFile, 'image/webp');

            // Create mobile version
            const mobileDims = getMobileDimensions('slider');
            const mobileBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, mobileDims);
            const mobileR2Key = r2Key.replace(/\.webp$/, '-mobile.webp');
            const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), { type: 'image/webp' });
            cdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
          } catch (error) {
            console.error('TinyPNG failed, uploading original:', error);
            cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
          }
        } else {
          cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
        }

        // Update database
        await db.prepare(
          'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ?, object_position = ? WHERE id = ?'
        ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, objectPosition, id).run();

        // Log activity
        const logActivity = c.get('logActivity');
        if (logActivity) {
          await logActivity({
            actionType: 'content_update',
            entityType: 'slider_image',
            entityId: id,
            description: `Updated slider image ID ${id} (replaced file)`,
            oldValues: results[0],
            newValues: { filename, r2Key, cdnUrl, objectPosition }
          });
        }

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
      // Delete desktop version
      await deleteFromR2(c.env.BUCKET, slide.r2_key);

      // Delete mobile version if it exists
      if (slide.cdn_url_mobile) {
        const mobileKey = slide.r2_key.replace(/\.webp$/, '-mobile.webp');
        await deleteFromR2(c.env.BUCKET, mobileKey);
      }

      await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(slide.r2_key).run();
    }

    // Renumber remaining slides
    await db.prepare(
      'UPDATE slider_images SET display_order = display_order - 1 WHERE display_order > ?'
    ).bind(slide.display_order).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_delete',
        entityType: 'slider_image',
        entityId: id,
        description: `Deleted slider image: ${slide.filename}`,
        oldValues: slide
      });
    }

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

    // Fetch slider filenames and current order for logging
    const { results: slides } = await db.prepare(
      `SELECT id, filename, display_order FROM slider_images WHERE id IN (${order.map(() => '?').join(',')}) ORDER BY display_order`
    ).bind(...order).all();

    // Create a map of id to filename
    const slideMap = {};
    slides.forEach(slide => {
      slideMap[slide.id] = slide.filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    });

    // Capture old order (before reordering)
    const oldOrder = slides.map(slide => ({ id: slide.id, filename: slideMap[slide.id] }));

    // Update display order for each slide
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE slider_images SET display_order = ? WHERE id = ?'
      ).bind(i + 1, order[i]).run();
    }

    // Log activity with meaningful description
    const logActivity = c.get('logActivity');
    if (logActivity) {
      // Find which slides changed position
      const changes = [];
      const oldPositions = {};
      oldOrder.forEach((item, index) => {
        oldPositions[item.id] = index + 1;
      });

      order.forEach((id, newIndex) => {
        const newPosition = newIndex + 1;
        const oldPosition = oldPositions[id];
        if (oldPosition !== newPosition) {
          changes.push({
            filename: slideMap[id],
            from: oldPosition,
            to: newPosition
          });
        }
      });

      // Generate description
      let description;
      if (changes.length === 0) {
        description = 'Reordered slider images (no position changes)';
      } else if (changes.length === 1) {
        const change = changes[0];
        description = `${change.filename} moved from position ${change.from} to ${change.to}`;
      } else if (changes.length <= 3) {
        const changeDescriptions = changes.map(c => `${c.filename} (${c.from}→${c.to})`).join(', ');
        description = `Reordered slider images: ${changeDescriptions}`;
      } else {
        const first3 = changes.slice(0, 3).map(c => `${c.filename} (${c.from}→${c.to})`).join(', ');
        description = `Reordered slider images: ${first3}, and ${changes.length - 3} more changes`;
      }

      await logActivity({
        actionType: 'content_reorder',
        entityType: 'slider_image',
        description,
        oldValues: { order: oldOrder },
        newValues: { order: order.map(id => ({ id, filename: slideMap[id] })) }
      });
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Reorder failed' }, 500);
  }
});

export default slider;
