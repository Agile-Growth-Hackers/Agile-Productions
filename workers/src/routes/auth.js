import { Hono } from 'hono';
import { verifyPassword } from '../utils/password.js';
import { createJWT } from '../utils/jwt.js';

const auth = new Hono();

// Login endpoint
auth.post('/login', async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: 'Username and password required' }, 400);
    }

    const db = c.env.DB;

    // Find user
    const { results } = await db.prepare(
      'SELECT * FROM admins WHERE username = ?'
    ).bind(username).all();

    const user = results[0];

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Update last login
    await db.prepare(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();

    // Create JWT
    const token = await createJWT(
      { userId: user.id, username: user.username },
      c.env.JWT_SECRET
    );

    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
  }
});

// Refresh token endpoint
auth.post('/refresh', async (c) => {
  // For now, just verify the token and return user info
  const user = c.get('user');
  return c.json({
    user: {
      id: user.userId,
      username: user.username
    }
  });
});

export default auth;
