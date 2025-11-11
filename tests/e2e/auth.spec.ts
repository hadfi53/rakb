import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/auth/login');
    // Wait for either networkidle or domcontentloaded (whichever comes first)
    // This is more reliable across browsers
    await Promise.race([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.waitForLoadState('domcontentloaded'),
    ]);
    
    expect(page.url()).toContain('auth/login');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load register page', async ({ page }) => {
    await page.goto('/auth/register');
    // Wait for either networkidle or domcontentloaded (whichever comes first)
    await Promise.race([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.waitForLoadState('domcontentloaded'),
    ]);
    
    expect(page.url()).toContain('auth/register');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should load forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    // Wait for either networkidle or domcontentloaded (whichever comes first)
    await Promise.race([
      page.waitForLoadState('networkidle').catch(() => {}),
      page.waitForLoadState('domcontentloaded'),
    ]);
    
    expect(page.url()).toContain('auth/forgot-password');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  // Note: Actual login/register tests would require test credentials
  // and should be added when you have a test environment set up
});

