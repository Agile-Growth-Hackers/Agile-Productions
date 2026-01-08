import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';
import { validateImageMimeType, getInvalidFileTypeError } from '../utils/mime-validation.js';
import { sanitizeFilename } from '../utils/sanitize.js';

const gallery = new Hono();

// Get all gallery images
gallery.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch gallery' }, 500);
  }
});

// Get mobile-visible gallery images
gallery.get('/mobile', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE region_code = ? AND is_active = 1 AND mobile_visible = 1 ORDER BY display_order LIMIT 10'
    ).bind(region).all();
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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    let r2Key, cdnUrl, cdnUrlMobile, filename, mobileVisible;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
      filename = sanitizeFilename(body.filename);
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

      // Validate MIME type
      const isValidImage = await validateImageMimeType(file);
      if (!isValidImage) {
        return c.json({ error: getInvalidFileTypeError() }, 400);
      }

      filename = sanitizeFilename(file.name);
      r2Key = generateUniqueKey('gallery', filename);
      mobileVisible = 1;

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
          const mobileDims = getMobileDimensions('gallery');
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
      'SELECT MAX(display_order) as max_order FROM gallery_images WHERE region_code = ?'
    ).bind(region).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    const result = await db.prepare(
      'INSERT INTO gallery_images (filename, r2_key, cdn_url, cdn_url_mobile, display_order, mobile_visible, region_code) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, nextOrder, mobileVisible, region).run();

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, cdn_url_mobile, category, region_code) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, 'gallery', region).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_create',
        entityType: 'gallery_image',
        entityId: result.meta.last_row_id,
        description: `Added new gallery image: ${filename}`,
        newValues: { filename, r2Key, cdnUrl, displayOrder: nextOrder, mobileVisible }
      });
    }

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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    let r2Key, cdnUrl, cdnUrlMobile, filename;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      console.log('Handling JSON update from storage');
      // Updating from existing storage
      const body = await c.req.json();
      console.log('Request body:', JSON.stringify(body));
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      cdnUrlMobile = body.cdn_url_mobile || null;
      filename = sanitizeFilename(body.filename);

      // Allow null or empty values for clearing the image
      if ((r2Key === null || r2Key === '') && (cdnUrl === null || cdnUrl === '') && (filename === null || filename === '')) {
        console.log('Clearing image from position');
        await db.prepare(
          'UPDATE gallery_images SET filename = NULL, r2_key = NULL, cdn_url = NULL WHERE id = ? AND region_code = ?'
        ).bind(id, region).run();
        console.log('Gallery cleared successfully');
        return c.json({ success: true, cleared: true });
      }

      if (!r2Key || !cdnUrl || !filename) {
        console.log('Missing required fields:', { r2Key, cdnUrl, filename });
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }

      console.log('Updating database with:', { filename, r2Key, cdnUrl, id });

      // Get old values before update
      const { results: oldData } = await db.prepare(
        'SELECT filename, r2_key, cdn_url FROM gallery_images WHERE id = ? AND region_code = ?'
      ).bind(id, region).all();

      // Update database (don't delete old R2 file since it might be in use elsewhere)
      await db.prepare(
        'UPDATE gallery_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ? WHERE id = ? AND region_code = ?'
      ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, id, region).run();

      // Log activity
      const logActivity = c.get('logActivity');
      if (logActivity && oldData.length > 0) {
        await logActivity({
          actionType: 'content_update',
          entityType: 'gallery_image',
          entityId: id,
          description: `Updated gallery image ID ${id}`,
          oldValues: oldData[0],
          newValues: { filename, r2Key, cdnUrl }
        });
      }

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

      // Validate MIME type
      const isValidImageUpdate = await validateImageMimeType(file);
      if (!isValidImageUpdate) {
        return c.json({ error: getInvalidFileTypeError() }, 400);
      }

      // Get old image
      const { results } = await db.prepare(
        'SELECT * FROM gallery_images WHERE id = ? AND region_code = ?'
      ).bind(id, region).all();

      if (results.length > 0) {
        console.log('Deleting old image and uploading new one');
        // Delete old images from R2 (both desktop and mobile)
        await deleteFromR2(c.env.BUCKET, results[0].r2_key);
        if (results[0].cdn_url_mobile) {
          const mobileKey = results[0].r2_key.replace(/\.webp$/, '-mobile.webp');
          await deleteFromR2(c.env.BUCKET, mobileKey);
        }

        // Upload new image with compression
        filename = sanitizeFilename(file.name || `upload-${Date.now()}.webp`);
        r2Key = generateUniqueKey('gallery', filename);

        cdnUrlMobile = null;
        if (c.env.TINYPNG_API_KEY) {
          try {
            const imageBuffer = await file.arrayBuffer();

            // Compress desktop version
            const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
            const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
            cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, desktopFile, 'image/webp');

            // Create mobile version
            const mobileDims = getMobileDimensions('gallery');
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
          'UPDATE gallery_images SET filename = ?, r2_key = ?, cdn_url = ?, cdn_url_mobile = ? WHERE id = ? AND region_code = ?'
        ).bind(filename, r2Key, cdnUrl, cdnUrlMobile, id, region).run();

        // Log activity
        const logActivity = c.get('logActivity');
        if (logActivity) {
          await logActivity({
            actionType: 'content_update',
            entityType: 'gallery_image',
            entityId: id,
            description: `Updated gallery image ID ${id} (replaced file)`,
            oldValues: results[0],
            newValues: { filename, r2Key, cdnUrl }
          });
        }

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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get old value
    const { results: oldData } = await db.prepare(
      'SELECT mobile_visible FROM gallery_images WHERE id = ? AND region_code = ?'
    ).bind(id, region).all();

    await db.prepare(
      'UPDATE gallery_images SET mobile_visible = ? WHERE id = ? AND region_code = ?'
    ).bind(visible ? 1 : 0, id, region).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity && oldData.length > 0) {
      await logActivity({
        actionType: 'content_update',
        entityType: 'gallery_image',
        entityId: id,
        description: `Toggled mobile visibility for gallery image ID ${id}`,
        oldValues: { mobileVisible: oldData[0].mobile_visible === 1 },
        newValues: { mobileVisible: visible }
      });
    }

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
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM gallery_images WHERE id = ? AND region_code = ?'
    ).bind(id, region).all();

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
    await db.prepare('DELETE FROM gallery_images WHERE id = ? AND region_code = ?').bind(id, region).run();

    // Only delete from R2 and image_storage if not used elsewhere
    if (!isUsedElsewhere) {
      // Delete desktop version
      await deleteFromR2(c.env.BUCKET, image.r2_key);

      // Delete mobile version if it exists
      if (image.cdn_url_mobile) {
        const mobileKey = image.r2_key.replace(/\.webp$/, '-mobile.webp');
        await deleteFromR2(c.env.BUCKET, mobileKey);
      }

      await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(image.r2_key).run();
    }

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_delete',
        entityType: 'gallery_image',
        entityId: id,
        description: `Deleted gallery image: ${image.filename}`,
        oldValues: image
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete gallery error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default gallery;
