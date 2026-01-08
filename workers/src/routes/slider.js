import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';
import { validateImageMimeType, getInvalidFileTypeError } from '../utils/mime-validation.js';
import { sanitizeFilename } from '../utils/sanitize.js';

const slider = new Hono();

// Get all slider images
slider.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // First, check if region-specific slides exist
    const { results: regionSpecific } = await db.prepare(
      'SELECT * FROM slider_images WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();

    // If region-specific slides exist, return only those
    if (regionSpecific.length > 0) {
      return c.json(regionSpecific);
    }

    // Otherwise, fallback to shared (NULL) slides
    const { results: shared } = await db.prepare(
      'SELECT * FROM slider_images WHERE region_code IS NULL AND is_active = 1 ORDER BY display_order'
    ).all();
    return c.json(shared);
  } catch (error) {
    return c.json({ error: 'Failed to fetch slides' }, 500);
  }
});

// Add new slider image
slider.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    let r2Key, cdnUrl, cdnUrlMobile, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
      filename = sanitizeFilename(body.filename);
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

      // Validate MIME type
      const isValidImage = await validateImageMimeType(file);
      if (!isValidImage) {
        return c.json({ error: getInvalidFileTypeError() }, 400);
      }

      filename = sanitizeFilename(file.name);
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

    // Get next display order for this region
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM slider_images WHERE region_code = ?'
    ).bind(region).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    // Insert into database
    const result = await db.prepare(
      'INSERT INTO slider_images (filename, r2_key, cdn_url, cdn_url_mobile, display_order, object_position, region_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, nextOrder, objectPosition, region).run();

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, cdn_url_mobile, category, region_code) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, 'slider', region).run();

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

// PATCH object position only (lightweight update)
slider.patch('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    const body = await c.req.json();
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    if (!body.object_position) {
      return c.json({ error: 'object_position required' }, 400);
    }

    // Get old value for logging
    const { results: oldData } = await db.prepare(
      'SELECT object_position FROM slider_images WHERE id = ? AND region_code = ?'
    ).bind(id, region).all();

    if (oldData.length === 0) {
      return c.json({ error: 'Slide not found' }, 404);
    }

    // Update only object_position
    await db.prepare(
      'UPDATE slider_images SET object_position = ? WHERE id = ? AND region_code = ?'
    ).bind(body.object_position, id, region).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_update',
        entityType: 'slider_image',
        entityId: id,
        description: `Updated slider image ${id} position: ${oldData[0].object_position} → ${body.object_position}`,
        oldValues: { object_position: oldData[0].object_position },
        newValues: { object_position: body.object_position }
      });
    }

    return c.json({ success: true, object_position: body.object_position });
  } catch (error) {
    console.error('Update position error:', error);
    return c.json({ error: 'Update failed' }, 500);
  }
});

// Update slider image
slider.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    let r2Key, cdnUrl, cdnUrlMobile, filename, objectPosition;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Updating from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
      filename = sanitizeFilename(body.filename);
      objectPosition = body.object_position || 'center center';

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }

      // Get old values before update
      const { results: oldData } = await db.prepare(
        'SELECT filename, r2_key, cdn_url, object_position FROM slider_images WHERE id = ? AND region_code = ?'
      ).bind(id, region).all();

      // Update database (don't delete old R2 file since it might be in use elsewhere)
      await db.prepare(
        'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ?, object_position = ? WHERE id = ? AND region_code = ?'
      ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, objectPosition, id, region).run();

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

      // Validate MIME type
      const isValidImageUpdate = await validateImageMimeType(file);
      if (!isValidImageUpdate) {
        return c.json({ error: getInvalidFileTypeError() }, 400);
      }

      // Get old image
      const { results } = await db.prepare(
        'SELECT id, r2_key, cdn_url_mobile FROM slider_images WHERE id = ? AND region_code = ?'
      ).bind(id, region).all();

      if (results.length > 0) {
        // Delete old images from R2 (both desktop and mobile)
        await deleteFromR2(c.env.BUCKET, results[0].r2_key);
        if (results[0].cdn_url_mobile) {
          const mobileKey = results[0].r2_key.replace(/\.webp$/, '-mobile.webp');
          await deleteFromR2(c.env.BUCKET, mobileKey);
        }

        // Upload new image with compression
        filename = sanitizeFilename(file.name);
        r2Key = generateUniqueKey('slider', filename);

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
          'UPDATE slider_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ?, object_position = ? WHERE id = ? AND region_code = ?'
        ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, objectPosition, id, region).run();

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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get slide info
    const { results } = await db.prepare(
      'SELECT id, r2_key, cdn_url_mobile, display_order, filename FROM slider_images WHERE id = ? AND region_code = ?'
    ).bind(id, region).all();

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
    await db.prepare('DELETE FROM slider_images WHERE id = ? AND region_code = ?').bind(id, region).run();

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

    // Renumber remaining slides in this region
    await db.prepare(
      'UPDATE slider_images SET display_order = display_order - 1 WHERE region_code = ? AND display_order > ?'
    ).bind(region, slide.display_order).run();

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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Fetch slider filenames and current order for logging (only for this region)
    const { results: slides } = await db.prepare(
      `SELECT id, filename, display_order FROM slider_images WHERE region_code = ? AND id IN (${order.map(() => '?').join(',')}) ORDER BY display_order`
    ).bind(region, ...order).all();

    // Create a map of id to filename
    const slideMap = {};
    slides.forEach(slide => {
      slideMap[slide.id] = slide.filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    });

    // Capture old order (before reordering)
    const oldOrder = slides.map(slide => ({ id: slide.id, filename: slideMap[slide.id] }));

    // Update display order for each slide (only within this region)
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE slider_images SET display_order = ? WHERE id = ? AND region_code = ?'
      ).bind(i + 1, order[i], region).run();
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
