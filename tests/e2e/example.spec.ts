import { test, expect } from '@playwright/test';

/**
 * Example test file - This is a template for creating new E2E tests
 * 
 * To create a new test:
 * 1. Copy this file and rename it (e.g., booking.spec.ts)
 * 2. Update the describe block with your feature name
 * 3. Add your test cases
 * 4. Run tests with: npm run test:e2e
 */

test.describe('Example Test Suite', () => {
  test('example test - should load homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Verify page loaded
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

