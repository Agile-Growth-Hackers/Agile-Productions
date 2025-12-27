/**
 * Activity logging utility for tracking admin actions
 * Optimized for Cloudflare free tier - logging never blocks requests
 */

/**
 * Get client IP from Cloudflare Workers request
 * @param {Context} c - Hono context
 * @returns {string} IP address
 */
export function getClientIP(c) {
  // Cloudflare provides the connecting IP in CF-Connecting-IP header
  return c.req.header('CF-Connecting-IP') ||
         c.req.header('X-Real-IP') ||
         c.req.header('X-Forwarded-For')?.split(',')[0] ||
         'unknown';
}

/**
 * Get user agent from request
 * @param {Context} c - Hono context
 * @returns {string} User agent
 */
export function getUserAgent(c) {
  return c.req.header('User-Agent') || 'unknown';
}

/**
 * Log an activity to the database
 * @param {D1Database} db - D1 database instance
 * @param {Object} data - Activity log data
 * @param {number} data.adminId - Admin user ID
 * @param {string} data.actionType - Action type (login_success, content_create, etc.)
 * @param {string} data.entityType - Entity type (admin, slider_image, etc.)
 * @param {number} data.entityId - Entity ID
 * @param {string} data.description - Human-readable description
 * @param {Object} data.oldValues - Old values (before change)
 * @param {Object} data.newValues - New values (after change)
 * @param {string} data.ipAddress - Client IP address
 * @param {string} data.userAgent - Client user agent
 */
export async function logActivity(db, {
  adminId,
  actionType,
  entityType = null,
  entityId = null,
  description,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null
}) {
  try {
    await db.prepare(`
      INSERT INTO activity_logs (
        admin_id, action_type, entity_type, entity_id,
        description, old_values, new_values, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      adminId,
      actionType,
      entityType,
      entityId,
      description,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent
    ).run();
  } catch (error) {
    // CRITICAL: Don't fail the request if logging fails
    // This ensures activity logging never blocks user actions
    console.error('Activity logging failed:', error);
  }
}

/**
 * Create activity logging middleware
 * Attaches logging helper to context for easy use in routes
 */
export function activityLoggerMiddleware(c, next) {
  const user = c.get('user');

  if (!user) {
    // No user in context, skip logging setup (likely public route)
    return next();
  }

  const ipAddress = getClientIP(c);
  const userAgent = getUserAgent(c);

  // Attach helper function to context
  c.set('logActivity', async (data) => {
    await logActivity(c.env.DB, {
      adminId: user.userId,
      ipAddress,
      userAgent,
      ...data
    });
  });

  return next();
}
