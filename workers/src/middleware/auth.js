import { verifyJWT } from '../utils/jwt.js';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);

    // Check if user is active (from JWT, no DB query needed)
    // OPTIMIZATION: Saves ~100 DB reads per day
    if (payload.isActive === false) {
      return c.json({ error: 'Account is inactive' }, 403);
    }

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}
