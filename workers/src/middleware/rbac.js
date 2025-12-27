/**
 * Role-Based Access Control (RBAC) middleware
 * Optimized for Cloudflare free tier - uses JWT claims instead of DB queries
 */

/**
 * Middleware to ensure user is a super admin
 * Checks the isSuperAdmin claim from JWT (no DB query needed)
 */
export async function requireSuperAdmin(c, next) {
  const user = c.get('user');

  if (!user || !user.isSuperAdmin) {
    return c.json({ error: 'Forbidden - Super admin access required' }, 403);
  }

  await next();
}
