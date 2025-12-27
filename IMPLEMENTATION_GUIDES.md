# Implementation Guides - Path to 100/100

This document contains step-by-step guides for completing all remaining improvements to reach 100/100.

**Current Score: 97/100** (after Option 1 completion)
**Target Score: 100/100**

---

## Table of Contents

1. [Complete CSRF Protection Integration](#1-complete-csrf-protection-integration) - 1 hour
2. [Complete Sentry Error Tracking Setup](#2-complete-sentry-error-tracking-setup) - 30 minutes
3. [Set Up Uptime Monitoring](#3-set-up-uptime-monitoring) - 15 minutes
4. [Implement Service Worker (PWA)](#4-implement-service-worker-pwa) - 6 hours
5. [Add E2E Testing with Playwright](#5-add-e2e-testing-with-playwright) - 12 hours
6. [Create API Documentation](#6-create-api-documentation) - 6 hours
7. [Implement JWT Secret Rotation](#7-implement-jwt-secret-rotation) - 3 hours
8. [Set Up GitHub Branch Protection](#8-set-up-github-branch-protection) - 5 minutes

---

## 1. Complete CSRF Protection Integration
**Time:** 1 hour
**Impact:** +1 point (Security 99 → 100)
**Priority:** HIGH

### Status
✅ CSRF middleware created (`workers/src/middleware/csrf.js`)
⏳ Needs integration with auth and frontend

### Step 1: Update Login Route (15 min)

**File:** `workers/src/routes/auth.js`

Find the login success response and add CSRF token:

```javascript
import { generateCsrfResponse } from '../middleware/csrf.js';

// In the login route, after successful authentication:
auth.post('/login', validateRequest(schemas.login), async (c) => {
  // ... existing auth logic ...

  if (isValid) {
    // Generate CSRF token
    const csrfData = await generateCsrfResponse(c);

    // Update last login
    await db.prepare(
      'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(admin.id).run();

    // Log successful login
    const logActivity = c.get('logActivity');
    if (logActivity) {
      await logActivity({
        actionType: 'login_success',
        description: `User ${sanitizedUsername} logged in successfully`
      });
    }

    return c.json({
      success: true,
      token: jwtToken,
      csrf: csrfData, // Add CSRF data to response
      user: {
        id: admin.id,
        username: admin.username,
        fullName: admin.full_name,
        email: admin.email,
        isSuperAdmin: admin.is_super_admin === 1,
        profilePictureUrl: admin.profile_picture_url
      }
    });
  }
  // ...
});
```

### Step 2: Apply CSRF Middleware (10 min)

**File:** `workers/src/index.js`

Add CSRF protection to all authenticated routes:

```javascript
import { csrfProtection } from './middleware/csrf.js';

// Apply CSRF protection to admin routes (after auth middleware)
app.use('/api/admin/*', authMiddleware, csrfProtection, adminRateLimit);
app.use('/api/v1/admin/*', authMiddleware, csrfProtection, adminRateLimit);

// Apply to protected routes
app.use('/api/storage*', authMiddleware, csrfProtection);
app.use('/api/slider*', (c, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(c.req.method)) {
    return csrfProtection(c, next);
  }
  return next();
});
// Repeat for gallery, logos, users, etc.
```

### Step 3: Update Frontend API Service (20 min)

**File:** `frontend/src/services/api.js`

Add CSRF token storage and header:

```javascript
class API {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || '';
    this.csrfToken = null;
    this.csrfHeader = 'x-csrf-token';
  }

  // Store CSRF token from login response
  setCsrfToken(token, header) {
    this.csrfToken = token;
    if (header) this.csrfHeader = header;
    localStorage.setItem('csrf_token', token);
  }

  // Get CSRF token
  getCsrfToken() {
    if (!this.csrfToken) {
      this.csrfToken = localStorage.getItem('csrf_token');
    }
    return this.csrfToken;
  }

  // Clear CSRF token on logout
  clearCsrf() {
    this.csrfToken = null;
    localStorage.removeItem('csrf_token');
  }

  // Update request method to include CSRF header
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getToken();

    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Add CSRF token for state-changing requests
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      const csrf = this.getCsrfToken();
      if (csrf) {
        headers[this.csrfHeader] = csrf;
      }
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // ... rest of request logic ...
    } catch (error) {
      // ...
    }
  }

  // Update login method
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    this.setToken(data.token);

    // Store CSRF token
    if (data.csrf) {
      this.setCsrfToken(data.csrf.csrfToken, data.csrf.csrfHeader);
    }

    return data;
  }

  // Update logout to clear CSRF
  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.clearAuth();
      this.clearCsrf(); // Add this
    }
  }
}
```

### Step 4: Test CSRF Protection (15 min)

```bash
# Test login gets CSRF token
curl -X POST https://your-api.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt -v

# Test protected request without CSRF token (should fail)
curl -X POST https://your-api.workers.dev/api/slider \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"..."}' \
  -b cookies.txt

# Test protected request with CSRF token (should succeed)
curl -X POST https://your-api.workers.dev/api/slider \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"..."}' \
  -b cookies.txt
```

---

## 2. Complete Sentry Error Tracking Setup
**Time:** 30 minutes
**Impact:** +1 point (Production Readiness 96 → 97)
**Priority:** HIGH

### Status
✅ Sentry packages installed
✅ Backend infrastructure created
⏳ Needs DSN configuration and frontend setup

### Step 1: Create Sentry Project (10 min)

1. Go to https://sentry.io/signup/
2. Create free account
3. Create new project:
   - Platform: **JavaScript** (for frontend)
   - **Node.js** (for backend)
4. Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### Step 2: Add Sentry DSN to GitHub Secrets (2 min)

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click **New repository secret**
3. Name: `SENTRY_DSN`
4. Value: Your Sentry DSN
5. Click **Add secret**

### Step 3: Initialize Sentry in Backend (5 min)

**File:** `workers/src/index.js`

Add at the top of the file:

```javascript
import { initErrorTracking } from './utils/error-tracking.js';

// Initialize error tracking
const SENTRY_DSN = process.env.SENTRY_DSN || ''; // Will be available via wrangler secrets
if (SENTRY_DSN) {
  initErrorTracking(SENTRY_DSN, 'production');
}
```

Add Sentry DSN as Wrangler secret:

```bash
cd workers
npx wrangler secret put SENTRY_DSN
# Paste your Sentry DSN when prompted
```

### Step 4: Set Up Frontend Sentry (10 min)

Check if frontend Sentry is installed:

```bash
cd frontend
# Should already be installed from earlier
```

**File:** `frontend/src/utils/sentryConfig.js` (create new file)

```javascript
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (dsn) {
    Sentry.init({
      dsn,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }
}
```

**File:** `frontend/src/main.jsx`

Add Sentry initialization:

```javascript
import { initSentry } from './utils/sentryConfig';

// Initialize Sentry
initSentry();

// ... rest of main.jsx
```

### Step 5: Add Sentry DSN to Frontend Build (3 min)

**Update GitHub workflow:** `.github/workflows/frontend-ci.yml`

```yaml
- name: Build frontend
  run: npm run build
  env:
    VITE_API_URL: ${{ secrets.VITE_API_URL }}
    VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }} # Add this line
```

---

## 3. Set Up Uptime Monitoring
**Time:** 15 minutes
**Impact:** +1 point (Production Readiness 97 → 98)
**Priority:** MEDIUM

### Option 1: UptimeRobot (FREE, 5-minute checks)

1. Go to https://uptimerobot.com/
2. Create free account
3. Click **Add New Monitor**
4. Configure:
   - Monitor Type: **HTTP(s)**
   - Friendly Name: `Agile Productions API`
   - URL: `https://agile-productions-api.cool-bonus-e67f.workers.dev/health`
   - Monitoring Interval: **5 minutes**
5. Add Alert Contacts (your email)
6. Click **Create Monitor**

Repeat for frontend:
- URL: `https://agileproductions.in/`

### Option 2: Cloudflare Health Checks (PAID, 1-minute checks)

1. Cloudflare Dashboard → Health Checks
2. Create Health Check:
   - Name: `API Health Check`
   - URL: `https://agile-productions-api.cool-bonus-e67f.workers.dev/health`
   - Interval: **1 minute**
   - Expected Codes: `200`
3. Configure notifications

---

## 4. Implement Service Worker (PWA)
**Time:** 6 hours
**Impact:** +2 points (Performance 98 → 100)
**Priority:** MEDIUM

### Step 1: Install Workbox (10 min)

```bash
cd frontend
npm install workbox-precaching workbox-routing workbox-strategies --save
npm install vite-plugin-pwa --save-dev
```

### Step 2: Configure Vite PWA Plugin (20 min)

**File:** `frontend/vite.config.js`

```javascript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/*.otf', 'favicon.ico'],
      manifest: {
        name: 'Agile Productions',
        short_name: 'Agile',
        description: 'Speed chasers, storytellers, and visual engineers',
        theme_color: '#1f2937',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'https://r2.agileproductions.in/logos/site/icon-192.webp',
            sizes: '192x192',
            type: 'image/webp'
          },
          {
            src: 'https://r2.agileproductions.in/logos/site/icon-512.webp',
            sizes: '512x512',
            type: 'image/webp'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/r2\.agileproductions\.in\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.workers\.dev\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ],
  // ... rest of config
});
```

### Step 3: Create Icons (30 min)

Create PWA icons in multiple sizes:
- 192x192
- 512x512
- Upload to R2 at `logos/site/icon-192.webp` and `icon-512.webp`

### Step 4: Test PWA (30 min)

```bash
npm run build
npm run preview
```

Open Chrome DevTools → Application → Service Workers
- Verify service worker is registered
- Check manifest
- Test offline mode

### Step 5: Add Install Prompt (2 hours)

**File:** `frontend/src/components/PWAInstallPrompt.jsx` (create new)

```javascript
import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-sm">
      <h3 className="font-bold mb-2">Install Agile Productions</h3>
      <p className="text-sm text-gray-600 mb-4">
        Install our app for quick access and offline support!
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Install
        </button>
        <button
          onClick={() => setShowPrompt(false)}
          className="bg-gray-200 px-4 py-2 rounded"
        >
          Not Now
        </button>
      </div>
    </div>
  );
}
```

Add to `App.jsx`:

```javascript
import PWAInstallPrompt from './components/PWAInstallPrompt';

function App() {
  return (
    <>
      {/* ... existing routes ... */}
      <PWAInstallPrompt />
    </>
  );
}
```

---

## 5. Add E2E Testing with Playwright
**Time:** 12 hours
**Impact:** +3 points (Industry Standards 92 → 95)
**Priority:** MEDIUM

### Step 1: Install Playwright (15 min)

```bash
npm init playwright@latest

# Select options:
# - TypeScript or JavaScript? JavaScript
# - Where to put tests? tests
# - Add GitHub Actions workflow? Yes
# - Install browsers? Yes
```

### Step 2: Configure Playwright (30 min)

**File:** `playwright.config.js`

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 3: Write E2E Tests (8 hours)

**File:** `tests/e2e/auth.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'your-test-password');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/admin');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/admin/login');

    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrong-password');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });
});
```

**File:** `tests/e2e/slider.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test.describe('Slider Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/admin/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'your-test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin');
  });

  test('should upload slider image', async ({ page }) => {
    // Navigate to slider section
    await page.click('text=Slider');

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg');

    await expect(page.locator('text=Image uploaded successfully')).toBeVisible();
  });

  test('should reorder slider images', async ({ page }) => {
    await page.click('text=Slider');

    // Get first image
    const firstImage = page.locator('[data-testid="slider-image"]').first();
    const firstImageSrc = await firstImage.getAttribute('src');

    // Drag and drop (implementation depends on your DnD library)
    // ...

    // Verify order changed
    const newFirstImage = page.locator('[data-testid="slider-image"]').first();
    const newFirstImageSrc = await newFirstImage.getAttribute('src');
    expect(newFirstImageSrc).not.toBe(firstImageSrc);
  });
});
```

**File:** `tests/e2e/gallery.spec.js`
**File:** `tests/e2e/users.spec.js`
etc.

### Step 4: Add Test Fixtures (1 hour)

Create `tests/fixtures/` directory with test images, data, etc.

### Step 5: Run Tests (30 min)

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.js

# Run in UI mode (interactive)
npx playwright test --ui

# Generate HTML report
npx playwright show-report
```

### Step 6: Add to CI/CD (30 min)

The GitHub Actions workflow was automatically created at `.github/workflows/playwright.yml`

Update it to run on PRs:

```yaml
name: Playwright Tests
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npx playwright test
        env:
          BASE_URL: https://agileproductions.in
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## 6. Create API Documentation
**Time:** 6 hours
**Impact:** +2 points (Industry Standards 95 → 97)
**Priority:** LOW

### Step 1: Install Hono OpenAPI (30 min)

```bash
cd workers
npm install @hono/zod-openapi zod
```

### Step 2: Define API Schemas (3 hours)

**File:** `workers/src/schemas/api.js` (create new)

```javascript
import { z } from 'zod';

// Auth schemas
export const LoginSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

export const LoginResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  csrf: z.object({
    csrfToken: z.string(),
    csrfHeader: z.string(),
  }),
  user: z.object({
    id: z.number(),
    username: z.string(),
    fullName: z.string().nullable(),
    email: z.string().email().nullable(),
    isSuperAdmin: z.boolean(),
    profilePictureUrl: z.string().nullable(),
  }),
});

// Slider schemas
export const SliderImageSchema = z.object({
  id: z.number(),
  cdn_url: z.string(),
  object_position: z.string(),
  display_order: z.number(),
  is_active: z.boolean(),
});

// ... more schemas
```

### Step 3: Create OpenAPI Routes (2 hours)

**File:** `workers/src/routes/api-docs.js` (create new)

```javascript
import { OpenAPIHono } from '@hono/zod-openapi';
import { LoginSchema, LoginResponseSchema } from '../schemas/api.js';

const docs = new OpenAPIHono();

// Document login endpoint
docs.openapi(
  {
    method: 'post',
    path: '/api/auth/login',
    description: 'Authenticate user and receive JWT token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: LoginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successful login',
        content: {
          'application/json': {
            schema: LoginResponseSchema,
          },
        },
      },
      401: {
        description: 'Invalid credentials',
      },
    },
    tags: ['Authentication'],
  },
  async (c) => {
    // Implementation is in the actual auth route
    // This is just for documentation
  }
);

// Add all other endpoints...

export default docs;
```

### Step 4: Generate Swagger UI (30 min)

**File:** `workers/src/index.js`

```javascript
import { swaggerUI } from '@hono/swagger-ui';

// Serve API documentation
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

// Serve OpenAPI spec
app.get('/api/openapi.json', (c) => {
  return c.json({
    openapi: '3.0.0',
    info: {
      title: 'Agile Productions API',
      version: '1.0.0',
      description: 'API documentation for Agile Productions CMS',
    },
    servers: [
      {
        url: 'https://agile-productions-api.cool-bonus-e67f.workers.dev',
        description: 'Production server',
      },
    ],
    // ... rest of OpenAPI spec
  });
});
```

### Step 5: Test Documentation (1 hour)

Visit: `https://agile-productions-api.cool-bonus-e67f.workers.dev/api/docs`

Verify all endpoints are documented with:
- Request/response schemas
- Example requests
- Try it out functionality

---

## 7. Implement JWT Secret Rotation
**Time:** 3 hours
**Impact:** +1 point (Security 99 → 100)
**Priority:** LOW

### Step 1: Create Rotation Utility (1 hour)

**File:** `workers/src/utils/jwt-rotation.js` (create new)

```javascript
/**
 * JWT Secret Rotation
 * Supports multiple valid secrets for seamless rotation
 */

export class JWTSecretManager {
  constructor(secrets = []) {
    // secrets should be an array like:
    // [
    //   { key: 'current-secret', expires: Date.now() + 30 * 24 * 60 * 60 * 1000 },
    //   { key: 'old-secret', expires: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    // ]
    this.secrets = secrets;
  }

  // Get current secret for signing new tokens
  getCurrentSecret() {
    const now = Date.now();
    const valid = this.secrets.filter(s => s.expires > now);

    if (valid.length === 0) {
      throw new Error('No valid JWT secrets available');
    }

    // Return the newest secret
    return valid.sort((a, b) => b.expires - a.expires)[0].key;
  }

  // Get all valid secrets for verification
  getValidSecrets() {
    const now = Date.now();
    return this.secrets
      .filter(s => s.expires > now)
      .map(s => s.key);
  }

  // Add new secret for rotation
  rotate(newSecret, expiresInDays = 30) {
    const expires = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

    this.secrets.push({
      key: newSecret,
      expires,
    });

    // Remove expired secrets
    this.cleanup();
  }

  // Remove expired secrets
  cleanup() {
    const now = Date.now();
    this.secrets = this.secrets.filter(s => s.expires > now);
  }
}

// Example usage:
// const manager = new JWTSecretManager([
//   { key: process.env.JWT_SECRET, expires: Date.now() + 30 * 24 * 60 * 60 * 1000 },
// ]);
//
// // Sign with current secret
// const token = await sign(payload, manager.getCurrentSecret());
//
// // Verify with any valid secret
// for (const secret of manager.getValidSecrets()) {
//   try {
//     const payload = await verify(token, secret);
//     return payload;
//   } catch (e) {
//     continue;
//   }
// }
```

### Step 2: Update JWT Utilities (1 hour)

**File:** `workers/src/utils/jwt.js`

```javascript
import { sign as joseSign, verify as joseVerify } from 'jose';
import { JWTSecretManager } from './jwt-rotation.js';

// Initialize secret manager from environment
function getSecretManager(env) {
  const secrets = [];

  // Current secret
  if (env.JWT_SECRET) {
    secrets.push({
      key: env.JWT_SECRET,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  // Old secret (during rotation period)
  if (env.JWT_SECRET_OLD) {
    secrets.push({
      key: env.JWT_SECRET_OLD,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  return new JWTSecretManager(secrets);
}

export async function signToken(payload, env) {
  const manager = getSecretManager(env);
  const secret = manager.getCurrentSecret();

  const encoder = new TextEncoder();
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await joseSign(payload, secretKey, {
    algorithm: 'HS256',
    expiresIn: '24h',
  });
}

export async function verifyToken(token, env) {
  const manager = getSecretManager(env);
  const secrets = manager.getValidSecrets();

  // Try each valid secret
  for (const secret of secrets) {
    try {
      const encoder = new TextEncoder();
      const secretKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['verify']
      );

      const payload = await joseVerify(token, secretKey);
      return payload;
    } catch (e) {
      // Try next secret
      continue;
    }
  }

  throw new Error('Invalid token');
}
```

### Step 3: Rotation Process (1 hour)

**Create rotation script:** `workers/scripts/rotate-jwt-secret.sh`

```bash
#!/bin/bash

# Generate new JWT secret
NEW_SECRET=$(openssl rand -base64 32)

echo "New JWT Secret: $NEW_SECRET"
echo ""
echo "Rotation Steps:"
echo "1. Set JWT_SECRET_OLD to current JWT_SECRET value"
echo "2. Set JWT_SECRET to new value: $NEW_SECRET"
echo "3. Wait 24 hours (token expiry period)"
echo "4. Remove JWT_SECRET_OLD"
echo ""
echo "Commands:"
echo "npx wrangler secret put JWT_SECRET_OLD"
echo "# Paste current JWT_SECRET"
echo ""
echo "npx wrangler secret put JWT_SECRET"
echo "# Paste: $NEW_SECRET"
```

Run rotation:

```bash
chmod +x workers/scripts/rotate-jwt-secret.sh
./workers/scripts/rotate-jwt-secret.sh
```

---

## 8. Set Up GitHub Branch Protection
**Time:** 5 minutes
**Impact:** +1 point (Industry Standards 97 → 98)
**Priority:** HIGH

### Steps

1. Go to GitHub repository → **Settings** → **Branches**

2. Click **Add branch protection rule**

3. Branch name pattern: `main`

4. Enable these options:
   - ✅ **Require a pull request before merging**
     - Required approvals: 1
     - Dismiss stale pull request approvals
   - ✅ **Require status checks to pass before merging**
     - Search and add:
       - Backend CI/CD (test)
       - Frontend CI/CD (build-and-test)
       - Playwright Tests (if configured)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches**
     - Add yourself and trusted developers
   - ❌ **Allow force pushes** (keep disabled)
   - ❌ **Allow deletions** (keep disabled)

5. Click **Create** or **Save changes**

### Result

Now, every change to `main` requires:
- Creating a feature branch
- Opening a pull request
- Passing all CI tests
- Getting 1 approval
- All conversations resolved

---

## Summary of Remaining Work

| Task | Time | Points | Priority | Status |
|------|------|--------|----------|--------|
| Complete CSRF Integration | 1h | +1 | HIGH | ⏳ 90% done |
| Complete Sentry Setup | 30m | +1 | HIGH | ⏳ 80% done |
| Set Up Uptime Monitoring | 15m | +1 | MEDIUM | ❌ Not started |
| GitHub Branch Protection | 5m | +1 | HIGH | ❌ Not started |
| **TOTAL FOR 100/100** | **1h 50m** | **+4** | | |
| | | | | |
| Service Worker (PWA) | 6h | +2 | MEDIUM | ❌ Optional |
| E2E Testing | 12h | +3 | MEDIUM | ❌ Optional |
| API Documentation | 6h | +2 | LOW | ❌ Optional |
| JWT Rotation | 3h | +1 | LOW | ❌ Optional |

---

## Quick Path to 100/100

Do these 4 tasks in order (< 2 hours total):

1. ✅ **GitHub Branch Protection** (5 min) - +1 point
2. ✅ **Complete Sentry Setup** (30 min) - +1 point
3. ✅ **Set Up Uptime Monitoring** (15 min) - +1 point
4. ✅ **Complete CSRF Integration** (1 hour) - +1 point

**Result: 100/100! 🎉**

---

## Need Help?

Each section has detailed step-by-step instructions. Follow them in order, test after each step, and commit your changes.

For questions or issues, refer to:
- Cloudflare Workers docs: https://developers.cloudflare.com/workers/
- Sentry docs: https://docs.sentry.io/
- Playwright docs: https://playwright.dev/
- OpenAPI docs: https://swagger.io/specification/

Good luck reaching 100/100!
