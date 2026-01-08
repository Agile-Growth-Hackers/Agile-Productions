import { Hono } from 'hono';

const pageContent = new Hono();

// Get all page content for a region
pageContent.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    const { results } = await db.prepare(
      'SELECT * FROM page_content WHERE region_code = ? AND is_active = 1 ORDER BY content_key'
    ).bind(region).all();

    // Transform array to object for easier frontend use
    const content = results.reduce((acc, row) => {
      acc[row.content_key] = row.content_text;
      return acc;
    }, {});

    return c.json(content);
  } catch (error) {
    console.error('Failed to fetch page content:', error);
    return c.json({ error: 'Failed to fetch page content' }, 500);
  }
});

// Create new content
pageContent.post('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const { content_key, content_text } = await c.req.json();

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    if (!content_key || !content_text) {
      return c.json({ error: 'content_key and content_text are required' }, 400);
    }

    // Insert new content
    const result = await db.prepare(
      'INSERT INTO page_content (region_code, content_key, content_text) VALUES (?, ?, ?)'
    ).bind(region, content_key, content_text).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_create',
        entityType: 'page_content',
        entityId: result.meta.last_row_id,
        description: `Created page content: ${content_key}`,
        newValues: { region, content_key, content_text }
      });
    }

    return c.json({ success: true, message: 'Content created', id: result.meta.last_row_id });
  } catch (error) {
    console.error('Failed to create content:', error);
    return c.json({ error: 'Failed to create content' }, 500);
  }
});

// Update specific content
pageContent.put('/:key', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const contentKey = c.req.param('key');
    const { content_text } = await c.req.json();

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get old value for logging
    const { results: oldData } = await db.prepare(
      'SELECT content_text FROM page_content WHERE region_code = ? AND content_key = ?'
    ).bind(region, contentKey).all();

    // Upsert content
    await db.prepare(
      'INSERT INTO page_content (region_code, content_key, content_text, updated_at) ' +
      'VALUES (?, ?, ?, CURRENT_TIMESTAMP) ' +
      'ON CONFLICT(region_code, content_key) DO UPDATE SET ' +
      'content_text = excluded.content_text, updated_at = CURRENT_TIMESTAMP'
    ).bind(region, contentKey, content_text).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_update',
        entityType: 'page_content',
        description: `Updated page content: ${contentKey}`,
        oldValues: oldData.length > 0 ? { content_text: oldData[0].content_text } : null,
        newValues: { content_text }
      });
    }

    return c.json({ success: true, message: 'Content updated' });
  } catch (error) {
    console.error('Failed to update content:', error);
    return c.json({ error: 'Failed to update content' }, 500);
  }
});

// Delete content (soft delete - set is_active = 0)
pageContent.delete('/:key', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const region = c.req.query('region') || c.get('region');
    const contentKey = c.req.param('key');

    // Validate region access
    if (!user.isSuperAdmin && (!user.assignedRegions || !user.assignedRegions.includes(region))) {
      return c.json({ error: `No access to region ${region}` }, 403);
    }

    // Get content for logging
    const { results } = await db.prepare(
      'SELECT * FROM page_content WHERE region_code = ? AND content_key = ?'
    ).bind(region, contentKey).all();

    if (results.length === 0) {
      return c.json({ error: 'Content not found' }, 404);
    }

    // Soft delete (set is_active = 0)
    await db.prepare(
      'UPDATE page_content SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE region_code = ? AND content_key = ?'
    ).bind(region, contentKey).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'content_delete',
        entityType: 'page_content',
        description: `Deleted page content: ${contentKey}`,
        oldValues: results[0]
      });
    }

    return c.json({ success: true, message: 'Content deleted' });
  } catch (error) {
    console.error('Failed to delete content:', error);
    return c.json({ error: 'Failed to delete content' }, 500);
  }
});

export default pageContent;
