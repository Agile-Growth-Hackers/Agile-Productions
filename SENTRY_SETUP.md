# Sentry Error Tracking Setup Instructions

The Sentry error tracking integration is complete in the codebase. You just need to configure your Sentry DSN.

## Steps to Complete Setup

### 1. Create Sentry Account and Project (5 minutes)

1. Go to https://sentry.io and create a free account
2. Create a new project:
   - Platform: React (for frontend)
   - Name: agile-productions-frontend
3. You'll receive a DSN that looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### 2. Add DSN to GitHub Secrets (2 minutes)

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Name: `SENTRY_DSN`
5. Value: Your Sentry DSN from step 1
6. Click "Add secret"

### 3. Add DSN to Wrangler Secrets (2 minutes)

Run this command in the `workers` directory:

```bash
cd workers
npx wrangler secret put SENTRY_DSN
```

When prompted, paste your Sentry DSN and press Enter.

### 4. Verify Setup (Optional)

After the next deployment:
- Frontend errors will appear in your Sentry dashboard
- You can trigger a test error by adding this to your code temporarily:
  ```javascript
  throw new Error("Test Sentry error");
  ```

## What's Already Implemented

✅ Frontend Sentry configuration with session replay
✅ Performance monitoring (10% sample rate)
✅ User context tracking on login/logout
✅ Backend Sentry initialization
✅ Error filtering and environment-based configuration
✅ CI/CD workflow integration

## Configuration Details

- **Session Replay:** 10% of sessions, 100% on errors
- **Performance Traces:** 10% sample rate
- **Privacy:** All text masked, all media blocked
- **Environments:** Separate tracking for development/production

Once configured, you'll have real-time error tracking and performance monitoring for both frontend and backend!
