import { verifyJWT } from '../utils/jwt.js';

export async function authMiddleware(c, next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    // Support JWT secret rotation by trying previous secret if current fails
    const previousSecret = c.env.JWT_SECRET_PREVIOUS || null;
    const payload = await verifyJWT(token, c.env.JWT_SECRET, previousSecret);

    // Check if user is active (from JWT, no DB query needed)
    // OPTIMIZATION: Saves ~100 DB reads per day
    if (payload.isActive === false) {
      return c.json({ error: 'Account is inactive' }, 403);
    }

    // Note: If payload._rotationNeeded is true, the token was signed with old secret
    // Client should re-login to get a new token, but we allow it for now
    // The old secret will be removed after rotation period expires

    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Unauthorized - Invalid token' }, 401);
  }
}
