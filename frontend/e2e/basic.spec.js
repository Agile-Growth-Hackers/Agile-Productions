import { test, expect } from '@playwright/test';

test.describe('Basic Site Functionality', () => {
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Agile/i);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for navigation
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should display main content sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for main sections (basic visibility check)
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/\/admin\/login/);

    // Check for login form
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
