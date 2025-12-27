import { Hono } from 'hono';

const activityLogs = new Hono();

// Get activity logs with pagination and filtering
activityLogs.get('/', async (c) => {
  try {
    const db = c.env.DB;
    let limit = parseInt(c.req.query('limit')) || 50;
    const offset = parseInt(c.req.query('offset')) || 0;
    const actionType = c.req.query('action_type');
    const entityType = c.req.query('entity_type');
    const adminId = c.req.query('admin_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    // OPTIMIZATION: Enforce max limit to prevent excessive data transfer
    if (limit > 100) {
      limit = 100;
    }

    // Build query
    let query = `
      SELECT
        al.*,
        a.username,
        a.full_name
      FROM activity_logs al
      LEFT JOIN admins a ON al.admin_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (actionType) {
      query += ' AND al.action_type = ?';
      params.push(actionType);
    }
    if (entityType) {
      query += ' AND al.entity_type = ?';
      params.push(entityType);
    }
    if (adminId) {
      query += ' AND al.admin_id = ?';
      params.push(parseInt(adminId));
    }
    if (startDate) {
      query += ' AND al.created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND al.created_at <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await db.prepare(query).bind(...params).all();

    // Parse JSON fields
    const logs = results.map(log => ({
      ...log,
      oldValues: log.old_values ? JSON.parse(log.old_values) : null,
      newValues: log.new_values ? JSON.parse(log.new_values) : null
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
    const countParams = [];

    if (actionType) {
      countQuery += ' AND action_type = ?';
      countParams.push(actionType);
    }
    if (entityType) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entityType);
    }
    if (adminId) {
      countQuery += ' AND admin_id = ?';
      countParams.push(parseInt(adminId));
    }
    if (startDate) {
      countQuery += ' AND created_at >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND created_at <= ?';
      countParams.push(endDate);
    }

    const { results: countResults } = await db.prepare(countQuery).bind(...countParams).all();
    const total = countResults[0].total;

    return c.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Fetch activity logs error:', error);
    return c.json({ error: 'Failed to fetch activity logs' }, 500);
  }
});

// Get single activity log detail
activityLogs.get('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const id = parseInt(c.req.param('id'));

    const { results } = await db.prepare(`
      SELECT
        al.*,
        a.username,
        a.full_name,
        a.email
      FROM activity_logs al
      LEFT JOIN admins a ON al.admin_id = a.id
      WHERE al.id = ?
    `).bind(id).all();

    if (results.length === 0) {
      return c.json({ error: 'Activity log not found' }, 404);
    }

    const log = {
      ...results[0],
      oldValues: results[0].old_values ? JSON.parse(results[0].old_values) : null,
      newValues: results[0].new_values ? JSON.parse(results[0].new_values) : null
    };

    return c.json(log);
  } catch (error) {
    console.error('Fetch activity log error:', error);
    return c.json({ error: 'Failed to fetch activity log' }, 500);
  }
});

export default activityLogs;
