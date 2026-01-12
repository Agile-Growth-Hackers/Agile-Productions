import { Hono } from 'hono';

const regions = new Hono();

// Get admin's accessible regions
regions.get('/me', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;

  // Get active regions from database
  const { results } = await db.prepare(
    'SELECT code, name, domain, route FROM regions WHERE is_active = 1 ORDER BY is_default DESC, name ASC'
  ).all();

  let availableRegions = results;

  // Filter by assigned regions for non-super admins
  if (!user.isSuperAdmin && user.assignedRegions) {
    availableRegions = availableRegions.filter(r => user.assignedRegions.includes(r.code));
  }

  return c.json({
    availableRegions,
    isSuperAdmin: user.isSuperAdmin
  });
});

// Get all regions (super admin only) - returns from database
regions.get('/', async (c) => {
  const user = c.get('user');

  // Only super admins can view all regions
  if (!user.isSuperAdmin) {
    return c.json({ error: 'Access denied' }, 403);
  }

  const db = c.env.DB;

  const { results } = await db.prepare(
    'SELECT code, name, domain, route, is_active, is_default FROM regions ORDER BY is_default DESC, name ASC'
  ).all();

  return c.json(results);
});

// Create new region (super admin only)
regions.post('/', async (c) => {
  const user = c.get('user');

  // Only super admins can create regions
  if (!user.isSuperAdmin) {
    return c.json({ error: 'Access denied' }, 403);
  }

  try {
    const { code, name, domain, route, copyFromRegion } = await c.req.json();

    // Validate inputs
    if (!code || !name) {
      return c.json({ error: 'code and name are required' }, 400);
    }

    // Ensure at least domain or route is provided
    if (!domain && !route) {
      return c.json({ error: 'Either domain or route must be provided' }, 400);
    }

    // Validate code format (2 uppercase letters)
    if (!/^[A-Z]{2}$/.test(code)) {
      return c.json({ error: 'Region code must be 2 uppercase letters (e.g., US, UK)' }, 400);
    }

    const db = c.env.DB;

    // Check if region already exists in database
    const { results: existingRegions } = await db.prepare(
      'SELECT code FROM regions WHERE code = ?'
    ).bind(code).all();

    if (existingRegions.length > 0) {
      return c.json({ error: 'Region code already exists' }, 400);
    }

    // Validate copyFromRegion if provided
    if (copyFromRegion) {
      const { results: sourceRegions } = await db.prepare(
        'SELECT code FROM regions WHERE code = ?'
      ).bind(copyFromRegion).all();

      if (sourceRegions.length === 0) {
        return c.json({ error: 'Invalid copyFromRegion code' }, 400);
      }
    }

    // Insert new region into database
    await db.prepare(
      'INSERT INTO regions (code, name, domain, route, is_active, is_default) VALUES (?, ?, ?, ?, 1, 0)'
    ).bind(code, name, domain, route).run();

    // If copyFromRegion is specified, duplicate content
    if (copyFromRegion) {
      // Copy page_content
      await db.prepare(
        'INSERT INTO page_content (region_code, content_key, content_text, is_active) ' +
        'SELECT ?, content_key, content_text, is_active FROM page_content WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy services
      await db.prepare(
        'INSERT INTO services (region_code, title, description, icon_r2_key, icon_cdn_url, icon_cdn_url_mobile, display_order, is_active) ' +
        'SELECT ?, title, description, icon_r2_key, icon_cdn_url, icon_cdn_url_mobile, display_order, is_active FROM services WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy team_members
      await db.prepare(
        'INSERT INTO team_members (region_code, name, position, bio, photo_r2_key, photo_cdn_url, photo_cdn_url_mobile, display_order, is_active) ' +
        'SELECT ?, name, position, bio, photo_r2_key, photo_cdn_url, photo_cdn_url_mobile, display_order, is_active FROM team_members WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy section_images
      await db.prepare(
        'INSERT INTO section_images (region_code, section_key, filename, r2_key, cdn_url, cdn_url_mobile, alt_text, is_active) ' +
        'SELECT ?, section_key, filename, r2_key, cdn_url, cdn_url_mobile, alt_text, is_active FROM section_images WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy slider_images
      await db.prepare(
        'INSERT INTO slider_images (region_code, filename, r2_key, cdn_url, cdn_url_mobile, object_position, display_order, is_active) ' +
        'SELECT ?, filename, r2_key, cdn_url, cdn_url_mobile, object_position, display_order, is_active FROM slider_images WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy gallery_images
      await db.prepare(
        'INSERT INTO gallery_images (region_code, filename, r2_key, cdn_url, cdn_url_mobile, show_on_mobile, is_active) ' +
        'SELECT ?, filename, r2_key, cdn_url, cdn_url_mobile, show_on_mobile, is_active FROM gallery_images WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();

      // Copy client_logos
      await db.prepare(
        'INSERT INTO client_logos (region_code, name, filename, r2_key, cdn_url, cdn_url_mobile, display_order, is_active) ' +
        'SELECT ?, name, filename, r2_key, cdn_url, cdn_url_mobile, display_order, is_active FROM client_logos WHERE region_code = ?'
      ).bind(code, copyFromRegion).run();
    }

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'region_create',
        entityType: 'region',
        description: `Created new region: ${code} (${name})${copyFromRegion ? ` copied from ${copyFromRegion}` : ''}`,
        newValues: { code, name, domain, route, copyFromRegion }
      });
    }

    return c.json({
      success: true,
      message: `Region ${code} created successfully and is now active.`,
      region: { code, name, domain, route },
      contentCopied: !!copyFromRegion
    });
  } catch (error) {
    console.error('Failed to create region:', error);
    return c.json({ error: 'Failed to create region: ' + error.message }, 500);
  }
});

// Delete region (super admin only)
// This performs soft delete by setting is_active = 0 on the region and all content
regions.delete('/:code', async (c) => {
  const user = c.get('user');

  // Only super admins can delete regions
  if (!user.isSuperAdmin) {
    return c.json({ error: 'Access denied' }, 403);
  }

  try {
    const regionCode = c.req.param('code');
    const db = c.env.DB;

    // Validate region exists in database
    const { results: existingRegions } = await db.prepare(
      'SELECT code, is_default FROM regions WHERE code = ?'
    ).bind(regionCode).all();

    if (existingRegions.length === 0) {
      return c.json({ error: 'Region not found' }, 404);
    }

    const region = existingRegions[0];

    // Prevent deleting the default region
    if (region.is_default === 1) {
      return c.json({ error: 'Cannot delete the default region' }, 400);
    }

    // Check if this is the last active region
    const { results: activeRegions } = await db.prepare(
      'SELECT COUNT(*) as count FROM regions WHERE is_active = 1'
    ).all();

    if (activeRegions[0].count <= 1) {
      return c.json({ error: 'Cannot delete the last active region' }, 400);
    }

    // Soft delete the region itself
    await db.prepare('UPDATE regions SET is_active = 0 WHERE code = ?').bind(regionCode).run();

    // Soft delete all content for this region
    await db.prepare('UPDATE page_content SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE services SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE team_members SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE section_images SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE slider_images SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE gallery_images SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();
    await db.prepare('UPDATE client_logos SET is_active = 0 WHERE region_code = ?').bind(regionCode).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'region_delete',
        entityType: 'region',
        description: `Deactivated region: ${regionCode}`,
        oldValues: region
      });
    }

    return c.json({
      success: true,
      message: `Region ${regionCode} has been deactivated successfully.`
    });
  } catch (error) {
    console.error('Failed to delete region:', error);
    return c.json({ error: 'Failed to delete region: ' + error.message }, 500);
  }
});

// Toggle region active status (super admin only)
regions.put('/:code/status', async (c) => {
  const user = c.get('user');

  // Only super admins can toggle region status
  if (!user.isSuperAdmin) {
    return c.json({ error: 'Access denied' }, 403);
  }

  try {
    const regionCode = c.req.param('code');
    const { is_active } = await c.req.json();
    const db = c.env.DB;

    // Validate region exists
    const { results: existingRegions } = await db.prepare(
      'SELECT code, is_default, is_active FROM regions WHERE code = ?'
    ).bind(regionCode).all();

    if (existingRegions.length === 0) {
      return c.json({ error: 'Region not found' }, 404);
    }

    const region = existingRegions[0];

    // Prevent deactivating the default region
    if (region.is_default === 1 && is_active === 0) {
      return c.json({ error: 'Cannot deactivate the default region' }, 400);
    }

    // Check if this is the last active region when deactivating
    if (is_active === 0) {
      const { results: activeRegions } = await db.prepare(
        'SELECT COUNT(*) as count FROM regions WHERE is_active = 1'
      ).all();

      if (activeRegions[0].count <= 1) {
        return c.json({ error: 'Cannot deactivate the last active region' }, 400);
      }
    }

    // Update region status
    await db.prepare('UPDATE regions SET is_active = ? WHERE code = ?')
      .bind(is_active, regionCode)
      .run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'region_status_update',
        entityType: 'region',
        description: `${is_active === 1 ? 'Activated' : 'Deactivated'} region: ${regionCode}`,
        oldValues: { is_active: region.is_active },
        newValues: { is_active }
      });
    }

    return c.json({
      success: true,
      message: `Region ${regionCode} has been ${is_active === 1 ? 'activated' : 'deactivated'} successfully.`
    });
  } catch (error) {
    console.error('Failed to toggle region status:', error);
    return c.json({ error: 'Failed to update region status: ' + error.message }, 500);
  }
});

export default regions;
