import { test, expect } from '@playwright/test';

/**
 * Public homepage content-rendering E2E tests.
 *
 * Hermetic: no real backend. The homepage server component (app/page.jsx)
 * tries to prefetch hero data server-side, but in this environment the API host
 * (http://localhost:8787) is unreachable, so it falls back to null/[] and the
 * CLIENT fetch is what populates the page. We intercept those client requests
 * with a broad page.route glob over the API path.
 *
 * Confirmed against source:
 *  - src/components/Hero.jsx        -> renders <h1> from content.hero_title via
 *    dangerouslySetInnerHTML; fetches /api/slider (array of { cdn_url, ... }).
 *  - src/hooks/usePageContent.js    -> GET /api/page-content returns an object
 *    keyed by content keys (e.g. { hero_title: "..." }); cached in sessionStorage.
 *  - src/services/api.js            -> getPublicPageContent() => /api/page-content,
 *    getSliderImages() => /api/slider, getGalleryImages() => /api/gallery,
 *    getLogos() => /api/logos (all skipAuth public GETs).
 */

const json = (body, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

/**
 * Install public-endpoint mocks. `pageContent` lets each test inject its own
 * fixture so we can assert the rendered content reflects the mocked data.
 */
async function mockPublicApi(page, { pageContent }) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/api/page-content')) {
      return route.fulfill(json(pageContent));
    }

    // Slider/gallery/logos: empty arrays are valid and keep components happy.
    return route.fulfill(json([]));
  });
}

test.describe('Public homepage content rendering', () => {
  // sessionStorage caches page content for 30s, but each test runs in a fresh
  // browser context, so caches never leak between tests.

  test('renders the mocked hero title', async ({ page }) => {
    const heroTitle = 'Cinematic Storytelling E2E';
    await mockPublicApi(page, {
      pageContent: { hero_title: heroTitle, about_title: 'About Us E2E' },
    });

    await page.goto('/');

    // The hero <h1> is populated from content.hero_title via the client fetch.
    await expect(
      page.getByRole('heading', { level: 1, name: heroTitle })
    ).toBeVisible({ timeout: 15000 });
  });

  test('reflects a different region content fixture', async ({ page }) => {
    // Region selection is server-side (by host), but this exercises the same
    // content pipeline with distinct values to prove rendering follows the data.
    const heroTitle = 'Premium Productions UAE E2E';
    await mockPublicApi(page, {
      pageContent: { hero_title: heroTitle, about_title: 'About UAE E2E' },
    });

    await page.goto('/');

    await expect(
      page.getByRole('heading', { level: 1, name: heroTitle })
    ).toBeVisible({ timeout: 15000 });

    // And the previous region's title is NOT present.
    await expect(page.getByText('Cinematic Storytelling E2E')).toHaveCount(0);
  });
});
