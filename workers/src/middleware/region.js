import { getRegionFromRequest } from '../config/regions.js';

/**
 * Middleware to detect and set region in context
 * Sets c.get('region') for use in route handlers
 */
export function regionMiddleware(c, next) {
  const region = getRegionFromRequest(c.req.raw);
  c.set('region', region);
  return next();
}

/**
 * Middleware to validate admin has access to specified region
 * Used in admin routes that specify region in request body/params
 */
export function validateAdminRegionAccess(c, next) {
  const user = c.get('user');
  const requestedRegion = c.req.query('region') || c.req.param('region') || c.get('region');

  // Super admins have access to all regions
  if (user.isSuperAdmin) {
    return next();
  }

  // Parse assigned regions from JWT
  const assignedRegions = user.assignedRegions || [];

  if (!assignedRegions.includes(requestedRegion)) {
    return c.json({
      error: `Access denied: You are not assigned to region ${requestedRegion}`
    }, 403);
  }

  return next();
}
