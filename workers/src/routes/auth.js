import { Hono } from 'hono';
import { verifyPassword } from '../utils/password.js';
import { createJWT } from '../utils/jwt.js';
import { getClientIP, getUserAgent } from '../utils/activity-logger.js';
import { validateRequest, schemas } from '../middleware/request-validation.js';

const auth = new Hono();

// Rate limiting for failed login attempts
// In-memory store: Map<username, {count: number, resetTime: timestamp}>
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function isRateLimited(username) {
  const now = Date.now();
  const record = loginAttempts.get(username);

  if (!record) {
    return false;
  }

  // Reset if lockout duration has passed
  if (now > record.resetTime) {
    loginAttempts.delete(username);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailedAttempt(username) {
  const now = Date.now();
  const record = loginAttempts.get(username);

  if (!record || now > record.resetTime) {
    loginAttempts.set(username, {
      count: 1,
      resetTime: now + LOCKOUT_DURATION
    });
  } else {
    record.count++;
  }

  // Cleanup old entries periodically (simple cleanup)
  if (loginAttempts.size > 1000) {
    for (const [key, value] of loginAttempts.entries()) {
      if (now > value.resetTime) {
        loginAttempts.delete(key);
      }
    }
  }
}

// Login endpoint
auth.post('/login', validateRequest(schemas.login), async (c) => {
  const ipAddress = getClientIP(c);
  const userAgent = getUserAgent(c);

  try {
    const { username, password } = c.get('validatedBody');

    if (!username || !password) {
      return c.json({ error: 'Username and password required' }, 400);
    }

    // Check rate limiting
    if (isRateLimited(username)) {
      return c.json({
        error: 'Too many failed login attempts. Please try again in 15 minutes.'
      }, 429);
    }

    const db = c.env.DB;

    // Find user
    const { results } = await db.prepare(
      'SELECT * FROM admins WHERE username = ?'
    ).bind(username).all();

    const user = results[0];

    if (!user) {
      // Record failed attempt
      recordFailedAttempt(username);

      // Log failed attempt only if not rate-limited (prevent DB spam)
      if (!isRateLimited(username)) {
        await db.prepare(`
          INSERT INTO activity_logs (
            admin_id, action_type, entity_type, description, ip_address, user_agent
          ) VALUES (0, 'login_failed', 'auth', ?, ?, ?)
        `).bind(
          `Failed login attempt for unknown username: ${username}`,
          ipAddress,
          userAgent
        ).run();
      }

      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Check if user is active
    if (!user.is_active) {
      await db.prepare(`
        INSERT INTO activity_logs (
          admin_id, action_type, entity_type, description, ip_address, user_agent
        ) VALUES (?, 'login_failed', 'auth', ?, ?, ?)
      `).bind(
        user.id,
        'Login attempt for inactive account',
        ipAddress,
        userAgent
      ).run();

      return c.json({ error: 'Account is inactive' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      // Record failed attempt
      recordFailedAttempt(username);

      // Log failed attempt only if not rate-limited
      if (!isRateLimited(username)) {
        await db.prepare(`
          INSERT INTO activity_logs (
            admin_id, action_type, entity_type, description, ip_address, user_agent
          ) VALUES (?, 'login_failed', 'auth', ?, ?, ?)
        `).bind(
          user.id,
          'Failed login attempt - invalid password',
          ipAddress,
          userAgent
        ).run();
      }

      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(username);

    // Update last login
    await db.prepare(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    // Log successful login
    await db.prepare(`
      INSERT INTO activity_logs (
        admin_id, action_type, entity_type, description, ip_address, user_agent
      ) VALUES (?, 'login_success', 'auth', ?, ?, ?)
    `).bind(
      user.id,
      'Successful login',
      ipAddress,
      userAgent
    ).run();

    // Create JWT with role and active status
    const token = await createJWT(
      {
        userId: user.id,
        username: user.username,
        isSuperAdmin: user.is_super_admin === 1,
        isActive: user.is_active === 1
      },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        isSuperAdmin: user.is_super_admin === 1,
        profilePictureUrl: user.profile_picture_url
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Logout endpoint
auth.post('/logout', async (c) => {
  const user = c.get('user');
  const db = c.env.DB;
  const ipAddress = getClientIP(c);
  const userAgent = getUserAgent(c);

  try {
    // Log logout
    await db.prepare(`
      INSERT INTO activity_logs (
        admin_id, action_type, entity_type, description, ip_address, user_agent
      ) VALUES (?, 'logout', 'auth', ?, ?, ?)
    `).bind(
      user.userId,
      'User logged out',
      ipAddress,
      userAgent
    ).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ success: true }); // Still return success even if logging fails
  }
});

// Refresh token endpoint
auth.post('/refresh', async (c) => {
  // For now, just verify the token and return user info
  const user = c.get('user');
  return c.json({
    user: {
      id: user.userId,
      username: user.username,
      isSuperAdmin: user.isSuperAdmin || false
    }
  });
});

export default auth;
