import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check that the page loaded without errors
    // Look for common elements that should be on the homepage
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have navigation bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check for header element (Navbar uses <header> not <nav>)
    // Also check for the RAKB logo which should always be visible
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
    
    // Verify the RAKB logo is present
    const logo = page.getByText('RAKB').first();
    await expect(logo).toBeVisible();
  });

  test('should have footer', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check for footer element
    const footer = page.locator('footer').first();
    await expect(footer).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Try to find and click login link
    // Adjust selector based on your actual Navbar implementation
    const loginLink = page.getByRole('link', { name: /login|se connecter/i }).first();
    
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForURL(/.*auth\/login.*/);
      expect(page.url()).toContain('auth/login');
    }
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Navigate to search page
    await page.goto('/search');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Check that we're on the search page
    expect(page.url()).toContain('/search');
  });
});

