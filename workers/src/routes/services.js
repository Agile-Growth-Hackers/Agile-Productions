import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';
import { validateImageMimeType, getInvalidFileTypeError } from '../utils/mime-validation.js';
import { sanitizeFilename, sanitize } from '../utils/sanitize.js';

const services = new Hono();

// Get all services
services.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM services WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();

    return c.json(results);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return c.json({ error: 'Failed to fetch services' }, 500);
  }
});

// Add new service
services.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    let title, description, iconR2Key = null, iconCdnUrl = null, iconCdnUrlMobile = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      title = sanitize(formData.get('title'));
      description = sanitize(formData.get('description'));
      const iconFile = formData.get('icon');

      if (!title) {
        return c.json({ error: 'Title required' }, 400);
      }

      // Handle icon upload if provided
      if (iconFile) {
        const isValidImage = await validateImageMimeType(iconFile);
        if (!isValidImage) {
          return c.json({ error: getInvalidFileTypeError() }, 400);
        }

        const filename = sanitizeFilename(iconFile.name);
        iconR2Key = generateUniqueKey(`services/icons/${region.toLowerCase()}`, filename);

        // Compress with TinyPNG if available
        if (c.env.TINYPNG_API_KEY) {
          try {
            const imageBuffer = await iconFile.arrayBuffer();

            // Compress desktop version
            const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
            const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
            iconCdnUrl = await uploadToR2(c.env.BUCKET, iconR2Key, desktopFile, 'image/webp');

            // Create mobile version
            const mobileDims = getMobileDimensions('service');
            const mobileBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, mobileDims);
            const mobileR2Key = iconR2Key.replace(/\.webp$/, '-mobile.webp');
            const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), { type: 'image/webp' });
            iconCdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
          } catch (error) {
            console.error('TinyPNG failed, uploading original:', error);
            iconCdnUrl = await uploadToR2(c.env.BUCKET, iconR2Key, iconFile, 'image/webp');
          }
        } else {
          iconCdnUrl = await uploadToR2(c.env.BUCKET, iconR2Key, iconFile, 'image/webp');
        }
      }
    } else {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    // Get next display order for this region
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM services WHERE region_code = ?'
    ).bind(region).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    // Insert into database
    const result = await db.prepare(
      'INSERT INTO services (region_code, title, description, icon_r2_key, icon_cdn_url, icon_cdn_url_mobile, display_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(region, title, description, iconR2Key, iconCdnUrl, iconCdnUrlMobile, nextOrder).run();

    return c.json({
      id: result.meta.last_row_id,
      region_code: region,
      title,
      description,
      icon_r2_key: iconR2Key,
      icon_cdn_url: iconCdnUrl,
      icon_cdn_url_mobile: iconCdnUrlMobile,
      display_order: nextOrder,
      is_active: 1
    });
  } catch (error) {
    console.error('Failed to create service:', error);
    return c.json({ error: 'Failed to create service' }, 500);
  }
});

// Update service
services.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const serviceId = c.req.param('id');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get existing service
    const { results: existing } = await db.prepare(
      'SELECT * FROM services WHERE id = ? AND region_code = ?'
    ).bind(serviceId, region).all();

    if (!existing || existing.length === 0) {
      return c.json({ error: 'Service not found' }, 404);
    }

    const formData = await c.req.formData();
    const title = sanitize(formData.get('title')) || existing[0].title;
    const description = sanitize(formData.get('description')) || existing[0].description;

    await db.prepare(
      'UPDATE services SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(title, description, serviceId).run();

    return c.json({ success: true, message: 'Service updated' });
  } catch (error) {
    console.error('Failed to update service:', error);
    return c.json({ error: 'Failed to update service' }, 500);
  }
});

// Delete service
services.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const serviceId = c.req.param('id');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get service to check region and delete R2 files
    const { results } = await db.prepare(
      'SELECT * FROM services WHERE id = ? AND region_code = ?'
    ).bind(serviceId, region).all();

    if (!results || results.length === 0) {
      return c.json({ error: 'Service not found' }, 404);
    }

    const service = results[0];

    // Delete from R2
    if (service.icon_r2_key) {
      await deleteFromR2(c.env.BUCKET, service.icon_r2_key);
      // Delete mobile version
      const mobileKey = service.icon_r2_key.replace(/\.webp$/, '-mobile.webp');
      await deleteFromR2(c.env.BUCKET, mobileKey);
    }

    // Delete from database
    await db.prepare('DELETE FROM services WHERE id = ?').bind(serviceId).run();

    return c.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Failed to delete service:', error);
    return c.json({ error: 'Failed to delete service' }, 500);
  }
});

// Reorder services
services.post('/reorder', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const { order } = await c.req.json();

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    if (!order || !Array.isArray(order)) {
      return c.json({ error: 'Order array required' }, 400);
    }

    // Update display_order for each service
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE services SET display_order = ? WHERE id = ? AND region_code = ?'
      ).bind(i + 1, order[i], region).run();
    }

    return c.json({ success: true, message: 'Services reordered' });
  } catch (error) {
    console.error('Failed to reorder services:', error);
    return c.json({ error: 'Failed to reorder services' }, 500);
  }
});

export default services;
