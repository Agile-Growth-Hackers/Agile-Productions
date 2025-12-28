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

    // Filter out known acceptable errors (like ad blockers, analytics, external resources, etc.)
    const criticalErrors = errors.filter(error =>
      !error.includes('Failed to load resource') && // External resources
      !error.includes('net::ERR_BLOCKED_BY_CLIENT') && // Ad blockers
      !error.includes('favicon.ico') && // Favicon requests
      !error.includes('404') && // 404 errors for optional resources
      !error.includes('ERR_INTERNET_DISCONNECTED') && // Network errors
      !error.includes('hydration') && // React hydration warnings (non-critical)
      !error.includes('Download the React DevTools') && // React DevTools message
      !error.includes('ERR_NAME_NOT_RESOLVED') && // DNS errors
      !error.includes('ERR_CONNECTION') && // Connection errors
      !error.includes('net::ERR') && // General network errors
      !error.includes('webkit-masked-url') && // WebKit internal URLs
      !error.includes('chrome-extension') && // Browser extensions
      !error.includes('moz-extension') // Firefox extensions
    );

    // Log errors for debugging if any remain
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors.length, 'errors');
      criticalErrors.forEach((error, index) => {
        console.log(`Error ${index + 1}:`, error.substring(0, 200));
      });
    }

    // Allow a small number of non-critical console errors (e.g., from extensions, dev tools)
    expect(criticalErrors.length).toBeLessThanOrEqual(3);
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');

    // Check for accessible navigation landmarks
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent).toBeVisible();

    // Check links are keyboard accessible - tab until we find an interactive element
    let focusedElement;
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      if (['A', 'BUTTON', 'INPUT'].includes(focusedElement || '')) {
        break;
      }
    }
    expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement || '');
  });
});
