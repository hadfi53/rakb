import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to about page', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    expect(page.url()).toContain('/about');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to contact page', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    expect(page.url()).toContain('/contact');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate to how-it-works page', async ({ page }) => {
    await page.goto('/how-it-works');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    expect(page.url()).toContain('/how-it-works');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page-12345');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Should either redirect or show 404
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

