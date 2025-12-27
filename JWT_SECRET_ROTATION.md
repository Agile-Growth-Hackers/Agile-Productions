# JWT Secret Rotation Guide

Secure process for rotating JWT secrets with zero downtime.

## Why Rotate JWT Secrets?

JWT secrets should be rotated periodically to:
- Reduce impact of secret compromise
- Follow security best practices
- Comply with security policies
- Invalidate old tokens gradually

**Recommended Rotation Schedule:** Every 90 days

## How It Works

The system supports graceful secret rotation using a dual-secret approach:

1. **Current Secret** (`JWT_SECRET`): Signs new tokens
2. **Previous Secret** (`JWT_SECRET_PREVIOUS`): Validates old tokens

During rotation:
- New tokens are signed with new secret
- Old tokens (signed with old secret) continue to work
- After grace period, old secret is removed

## Rotation Process

### Prerequisites

- Access to Wrangler CLI
- Access to production Cloudflare Workers

### Step 1: Generate New Secret (5 minutes)

Generate a cryptographically secure random secret:

```bash
# Option 1: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Option 2: Using OpenSSL
openssl rand -hex 64

# Option 3: Online (use trusted source only)
# https://generate-secret.vercel.app/64
```

**Important:**
- Use at least 64 characters (128 recommended)
- Store securely (password manager, secret vault)
- Never commit to git or share publicly

### Step 2: Set Previous Secret (2 minutes)

Move current secret to previous secret slot:

```bash
cd workers

# Get current secret value (if you don't have it stored)
# Note: Wrangler doesn't allow reading secrets, so you must have it saved

# Set JWT_SECRET_PREVIOUS to current JWT_SECRET value
npx wrangler secret put JWT_SECRET_PREVIOUS
# When prompted, paste your CURRENT JWT_SECRET value
```

**Verify:**
```bash
npx wrangler secret list
# Should show both JWT_SECRET and JWT_SECRET_PREVIOUS
```

### Step 3: Deploy New Secret (2 minutes)

Update the current secret with the new value:

```bash
npx wrangler secret put JWT_SECRET
# When prompted, paste your NEW secret value (from Step 1)
```

**Verify:**
```bash
npx wrangler secret list
# Should show:
# - JWT_SECRET (new)
# - JWT_SECRET_PREVIOUS (old)
```

### Step 4: Grace Period (24-72 hours)

**Wait 24-72 hours** before removing the old secret.

During this time:
- New logins get tokens signed with new secret
- Old tokens (signed with old secret) continue to work
- Users don't need to re-login
- No downtime

**Recommended Grace Period:**
- Minimum: 24 hours (covers daily active users)
- Standard: 48 hours (covers weekend users)
- Extended: 72 hours (extra safety)

Monitor activity logs during this period:
- Check for authentication errors
- Verify new tokens are being issued
- Ensure old tokens validate correctly

### Step 5: Remove Previous Secret (2 minutes)

After grace period, remove the old secret:

```bash
npx wrangler secret delete JWT_SECRET_PREVIOUS
```

**Verify:**
```bash
npx wrangler secret list
# Should only show JWT_SECRET
```

**Important:** After removing `JWT_SECRET_PREVIOUS`, all tokens signed with the old secret will be invalid. Users with those tokens will need to re-login.

### Step 6: Update Documentation (1 minute)

Record the rotation:
- Date of rotation
- Next rotation due date (90 days)
- Any issues encountered

## Rollback Procedure

If problems occur during rotation:

### Immediate Rollback (Within grace period)

```bash
# Swap secrets back
npx wrangler secret put JWT_SECRET
# Paste value from JWT_SECRET_PREVIOUS

# Can optionally keep previous for extra safety
# Or delete it
npx wrangler secret delete JWT_SECRET_PREVIOUS
```

### After Grace Period

If old secret was already deleted:
1. Users will be logged out
2. Must re-login with credentials
3. New tokens issued with current secret

**Prevention:** Always maintain grace period before deleting old secret.

## Automated Rotation (Advanced)

For fully automated rotation, create a scheduled Worker:

```javascript
// scheduled-rotation.js
export async function scheduled(event, env, ctx) {
  // Check if rotation is due (every 90 days)
  const lastRotation = await env.KV.get('last_jwt_rotation');
  const daysSince = (Date.now() - lastRotation) / (1000 * 60 * 60 * 24);

  if (daysSince >= 90) {
    // Generate new secret
    const newSecret = generateSecureSecret();

    // Update secrets via API
    await updateSecret('JWT_SECRET_PREVIOUS', env.JWT_SECRET);
    await updateSecret('JWT_SECRET', newSecret);

    // Store rotation date
    await env.KV.put('last_jwt_rotation', Date.now());

    // Schedule deletion of previous secret (72 hours)
    await scheduleSecretDeletion('JWT_SECRET_PREVIOUS', 72);

    // Send notification
    await notifyAdmins('JWT secret rotated successfully');
  }
}
```

**Note:** This requires additional setup and is optional.

## Testing Rotation

### Local Testing

1. **Create test tokens:**
   ```javascript
   // With old secret
   const oldToken = await createJWT({ userId: 1 }, OLD_SECRET);

   // With new secret
   const newToken = await createJWT({ userId: 1 }, NEW_SECRET);
   ```

2. **Test verification:**
   ```javascript
   // Should work with new secret
   await verifyJWT(newToken, NEW_SECRET, OLD_SECRET);

   // Should work with old secret (during grace period)
   await verifyJWT(oldToken, NEW_SECRET, OLD_SECRET);

   // Should fail after removing old secret
   await verifyJWT(oldToken, NEW_SECRET, null);
   ```

### Production Testing

1. **Before rotation:**
   - Login and save token
   - Verify API calls work

2. **After setting new secret:**
   - New login should work
   - Old token should still work (grace period)

3. **After removing old secret:**
   - Old token should fail
   - New token should work
   - Can login and get new token

## Troubleshooting

### Users Getting "Unauthorized - Invalid token" Errors

**Cause:** Old tokens no longer valid (previous secret deleted too early)

**Solution:**
1. Users must re-login
2. Extend grace period next time

### New Logins Not Working

**Cause:** New secret not properly set

**Solution:**
1. Verify `JWT_SECRET` with `wrangler secret list`
2. Check for typos in secret value
3. Verify deployment succeeded

### Both Secrets Expired

**Cause:** Both `JWT_SECRET` and `JWT_SECRET_PREVIOUS` are old

**Solution:**
1. Generate new secret
2. Set as `JWT_SECRET`
3. All users must re-login

## Security Best Practices

1. **Secret Storage:**
   - Never commit secrets to git
   - Store in password manager or vault
   - Use environment variables locally
   - Use Wrangler secrets in production

2. **Secret Generation:**
   - Use cryptographically secure random generators
   - Minimum 64 characters (128 recommended)
   - Use hex or base64 encoding

3. **Rotation Schedule:**
   - Rotate every 90 days (minimum)
   - Rotate immediately if compromised
   - Rotate after team member changes

4. **Access Control:**
   - Limit who can access secrets
   - Audit secret access
   - Use role-based access control

5. **Monitoring:**
   - Track failed authentication attempts
   - Monitor for unusual token patterns
   - Alert on unexpected secret changes

## Emergency Rotation

If secret is compromised:

1. **Immediate:**
   ```bash
   # Generate new secret immediately
   NEW_SECRET=$(openssl rand -hex 64)

   # Set new secret (no grace period)
   npx wrangler secret put JWT_SECRET
   # Paste NEW_SECRET

   # Delete old secret immediately
   npx wrangler secret delete JWT_SECRET_PREVIOUS
   ```

2. **Notify Users:**
   - All users will be logged out
   - Send email/notification about forced logout
   - Advise password change if secret exposure is severe

3. **Investigate:**
   - Determine how secret was compromised
   - Check logs for unauthorized access
   - Review security practices

4. **Prevent:**
   - Implement secret scanning in CI/CD
   - Add git hooks to prevent secret commits
   - Review access controls

## Checklist

Use this checklist for each rotation:

- [ ] Generate new secret (64+ characters)
- [ ] Store new secret securely
- [ ] Set `JWT_SECRET_PREVIOUS` to current `JWT_SECRET`
- [ ] Verify both secrets are set
- [ ] Set `JWT_SECRET` to new secret
- [ ] Verify new secret is set
- [ ] Test new logins work
- [ ] Test old tokens still work
- [ ] Wait grace period (48-72 hours)
- [ ] Monitor for errors
- [ ] Delete `JWT_SECRET_PREVIOUS`
- [ ] Verify old tokens now fail
- [ ] Record rotation date
- [ ] Schedule next rotation (90 days)

## Support

If you encounter issues during rotation:

1. Check this guide first
2. Review Cloudflare Workers logs
3. Check activity logs for patterns
4. Test locally with both secrets
5. Contact support if needed

**Next Rotation Due:** [Add 90 days to last rotation date]

Your JWT secrets are now configured for secure rotation!
