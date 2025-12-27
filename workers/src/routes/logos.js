import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';

const logos = new Hono();

// Get all logos (active + inactive)
logos.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(
      'SELECT * FROM client_logos ORDER BY display_order'
    ).all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: 'Failed to fetch logos' }, 500);
  }
});

// Add new logo
logos.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    let r2Key, cdnUrl, filename, altText;

    // Handle both FormData (file upload) and JSON (from storage)
    if (contentType.includes('application/json')) {
      // Adding from existing storage
      const body = await c.req.json();
      r2Key = body.r2_key;
      cdnUrl = body.cdn_url;
      filename = body.filename;
      altText = body.alt_text || filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');

      if (!r2Key || !cdnUrl || !filename) {
        return c.json({ error: 'r2_key, cdn_url, and filename required' }, 400);
      }
    } else if (contentType.includes('multipart/form-data')) {
      // Uploading new file
      const formData = await c.req.formData();
      const file = formData.get('image');
      altText = formData.get('alt_text') || formData.get('altText');

      if (!file) {
        return c.json({ error: 'Image required' }, 400);
      }

      filename = file.name;
      r2Key = generateUniqueKey('logos/client', filename);
      cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');
      altText = altText || filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    } else {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    // Check if an inactive entry exists with this r2_key
    const { results: existingResults } = await db.prepare(
      'SELECT id, is_active FROM client_logos WHERE r2_key = ?'
    ).bind(r2Key).all();

    let result;
    let nextOrder;

    if (existingResults.length > 0 && existingResults[0].is_active === 0) {
      // Reactivate existing inactive entry
      const existingId = existingResults[0].id;

      // Get next display order
      const { results: orderResults } = await db.prepare(
        'SELECT MAX(display_order) as max_order FROM client_logos WHERE is_active = 1'
      ).all();
      nextOrder = (orderResults[0]?.max_order || 0) + 1;

      result = await db.prepare(
        'UPDATE client_logos SET filename = ?, cdn_url = ?, display_order = ?, alt_text = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(filename, cdnUrl, nextOrder, altText, existingId).run();

      result.meta = { ...result.meta, last_row_id: existingId };
    } else if (existingResults.length === 0) {
      // Insert new entry
      // Get next display order
      const { results: orderResults } = await db.prepare(
        'SELECT MAX(display_order) as max_order FROM client_logos'
      ).all();
      nextOrder = (orderResults[0]?.max_order || 0) + 1;

      result = await db.prepare(
        'INSERT INTO client_logos (filename, r2_key, cdn_url, display_order, alt_text) VALUES (?, ?, ?, ?, ?)'
      ).bind(filename, r2Key, cdnUrl, nextOrder, altText).run();
    } else {
      // Active entry already exists
      return c.json({ error: 'Logo already exists in the list' }, 400);
    }

    // Also add to image_storage if not already there
    await db.prepare(
      'INSERT OR IGNORE INTO image_storage (filename, r2_key, cdn_url, category) VALUES (?, ?, ?, ?)'
    ).bind(filename, r2Key, cdnUrl, 'logos/client').run();

    // Log activity (non-blocking)
    try {
      const logActivity = c.get('logActivity');
      if (logActivity) {
        await logActivity({
          actionType: 'content_create',
          entityType: 'client_logo',
          entityId: result.meta.last_row_id,
          description: `Added new client logo: ${filename}`,
          newValues: { filename, r2Key, cdnUrl, displayOrder: nextOrder, altText }
        });
      }
    } catch (logError) {
      // Log error but don't fail the request
      console.error('Activity logging failed:', logError);
    }

    return c.json({ success: true, cdnUrl, r2Key });
  } catch (error) {
    console.error('Add logo error:', error);
    console.error('Error stack:', error.stack);
    return c.json({ error: error.message || 'Failed to add logo' }, 500);
  }
});

// Delete logo permanently
logos.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;

    const { results } = await db.prepare(
      'SELECT * FROM client_logos WHERE id = ?'
    ).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Logo not found' }, 404);
    }

    const logo = results[0];

    // Check if image is used elsewhere
    const { results: sliderResults } = await db.prepare(
      'SELECT id FROM slider_images WHERE r2_key = ?'
    ).bind(logo.r2_key).all();
    const { results: galleryResults } = await db.prepare(
      'SELECT id FROM gallery_images WHERE r2_key = ?'
    ).bind(logo.r2_key).all();
    const isUsedElsewhere = sliderResults.length > 0 || galleryResults.length > 0;

    // Delete from client_logos
    await db.prepare('DELETE FROM client_logos WHERE id = ?').bind(id).run();

    // Only delete from R2 and image_storage if not used elsewhere
    if (!isUsedElsewhere) {
      await deleteFromR2(c.env.BUCKET, logo.r2_key);
      await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(logo.r2_key).run();
    }

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_delete',
        entityType: 'client_logo',
        entityId: id,
        description: `Deleted client logo: ${logo.filename}`,
        oldValues: logo
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete logo error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

// Deactivate logos (remove from list, keep in storage)
logos.post('/deactivate', async (c) => {
  try {
    const { ids } = await c.req.json();
    const db = c.env.DB;

    for (const id of ids) {
      await db.prepare(
        'UPDATE client_logos SET is_active = 0 WHERE id = ?'
      ).bind(id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Deactivate failed' }, 500);
  }
});

// Activate logos (add back to list)
logos.post('/activate', async (c) => {
  try {
    const { ids } = await c.req.json();
    const db = c.env.DB;

    for (const id of ids) {
      await db.prepare(
        'UPDATE client_logos SET is_active = 1 WHERE id = ?'
      ).bind(id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Activate failed' }, 500);
  }
});

// Reorder logos
logos.post('/reorder', async (c) => {
  try {
    const { order } = await c.req.json();
    const db = c.env.DB;

    // Fetch logo names and current order for logging
    const { results: logos } = await db.prepare(
      `SELECT id, filename, alt_text, display_order FROM client_logos WHERE id IN (${order.map(() => '?').join(',')}) ORDER BY display_order`
    ).bind(...order).all();

    // Create a map of id to name
    const logoMap = {};
    logos.forEach(logo => {
      logoMap[logo.id] = logo.alt_text || logo.filename.replace(/\.(webp|png|jpg|jpeg)$/i, '');
    });

    // Capture old order (before reordering)
    const oldOrder = logos.map(logo => ({ id: logo.id, name: logoMap[logo.id] }));

    // Update to new order
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE client_logos SET display_order = ? WHERE id = ?'
      ).bind(i + 1, order[i]).run();
    }

    // Log activity with meaningful description
    const logActivity = c.get('logActivity');
    if (logActivity) {
      // Find which logos changed position
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
            name: logoMap[id],
            from: oldPosition,
            to: newPosition
          });
        }
      });

      // Generate description
      let description;
      if (changes.length === 0) {
        description = 'Reordered client logos (no position changes)';
      } else if (changes.length === 1) {
        const change = changes[0];
        description = `${change.name} moved from position ${change.from} to ${change.to}`;
      } else if (changes.length <= 3) {
        const changeDescriptions = changes.map(c => `${c.name} (${c.from}→${c.to})`).join(', ');
        description = `Reordered client logos: ${changeDescriptions}`;
      } else {
        const first3 = changes.slice(0, 3).map(c => `${c.name} (${c.from}→${c.to})`).join(', ');
        description = `Reordered client logos: ${first3}, and ${changes.length - 3} more changes`;
      }

      await logActivity({
        actionType: 'content_reorder',
        entityType: 'client_logo',
        description,
        oldValues: { order: oldOrder },
        newValues: { order: order.map(id => ({ id, name: logoMap[id] })) }
      });
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Reorder failed' }, 500);
  }
});

// Delete multiple logos
logos.post('/delete-multiple', async (c) => {
  try {
    const { ids } = await c.req.json();
    const db = c.env.DB;

    for (const id of ids) {
      const { results } = await db.prepare(
        'SELECT * FROM client_logos WHERE id = ?'
      ).bind(id).all();

      if (results.length > 0) {
        const logo = results[0];

        // Check if image is used elsewhere
        const { results: sliderResults } = await db.prepare(
          'SELECT id FROM slider_images WHERE r2_key = ?'
        ).bind(logo.r2_key).all();
        const { results: galleryResults } = await db.prepare(
          'SELECT id FROM gallery_images WHERE r2_key = ?'
        ).bind(logo.r2_key).all();
        const isUsedElsewhere = sliderResults.length > 0 || galleryResults.length > 0;

        // Delete from client_logos
        await db.prepare('DELETE FROM client_logos WHERE id = ?').bind(id).run();

        // Only delete from R2 and image_storage if not used elsewhere
        if (!isUsedElsewhere) {
          await deleteFromR2(c.env.BUCKET, logo.r2_key);
          await db.prepare('DELETE FROM image_storage WHERE r2_key = ?').bind(logo.r2_key).run();
        }
      }
    }

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_delete',
        entityType: 'client_logo',
        description: `Deleted ${ids.length} client logos`,
        newValues: { deletedIds: ids }
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete multiple logos error:', error);
    return c.json({ error: 'Delete failed' }, 500);
  }
});

export default logos;
