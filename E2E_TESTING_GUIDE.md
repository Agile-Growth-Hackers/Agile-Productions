# E2E Testing with Playwright

Comprehensive end-to-end testing setup using Playwright for browser automation.

## What's Tested?

Our E2E test suite covers:

1. **Public Website** (`public-site.spec.js`)
   - Homepage loading and rendering
   - Hero section animations
   - Gallery image loading
   - Client logos display
   - Responsive navigation
   - SEO meta tags
   - Console error checking
   - Accessibility basics

2. **Authentication** (`auth.spec.js`)
   - Login page loading
   - Empty credentials validation
   - Invalid credentials handling
   - Password visibility toggle
   - CSRF protection
   - Network error handling
   - Login persistence

3. **Admin Dashboard** (`admin-dashboard.spec.js`)
   - Dashboard loading
   - Tab navigation
   - Slider management
   - Gallery management
   - Usage statistics
   - File upload dialogs
   - Logout functionality
   - Unauthorized access prevention
   - API error handling
   - Super admin features

4. **Accessibility** (`accessibility.spec.js`)
   - Heading hierarchy
   - Image alt text
   - Keyboard navigation
   - Link text accessibility
   - Form labels
   - Color contrast
   - Focus indicators
   - ARIA roles
   - Skip navigation
   - Screen reader support
   - Auto-playing media

## Running Tests

### Prerequisites

Tests are already set up! Playwright and browsers are installed.

### Local Development

```bash
cd frontend

# Run all tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View last test report
npm run test:e2e:report
```

### Run Specific Tests

```bash
# Run only public site tests
npx playwright test public-site

# Run only auth tests
npx playwright test auth

# Run only on Chrome
npx playwright test --project=chromium

# Run only on mobile
npx playwright test --project=mobile-chrome
```

### Environment Variables

For tests requiring authentication:

```bash
# .env.test (create this file in frontend/)
TEST_ADMIN_USERNAME=your_admin_username
TEST_ADMIN_PASSWORD=your_admin_password
TEST_SUPER_ADMIN_USERNAME=your_superadmin_username
TEST_SUPER_ADMIN_PASSWORD=your_superadmin_password
```

**Note:** Admin tests will be skipped if credentials are not provided.

## Test Configuration

### Browsers Tested

- ✅ Chromium (Chrome, Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 13)

### Test Settings

- **Retries:** 2 on CI, 0 locally
- **Timeout:** 30 seconds per test
- **Workers:** 1 on CI (sequential), parallel locally
- **Screenshots:** On failure only
- **Videos:** Retained on failure
- **Traces:** On first retry

## Writing New Tests

### Basic Test Structure

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');

    const element = page.locator('selector');
    await expect(element).toBeVisible();
  });
});
```

### Common Patterns

#### Navigate and Wait

```javascript
await page.goto('/admin');
await page.waitForLoadState('networkidle');
```

#### Find and Click Elements

```javascript
const button = page.locator('button:has-text("Submit")');
await button.click();
```

#### Fill Forms

```javascript
await page.locator('input[name="email"]').fill('test@example.com');
await page.locator('input[name="password"]').fill('password123');
```

#### Check Visibility

```javascript
await expect(page.locator('.success-message')).toBeVisible();
```

#### Wait for Navigation

```javascript
await page.locator('a[href="/admin"]').click();
await page.waitForURL('/admin');
```

#### Test API Responses

```javascript
const response = await page.waitForResponse('/api/users');
expect(response.status()).toBe(200);
```

### Best Practices

1. **Use Descriptive Test Names**
   ```javascript
   test('should show error when email is invalid')
   ```

2. **Use Page Object Model for Complex Flows**
   ```javascript
   class LoginPage {
     constructor(page) {
       this.page = page;
       this.emailInput = page.locator('input[name="email"]');
     }

     async login(email, password) {
       await this.emailInput.fill(email);
       // ...
     }
   }
   ```

3. **Avoid Hard-Coded Waits**
   ```javascript
   // ❌ Bad
   await page.waitForTimeout(5000);

   // ✅ Good
   await page.waitForSelector('.loaded');
   ```

4. **Use Test Fixtures**
   ```javascript
   test.beforeEach(async ({ page }) => {
     await page.goto('/admin/login');
     // Setup code
   });
   ```

5. **Clean Up After Tests**
   ```javascript
   test.afterEach(async ({ page }) => {
     // Logout, delete test data, etc.
   });
   ```

## CI/CD Integration

E2E tests run automatically on:
- Pull requests to `main`
- Pushes to `main` branch

### GitHub Actions Workflow

Tests run after build succeeds:
1. Build frontend
2. Start preview server
3. Run Playwright tests
4. Upload test artifacts (screenshots, videos)

### Viewing CI Test Results

1. Go to GitHub Actions tab
2. Click on the workflow run
3. Check "E2E Tests" job
4. Download artifacts to view screenshots/videos

## Debugging Failed Tests

### Local Debugging

```bash
# Run in debug mode
npm run test:e2e:debug

# This opens a debugger where you can:
# - Step through tests line by line
# - Inspect elements
# - View network requests
# - Modify locators in real-time
```

### CI Debugging

1. Check test logs in GitHub Actions
2. Download artifacts (screenshots, videos, traces)
3. View trace with Playwright Trace Viewer:
   ```bash
   npx playwright show-trace trace.zip
   ```

### Common Issues

#### Test Timeout
```javascript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  await page.goto('/slow-page');
});
```

#### Element Not Found
```javascript
// Wait for element to appear
await page.waitForSelector('.dynamic-element', { timeout: 10000 });

// Or use more flexible locator
await page.locator('text=Submit').click();
```

#### Network Issues
```javascript
// Wait for specific network request
await page.waitForResponse(resp =>
  resp.url().includes('/api/data') && resp.status() === 200
);
```

## Test Coverage

Current coverage:
- ✅ Core user flows
- ✅ Authentication flows
- ✅ Admin functionality
- ✅ Accessibility basics
- ✅ Mobile responsiveness
- ✅ Error handling

## Continuous Improvement

### Adding More Tests

Priority areas for additional tests:
1. Image upload and compression
2. Drag-and-drop reordering
3. User management (CRUD operations)
4. Activity logs filtering
5. Profile picture updates
6. Multi-file operations

### Performance Testing

Playwright can also measure performance:

```javascript
test('should load quickly', async ({ page }) => {
  const start = Date.now();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const loadTime = Date.now() - start;

  expect(loadTime).toBeLessThan(3000); // 3 seconds
});
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)
- [Assertions](https://playwright.dev/docs/test-assertions)
- [Debugging](https://playwright.dev/docs/debug)

## Support

If tests fail:
1. Check test logs
2. Review screenshots/videos
3. Run locally with `npm run test:e2e:headed`
4. Use debug mode: `npm run test:e2e:debug`
5. Check for environment variable configuration

Your E2E testing suite is ready to ensure quality with every deployment!
