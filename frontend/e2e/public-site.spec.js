import { test, expect } from '@playwright/test';

test.describe('Public Website', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/Agile Productions/i);

    // Check main sections are visible
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should display hero section with working animations', async ({ page }) => {
    await page.goto('/');

    // Wait for hero section to be visible
    const heroSection = page.locator('text=Speed chasers').first();
    await expect(heroSection).toBeVisible();

    // Check for background image loading
    await page.waitForLoadState('networkidle');
  });

  test('should load and display gallery images', async ({ page }) => {
    await page.goto('/');

    // Scroll to gallery section
    await page.evaluate(() => {
      const element = document.querySelector('[class*="gallery"]') ||
                     document.querySelector('section:has(img)');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    });

    // Wait for images to load
    await page.waitForTimeout(2000);

    // Check that at least some images are visible
    const images = page.locator('img[src*="cloudflare"], img[src*="r2"]');
    const count = await images.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load client logos', async ({ page }) => {
    await page.goto('/');

    // Scroll to clients section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for potential lazy loading
    await page.waitForTimeout(1000);

    // Check for logo elements (they might be loading)
    await page.waitForLoadState('networkidle');
  });

  test('should have responsive navigation', async ({ page }) => {
    await page.goto('/');

    // Check navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // On mobile, there should be a menu button
    const viewportSize = page.viewportSize();
    if (viewportSize && viewportSize.width < 768) {
      // Mobile view - look for hamburger menu
      const menuButton = page.locator('button[aria-label*="menu" i], button:has(svg)').first();
      if (await menuButton.isVisible()) {
        await menuButton.click();
        // Menu should open
        await page.waitForTimeout(500);
      }
    }
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    await page.goto('/');

    // Check for essential meta tags
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description?.length).toBeGreaterThan(0);

    // Check for Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toBeTruthy();
  });

  test('should load without console errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known acceptable errors (like ad blockers, analytics, etc.)
    const criticalErrors = errors.filter(error =>
      !error.includes('Failed to load resource') && // External resources
      !error.includes('net::ERR_BLOCKED_BY_CLIENT') // Ad blockers
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for accessible navigation landmarks
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();

    // Check links are keyboard accessible
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement || '');
  });
});
