import { Hono } from 'hono';
import { hashPassword } from '../utils/password.js';
import { logActivity, getClientIP, getUserAgent } from '../utils/activity-logger.js';
import { validatePasswordStrength } from '../utils/password-validation.js';
import { validateRequest, schemas } from '../middleware/request-validation.js';

const users = new Hono();

// List all users (super admin only)
users.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const { results } = await db.prepare(`
      SELECT
        id, username, email, full_name, is_active, is_super_admin,
        created_at, last_login, updated_at
      FROM admins
      WHERE is_test_account = 0 OR is_test_account IS NULL
      ORDER BY created_at DESC
    `).all();

    return c.json(results);
  } catch (error) {
    console.error('Fetch users error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

// Create new user (super admin only)
users.post('/', validateRequest(schemas.createUser), async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const { username, email, fullName, password, isSuperAdmin, assignedRegions } = c.get('validatedBody');

    // Validation
    if (!username || !email || !password) {
      return c.json({ error: 'Username, email, and password are required' }, 400);
    }

    // Validate password strength
    const validation = validatePasswordStrength(password);
    if (!validation.isValid) {
      return c.json({ error: validation.errors.join('. ') }, 400);
    }

    // Validate assigned regions for non-super admins
    const regions = assignedRegions || ['IN'];
    if (!isSuperAdmin && regions.length > 0) {
      // Validate regions exist in database
      const placeholders = regions.map(() => '?').join(',');
      const { results: validRegions } = await db.prepare(
        `SELECT code FROM regions WHERE code IN (${placeholders}) AND is_active = 1`
      ).bind(...regions).all();

      if (validRegions.length !== regions.length) {
        return c.json({ error: 'One or more invalid or inactive region codes' }, 400);
      }
    }

    // Check for duplicate username/email
    const { results: existing } = await db.prepare(
      'SELECT id FROM admins WHERE username = ? OR email = ?'
    ).bind(username, email).all();

    if (existing.length > 0) {
      return c.json({ error: 'Username or email already exists' }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user with assigned regions
    const result = await db.prepare(`
      INSERT INTO admins (
        username, email, full_name, password_hash, is_super_admin, is_active, assigned_regions
      ) VALUES (?, ?, ?, ?, ?, 1, ?)
    `).bind(
      username,
      email,
      fullName,
      passwordHash,
      isSuperAdmin ? 1 : 0,
      isSuperAdmin ? null : JSON.stringify(regions)
    ).run();

    const newUserId = result.meta.last_row_id;

    // Log activity
    await logActivity(db, {
      adminId: user.userId,
      actionType: 'user_create',
      entityType: 'admin',
      entityId: newUserId,
      description: `Created new ${isSuperAdmin ? 'super admin' : 'admin'} user: ${username}`,
      newValues: { username, email, fullName, isSuperAdmin },
      ipAddress: getClientIP(c),
      userAgent: getUserAgent(c)
    });

    return c.json({
      success: true,
      userId: newUserId,
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ error: 'Failed to create user' }, 500);
  }
});

// Update user (super admin only)
users.put('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const targetUserId = parseInt(c.req.param('id'));
    const { email, fullName, isActive, isSuperAdmin, password } = await c.req.json();

    // Check if target is a test account
    const { results: testCheck } = await db.prepare(
      'SELECT is_test_account FROM admins WHERE id = ?'
    ).bind(targetUserId).all();

    if (testCheck.length > 0 && testCheck[0].is_test_account === 1) {
      return c.json({ error: 'Cannot modify test accounts' }, 403);
    }

    // Prevent self-demotion
    if (targetUserId === user.userId && isSuperAdmin === false) {
      return c.json({ error: 'Cannot remove your own super admin status' }, 400);
    }

    // Get old values
    const { results: oldData } = await db.prepare(
      'SELECT email, full_name, is_active, is_super_admin FROM admins WHERE id = ?'
    ).bind(targetUserId).all();

    if (oldData.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const oldValues = {
      email: oldData[0].email,
      fullName: oldData[0].full_name,
      isActive: oldData[0].is_active === 1,
      isSuperAdmin: oldData[0].is_super_admin === 1
    };

    // Build update query
    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (fullName !== undefined) {
      updates.push('full_name = ?');
      values.push(fullName);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive ? 1 : 0);
    }
    if (isSuperAdmin !== undefined) {
      updates.push('is_super_admin = ?');
      values.push(isSuperAdmin ? 1 : 0);
    }
    if (password) {
      // Validate password strength
      const validation = validatePasswordStrength(password);
      if (!validation.isValid) {
        return c.json({ error: validation.errors.join('. ') }, 400);
      }
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(targetUserId);

    await db.prepare(
      `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    const newValues = { email, fullName, isActive, isSuperAdmin };
    if (password) newValues.passwordChanged = true;

    // Log activity
    await logActivity(db, {
      adminId: user.userId,
      actionType: 'user_update',
      entityType: 'admin',
      entityId: targetUserId,
      description: `Updated user ID ${targetUserId}`,
      oldValues,
      newValues,
      ipAddress: getClientIP(c),
      userAgent: getUserAgent(c)
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json({ error: 'Failed to update user' }, 500);
  }
});

// Delete user (super admin only)
users.delete('/:id', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user');
    const targetUserId = parseInt(c.req.param('id'));

    // Check if target is a test account
    const { results: testCheck } = await db.prepare(
      'SELECT is_test_account FROM admins WHERE id = ?'
    ).bind(targetUserId).all();

    if (testCheck.length > 0 && testCheck[0].is_test_account === 1) {
      return c.json({ error: 'Cannot delete test accounts' }, 403);
    }

    // Prevent self-deletion
    if (targetUserId === user.userId) {
      return c.json({ error: 'Cannot delete your own account' }, 400);
    }

    // Get user info before deletion
    const { results } = await db.prepare(
      'SELECT username, email, full_name, is_super_admin FROM admins WHERE id = ?'
    ).bind(targetUserId).all();

    if (results.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    const deletedUser = results[0];

    // Delete user
    await db.prepare('DELETE FROM admins WHERE id = ?').bind(targetUserId).run();

    // Log activity
    await logActivity(db, {
      adminId: user.userId,
      actionType: 'user_delete',
      entityType: 'admin',
      entityId: targetUserId,
      description: `Deleted user: ${deletedUser.username}`,
      oldValues: deletedUser,
      ipAddress: getClientIP(c),
      userAgent: getUserAgent(c)
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default users;
