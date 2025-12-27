import { Hono } from 'hono';
import { uploadToR2, deleteFromR2, generateUniqueKey } from '../utils/r2.js';
import { hashPassword } from '../utils/password.js';
import { getClientIP, getUserAgent } from '../utils/activity-logger.js';
import { validatePasswordStrength } from '../utils/password-validation.js';
import { validateFileSize } from '../utils/file-validation.js';

const profile = new Hono();

// Get current user's profile
profile.get('/', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;

    const { results } = await db.prepare(
      'SELECT id, username, email, full_name, profile_picture_url, is_super_admin, is_active, created_at FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    if (results.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(results[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    return c.json({ error: 'Failed to get profile' }, 500);
  }
});

// Update profile (name, email)
profile.put('/', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    const { fullName, email } = await c.req.json();

    // Get old values for activity log
    const { results: oldData } = await db.prepare(
      'SELECT * FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    // Update profile
    await db.prepare(
      'UPDATE admins SET full_name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(fullName || null, email || null, user.userId).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'user_update',
        entityType: 'admin',
        entityId: user.userId,
        description: `Updated own profile`,
        oldValues: { fullName: oldData[0].full_name, email: oldData[0].email },
        newValues: { fullName, email }
      });
    }

    // Get updated profile
    const { results } = await db.prepare(
      'SELECT id, username, email, full_name, profile_picture_url, is_super_admin FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    return c.json(results[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Update password
profile.put('/password', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;
    const { currentPassword, newPassword } = await c.req.json();

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current password and new password required' }, 400);
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return c.json({ error: validation.errors.join('. ') }, 400);
    }

    // Verify current password
    const { results } = await db.prepare(
      'SELECT password_hash FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    if (results.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Import password verification
    const { verifyPassword } = await import('../utils/password.js');
    const isValid = await verifyPassword(currentPassword, results[0].password_hash);

    if (!isValid) {
      return c.json({ error: 'Current password is incorrect' }, 401);
    }

    // Check if new password is same as old password
    const isSameAsOld = await verifyPassword(newPassword, results[0].password_hash);
    if (isSameAsOld) {
      return c.json({ error: 'New password must be different from current password' }, 400);
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await db.prepare(
      'UPDATE admins SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(newPasswordHash, user.userId).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'user_update',
        entityType: 'admin',
        entityId: user.userId,
        description: `Changed own password`
      });
    }

    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    return c.json({ error: 'Failed to update password' }, 500);
  }
});

// Upload profile picture
profile.post('/picture', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;

    const formData = await c.req.formData();
    const file = formData.get('image');

    if (!file) {
      return c.json({ error: 'Image required' }, 400);
    }

    // Validate file size (2MB max for profile pictures)
    try {
      validateFileSize(file, 'PROFILE_PICTURE');
    } catch (err) {
      return c.json({ error: err.message }, 400);
    }

    // Get current profile picture to delete old one
    const { results: oldData } = await db.prepare(
      'SELECT profile_picture_url, r2_key FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    const oldR2Key = oldData[0]?.r2_key;

    // Generate unique key for profile picture
    const filename = file.name || `profile-${user.userId}.webp`;
    const r2Key = generateUniqueKey('profiles', filename);

    // Upload to R2
    const cdnUrl = await uploadToR2(c.env.BUCKET, r2Key, file, 'image/webp');

    // Update database
    await db.prepare(
      'UPDATE admins SET profile_picture_url = ?, r2_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(cdnUrl, r2Key, user.userId).run();

    // Delete old profile picture from R2 if exists
    if (oldR2Key) {
      try {
        await deleteFromR2(c.env.BUCKET, oldR2Key);
      } catch (err) {
        console.error('Failed to delete old profile picture:', err);
      }
    }

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'user_update',
        entityType: 'admin',
        entityId: user.userId,
        description: `Updated profile picture`,
        newValues: { profilePictureUrl: cdnUrl }
      });
    }

    return c.json({ success: true, profilePictureUrl: cdnUrl });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    return c.json({ error: 'Failed to upload profile picture' }, 500);
  }
});

// Delete profile picture
profile.delete('/picture', async (c) => {
  try {
    const user = c.get('user');
    const db = c.env.DB;

    // Get current profile picture
    const { results } = await db.prepare(
      'SELECT r2_key FROM admins WHERE id = ?'
    ).bind(user.userId).all();

    const r2Key = results[0]?.r2_key;

    if (r2Key) {
      // Delete from R2
      await deleteFromR2(c.env.BUCKET, r2Key);
    }

    // Remove from database
    await db.prepare(
      'UPDATE admins SET profile_picture_url = NULL, r2_key = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.userId).run();

    // Log activity
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'user_update',
        entityType: 'admin',
        entityId: user.userId,
        description: `Removed profile picture`
      });
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    return c.json({ error: 'Failed to delete profile picture' }, 500);
  }
});

export default profile;
