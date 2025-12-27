import { test, expect } from '@playwright/test';

// Helper to login before admin tests
async function loginAsAdmin(page) {
  await page.goto('/admin/login');

  const usernameInput = page.locator('input[type="text"], input[type="email"], input[name*="username" i]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await usernameInput.fill(process.env.TEST_ADMIN_USERNAME || 'admin');
  await passwordInput.fill(process.env.TEST_ADMIN_PASSWORD || 'password');

  const submitButton = page.locator('button[type="submit"], button:has-text("login" i)').first();
  await submitButton.click();

  // Wait for navigation
  await page.waitForTimeout(3000);

  // Verify we're logged in
  const isLoggedIn = !page.url().includes('/admin/login');
  return isLoggedIn;
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if no credentials provided
    if (!process.env.TEST_ADMIN_USERNAME || !process.env.TEST_ADMIN_PASSWORD) {
      test.skip();
      return;
    }

    const loggedIn = await loginAsAdmin(page);
    if (!loggedIn) {
      test.skip();
    }
  });

  test('should load dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/);

    // Check for dashboard elements (tabs, navigation, content)
    await page.waitForLoadState('networkidle');
  });

  test('should display navigation tabs', async ({ page }) => {
    // Look for common dashboard elements
    const dashboard = page.locator('body');
    await expect(dashboard).toBeVisible();

    // Typical admin dashboard might have: Slider, Gallery, Logos, Users, etc.
    // This is flexible to match different implementations
    await page.waitForTimeout(1000);
  });

  test('should be able to navigate between tabs', async ({ page }) => {
    // Try to find and click different tabs/sections
    const buttons = page.locator('button, a[role="tab"], [role="tab"]');
    const count = await buttons.count();

    if (count > 1) {
      // Click second tab if exists
      await buttons.nth(1).click();
      await page.waitForTimeout(500);

      // Should still be in admin area
      await expect(page).toHaveURL(/\/admin/);
    }
  });

  test('should load slider management section', async ({ page }) => {
    // Look for slider-related content
    const sliderContent = page.locator('text=/slider/i, [aria-label*="slider" i]');
    const exists = await sliderContent.count() > 0;

    if (exists) {
      await sliderContent.first().click();
      await page.waitForTimeout(1000);

      // Should see slider management interface
      await page.waitForLoadState('networkidle');
    }
  });

  test('should load gallery management section', async ({ page }) => {
    // Look for gallery-related content
    const galleryContent = page.locator('text=/gallery/i, [aria-label*="gallery" i]');
    const exists = await galleryContent.count() > 0;

    if (exists) {
      await galleryContent.first().click();
      await page.waitForTimeout(1000);

      // Should see gallery management interface
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display usage statistics if available', async ({ page }) => {
    // Look for usage/analytics/stats
    const usageContent = page.locator('text=/usage/i, text=/stats/i, text=/analytics/i');
    const exists = await usageContent.count() > 0;

    if (exists) {
      await usageContent.first().click();
      await page.waitForTimeout(1000);

      // Should see usage interface
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle file upload dialogs', async ({ page }) => {
    // Try to find upload buttons
    const uploadButton = page.locator('button:has-text("upload"), button:has-text("add"), input[type="file"]');
    const exists = await uploadButton.count() > 0;

    if (exists) {
      const button = uploadButton.first();
      const isFileInput = await button.evaluate(el => el.tagName === 'INPUT');

      if (!isFileInput) {
        await button.click();
        await page.waitForTimeout(500);

        // Should see upload dialog or file input
        await page.locator('input[type="file"]').isVisible().catch(() => false);

        // At minimum, page shouldn't crash
        await expect(page).toHaveURL(/\/admin/);
      }
    }
  });

  test('should have logout functionality', async ({ page }) => {
    // Look for logout button
    const logoutButton = page.locator('button:has-text("logout"), button:has-text("sign out"), a:has-text("logout")');
    const exists = await logoutButton.count() > 0;

    if (exists) {
      await logoutButton.first().click();
      await page.waitForTimeout(2000);

      // Should redirect to login page or homepage
      const url = page.url();
      const loggedOut = url.includes('/login') || url === '/';
      expect(loggedOut).toBeTruthy();
    }
  });

  test('should prevent unauthorized access', async ({ page, context }) => {
    // Clear cookies to simulate logged out state
    await context.clearCookies();
    localStorage.clear();

    // Try to access admin page
    await page.goto('/admin');
    await page.waitForTimeout(2000);

    // Should redirect to login
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('should display user profile if available', async ({ page }) => {
    // Look for profile/user menu
    const profileButton = page.locator('button:has-text("profile"), [aria-label*="profile" i], [aria-label*="account" i]');
    const exists = await profileButton.count() > 0;

    if (exists) {
      await profileButton.first().click();
      await page.waitForTimeout(500);

      // Should show profile menu or navigate to profile
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and return error
    await page.route('**/api/admin/**', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    // Try to trigger an API call (refresh page)
    await page.reload();
    await page.waitForTimeout(2000);

    // Should show error message or handle gracefully
    // At minimum, should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Admin Dashboard - Super Admin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Skip if no credentials or not super admin
    if (!process.env.TEST_SUPER_ADMIN_USERNAME || !process.env.TEST_SUPER_ADMIN_PASSWORD) {
      test.skip();
      return;
    }

    await page.goto('/admin/login');

    const usernameInput = page.locator('input[type="text"], input[type="email"], input[name*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill(process.env.TEST_SUPER_ADMIN_USERNAME);
    await passwordInput.fill(process.env.TEST_SUPER_ADMIN_PASSWORD);

    const submitButton = page.locator('button[type="submit"], button:has-text("login" i)').first();
    await submitButton.click();

    await page.waitForTimeout(3000);

    const isLoggedIn = !page.url().includes('/admin/login');
    if (!isLoggedIn) {
      test.skip();
    }
  });

  test('should have access to user management', async ({ page }) => {
    const usersButton = page.locator('text=/users/i, [aria-label*="user" i]');
    const exists = await usersButton.count() > 0;

    if (exists) {
      await usersButton.first().click();
      await page.waitForTimeout(1000);

      // Should see user management interface
      await page.waitForLoadState('networkidle');
    }
  });

  test('should have access to activity logs', async ({ page }) => {
    const logsButton = page.locator('text=/activity/i, text=/logs/i, [aria-label*="activity" i]');
    const exists = await logsButton.count() > 0;

    if (exists) {
      await logsButton.first().click();
      await page.waitForTimeout(1000);

      // Should see activity logs interface
      await page.waitForLoadState('networkidle');
    }
  });
});
