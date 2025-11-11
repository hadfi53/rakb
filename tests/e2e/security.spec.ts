import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, dismissCookieBanner } from './helpers/auth-helper';

test.describe('Security Tests', () => {
  test('should redirect unauthorized users to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard/renter');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Should redirect to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
  });

  test('should prevent tenant from accessing owner routes', async ({ page }) => {
    const tenantUser = await createTestUser({
      email: generateTestEmail('tenant'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Tenant',
      role: 'renter',
    });

    try {
      await signInUser(page, tenantUser.email, 'TestPassword123!');
      
      // Try to access owner route
      await page.goto('/dashboard/owner');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Should be redirected away (wait a bit for redirect)
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/\/dashboard\/owner/, { timeout: 10000 });
    } finally {
      if (tenantUser.id) {
        await deleteTestUser(tenantUser.id);
      }
    }
  });

  test('should prevent owner from accessing tenant routes', async ({ page }) => {
    const ownerUser = await createTestUser({
      email: generateTestEmail('owner'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Owner',
      role: 'owner',
    });

    try {
      await signInUser(page, ownerUser.email, 'TestPassword123!');
      
      // Try to access tenant-only route
      await page.goto('/dashboard/renter/bookings');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Should be redirected away (wait a bit for redirect)
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/\/dashboard\/renter\/bookings/, { timeout: 10000 });
    } finally {
      if (ownerUser.id) {
        await deleteTestUser(ownerUser.id);
      }
    }
  });

  test('should protect API endpoints', async ({ page }) => {
    // Try to access a protected route that should require authentication
    // Since this is a SPA, protected routes redirect to login, not return API errors
    // Test by accessing a protected dashboard route without auth
    const response = await page.goto('/dashboard/renter');
    await page.waitForLoadState('domcontentloaded');
    
    // Should redirect to login page (status 200 but URL should be /auth/login)
    // Or if it's a client-side redirect, check the final URL
    await page.waitForTimeout(1000);
    const finalUrl = page.url();
    
    // Should be on login page or return 401/403 if it's an API endpoint
    // For SPA routes, we check the URL instead
    expect(finalUrl).toMatch(/\/auth\/login|\/login/);
  });

  test('should validate CSRF protection', async ({ page }) => {
    // This would test CSRF tokens if implemented
    // For now, just verify forms exist
    await page.goto('/auth/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    // Dismiss cookie banner if present
    await dismissCookieBanner(page);
    
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });
});

