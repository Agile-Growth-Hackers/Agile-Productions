import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { compressImage, getMobileDimensions } from '../utils/tinypng.js';
import { validateImageMimeType, getInvalidFileTypeError } from '../utils/mime-validation.js';
import { sanitizeFilename, sanitize } from '../utils/sanitize.js';

const team = new Hono();

// Get all team members
team.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM team_members WHERE region_code = ? AND is_active = 1 ORDER BY display_order'
    ).bind(region).all();

    return c.json(results);
  } catch (error) {
    console.error('Failed to fetch team members:', error);
    return c.json({ error: 'Failed to fetch team members' }, 500);
  }
});

// Add new team member
team.post('/', async (c) => {
  try {
    const contentType = c.req.header('content-type') || '';
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    if (!contentType.includes('multipart/form-data')) {
      return c.json({ error: 'Invalid content type' }, 400);
    }

    const formData = await c.req.formData();
    const name = sanitize(formData.get('name'));
    const position = sanitize(formData.get('position'));
    const bio = sanitize(formData.get('bio'));
    const photoFile = formData.get('photo');

    if (!name) {
      return c.json({ error: 'Name required' }, 400);
    }

    let photoR2Key = null, photoCdnUrl = null, photoCdnUrlMobile = null;

    // Handle photo upload if provided
    if (photoFile) {
      const isValidImage = await validateImageMimeType(photoFile);
      if (!isValidImage) {
        return c.json({ error: getInvalidFileTypeError() }, 400);
      }

      const filename = sanitizeFilename(photoFile.name);
      photoR2Key = generateUniqueKey(`team/${region.toLowerCase()}`, filename);

      // Compress with TinyPNG if available
      if (c.env.TINYPNG_API_KEY) {
        try {
          const imageBuffer = await photoFile.arrayBuffer();

          // Compress desktop version
          const desktopBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, {});
          const desktopFile = new File([desktopBuffer], filename, { type: 'image/webp' });
          photoCdnUrl = await uploadToR2(c.env.BUCKET, photoR2Key, desktopFile, 'image/webp');

          // Create mobile version
          const mobileDims = getMobileDimensions('team');
          const mobileBuffer = await compressImage(imageBuffer, c.env.TINYPNG_API_KEY, mobileDims);
          const mobileR2Key = photoR2Key.replace(/\.webp$/, '-mobile.webp');
          const mobileFile = new File([mobileBuffer], filename.replace(/\.webp$/, '-mobile.webp'), { type: 'image/webp' });
          photoCdnUrlMobile = await uploadToR2(c.env.BUCKET, mobileR2Key, mobileFile, 'image/webp');
        } catch (error) {
          console.error('TinyPNG failed, uploading original:', error);
          photoCdnUrl = await uploadToR2(c.env.BUCKET, photoR2Key, photoFile, 'image/webp');
        }
      } else {
        photoCdnUrl = await uploadToR2(c.env.BUCKET, photoR2Key, photoFile, 'image/webp');
      }
    }

    // Get next display order for this region
    const { results } = await db.prepare(
      'SELECT MAX(display_order) as max_order FROM team_members WHERE region_code = ?'
    ).bind(region).all();
    const nextOrder = (results[0]?.max_order || 0) + 1;

    // Insert into database
    const result = await db.prepare(
      'INSERT INTO team_members (region_code, name, position, bio, photo_r2_key, photo_cdn_url, photo_cdn_url_mobile, display_order) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(region, name, position, bio, photoR2Key, photoCdnUrl, photoCdnUrlMobile, nextOrder).run();

    return c.json({
      id: result.meta.last_row_id,
      region_code: region,
      name,
      position,
      bio,
      photo_r2_key: photoR2Key,
      photo_cdn_url: photoCdnUrl,
      photo_cdn_url_mobile: photoCdnUrlMobile,
      display_order: nextOrder,
      is_active: 1
    });
  } catch (error) {
    console.error('Failed to create team member:', error);
    return c.json({ error: 'Failed to create team member' }, 500);
  }
});

// Update team member
team.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const memberId = c.req.param('id');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get existing team member
    const { results: existing } = await db.prepare(
      'SELECT * FROM team_members WHERE id = ? AND region_code = ?'
    ).bind(memberId, region).all();

    if (!existing || existing.length === 0) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    const formData = await c.req.formData();
    const name = sanitize(formData.get('name')) || existing[0].name;
    const position = sanitize(formData.get('position')) || existing[0].position;
    const bio = sanitize(formData.get('bio')) || existing[0].bio;

    await db.prepare(
      'UPDATE team_members SET name = ?, position = ?, bio = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(name, position, bio, memberId).run();

    return c.json({ success: true, message: 'Team member updated' });
  } catch (error) {
    console.error('Failed to update team member:', error);
    return c.json({ error: 'Failed to update team member' }, 500);
  }
});

// Delete team member
team.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const memberId = c.req.param('id');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get team member to check region and delete R2 files
    const { results } = await db.prepare(
      'SELECT * FROM team_members WHERE id = ? AND region_code = ?'
    ).bind(memberId, region).all();

    if (!results || results.length === 0) {
      return c.json({ error: 'Team member not found' }, 404);
    }

    const member = results[0];

    // Delete from R2
    if (member.photo_r2_key) {
      await deleteFromR2(c.env.BUCKET, member.photo_r2_key);
      // Delete mobile version
      const mobileKey = member.photo_r2_key.replace(/\.webp$/, '-mobile.webp');
      await deleteFromR2(c.env.BUCKET, mobileKey);
    }

    // Delete from database
    await db.prepare('DELETE FROM team_members WHERE id = ?').bind(memberId).run();

    return c.json({ success: true, message: 'Team member deleted' });
  } catch (error) {
    console.error('Failed to delete team member:', error);
    return c.json({ error: 'Failed to delete team member' }, 500);
  }
});

// Reorder team members
team.post('/reorder', async (c) => {
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

    // Update display_order for each member
    for (let i = 0; i < order.length; i++) {
      await db.prepare(
        'UPDATE team_members SET display_order = ? WHERE id = ? AND region_code = ?'
      ).bind(i + 1, order[i], region).run();
    }

    return c.json({ success: true, message: 'Team members reordered' });
  } catch (error) {
    console.error('Failed to reorder team members:', error);
    return c.json({ error: 'Failed to reorder team members' }, 500);
  }
});

export default team;
