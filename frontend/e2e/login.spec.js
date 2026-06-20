import { test, expect } from '@playwright/test';

/**
 * Admin login flow E2E tests.
 *
 * Fully hermetic: there is no real backend in CI, so every `/api/**` request is
 * intercepted with `page.route`. The glob is intentionally broad so it matches
 * regardless of the API base URL/host (NEXT_PUBLIC_API_URL=http://localhost:8787).
 *
 * Confirmed against source:
 *  - src/admin/pages/LoginPage.jsx  -> inputs #username (text) + #password
 *    (via src/components/PasswordInput.jsx, type=password), submit button "Sign In",
 *    on success calls login() then router.push('/admin'); errors render in a
 *    red box with the thrown message.
 *  - src/context/AuthContext.jsx    -> login() reads data.token AND
 *    data.user.{id,username,fullName,email,isSuperAdmin,profilePictureUrl}.
 *  - src/services/api.js login()    -> POST /api/auth/login, stores data.token +
 *    optional data.csrfToken/csrfHeader; on non-ok throws errorData.error.
 *  - app/admin/page.jsx -> AdminApp -> ProtectedRoute (needs admin_token +
 *    admin_user in localStorage, both set by a successful login) -> RegionProvider
 *    (GET /api/admin/regions/me => { availableRegions, isSuperAdmin }) ->
 *    DashboardPage (renders "Admin Panel" heading + "Dashboard" tab).
 */

// Minimal valid login success body matching AuthContext.login()'s expectations.
const LOGIN_SUCCESS = {
  token: 'test-jwt',
  csrfToken: 'test-csrf',
  csrfHeader: 'x-csrf-token',
  user: {
    id: 1,
    username: 'testadmin',
    fullName: 'Test Admin',
    email: 'admin@example.com',
    isSuperAdmin: true,
    profilePictureUrl: null,
  },
};

// Regions bootstrap fixture consumed by RegionProvider on the dashboard.
const REGIONS_ME = {
  availableRegions: [{ code: 'in', name: 'India' }],
  isSuperAdmin: true,
};

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/**
 * Install a catch-all API mock. `loginStatus` controls the /api/auth/login
 * response so the same helper drives both the success and the 401 cases.
 * All other admin/public endpoints return empty-but-valid shapes so the
 * dashboard can mount without crashing or redirecting back to login.
 */
async function mockApi(page, { loginStatus = 200 } = {}) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Preflight, just in case.
    if (method === 'OPTIONS') {
      return route.fulfill({ status: 204, body: '' });
    }

    if (url.includes('/api/auth/login')) {
      if (loginStatus === 200) {
        return route.fulfill(json(LOGIN_SUCCESS));
      }
      return route.fulfill(json({ error: 'Invalid credentials' }, loginStatus));
    }

    if (url.includes('/api/admin/regions/me')) {
      return route.fulfill(json(REGIONS_ME));
    }

    // Dashboard sections fire many GET /api/admin/** calls on mount; return
    // empty arrays/objects so nothing throws. Match list-shaped vs object-shaped
    // endpoints loosely — empty array is safe for the .map() consumers, and the
    // usage/profile endpoints tolerate an empty object.
    if (url.includes('/api/admin/usage') || url.includes('/api/admin/profile')) {
      return route.fulfill(json({}));
    }

    // Default: empty list works for slider/gallery/logos/services/team/etc.
    return route.fulfill(json([]));
  });
}

async function fillCredentials(page) {
  await page.fill('#username', 'testadmin');
  await page.fill('#password', 'Password123!');
}

test.describe('Admin login flow', () => {
  test('logs in and reaches the dashboard', async ({ page }) => {
    await mockApi(page, { loginStatus: 200 });

    await page.goto('/admin/login');

    // LoginPage is dynamically imported (ssr:false) — wait for the real form.
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    await fillCredentials(page);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Asserts the app navigated away from /admin/login to the authenticated area.
    await page.waitForURL('**/admin', { timeout: 15000 });
    await expect(page).not.toHaveURL(/\/admin\/login/);

    // And that the dashboard actually rendered (not the redirect spinner).
    await expect(
      page.getByRole('heading', { name: 'Admin Panel' })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
  });

  test('shows an error and stays on login when credentials are rejected', async ({ page }) => {
    await mockApi(page, { loginStatus: 401 });

    await page.goto('/admin/login');
    await expect(page.locator('#username')).toBeVisible();

    await fillCredentials(page);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // The thrown error message ("Invalid credentials") is surfaced in the UI.
    await expect(page.getByText('Invalid credentials')).toBeVisible({ timeout: 15000 });

    // Still on the login page — no navigation to /admin.
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
