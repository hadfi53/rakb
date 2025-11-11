import { test, expect } from '@playwright/test';
import { createTestUser, deleteTestUser, generateTestEmail, signInUser, getSupabaseClient } from './helpers/auth-helper';

test.describe('Admin Login Flow', () => {
  let adminUser: any;

  test.beforeAll(async () => {
    adminUser = await createTestUser({
      email: generateTestEmail('admin'),
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'Admin',
      role: 'admin',
    });

    // Update profile to have admin role
    const supabase = getSupabaseClient(true);
    await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', adminUser.id);
  });

  test.afterAll(async () => {
    if (adminUser?.id) {
      await deleteTestUser(adminUser.id);
    }
  });

  test('should login with admin credentials', async ({ page }) => {
    await test.step('Navigate to login page', async () => {
      await page.goto('/auth/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    });

    await test.step('Login as admin', async () => {
      await signInUser(page, adminUser.email, 'TestPassword123!');
    });

    await test.step('Verify redirect to admin dashboard', async () => {
      // Should redirect to admin dashboard (route is /admin or /admin/users based on role-redirect.ts)
      await page.waitForTimeout(2000);
      await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    });
  });

  test('should enforce admin role access', async ({ page }) => {
    await signInUser(page, adminUser.email, 'TestPassword123!');
    
    // Try to access admin routes (route is /admin, not /admin/dashboard)
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    // Should have access (may be on dashboard or admin page)
    await expect(page.locator('text=/admin|dashboard|tableau|administrateur/i')).toBeVisible({ timeout: 10000 });
  });

  test('should prevent non-admin access to admin routes', async ({ page }) => {
    // Create regular user
    const regularUser = await createTestUser({
      email: generateTestEmail('regular'),
      password: 'TestPassword123!',
      firstName: 'Regular',
      lastName: 'User',
      role: 'renter',
    });

    try {
      await signInUser(page, regularUser.email, 'TestPassword123!');
      
      // Try to access admin route (route is /admin, not /admin/dashboard)
      await page.goto('/admin');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

      // Should be redirected away (wait for redirect)
      await page.waitForTimeout(2000);
      await expect(page).not.toHaveURL(/\/admin/, { timeout: 10000 });
    } finally {
      if (regularUser.id) {
        await deleteTestUser(regularUser.id);
      }
    }
  });
});

