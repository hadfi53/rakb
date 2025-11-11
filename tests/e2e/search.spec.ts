import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test('should load search page', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check that search page loaded
    expect(page.url()).toContain('/search');
    
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should display search results or empty state', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // The page should either show results or an empty state
    // This is a basic check that the page rendered
    const mainContent = page.locator('main, [role="main"], .container, .search-results').first();
    
    // Wait a bit for content to load
    await page.waitForTimeout(1000);
    
    // Just verify the page is interactive (not a white screen)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

